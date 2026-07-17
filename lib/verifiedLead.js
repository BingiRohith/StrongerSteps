import connectDB from '@/lib/db';
import VerifiedLead from '@/models/VerifiedLead';
import { last10Digits, isValidMobile } from '@/lib/eventValidation';

const MAX_MERGE_CHAIN_HOPS = 5;

/**
 * Every plain "flat list of ObjectId refs" field on VerifiedLead — declared
 * once here so planLeadMerge()/toPlain() union and carry all of them
 * automatically. Adding a new field of this exact shape later (e.g. a
 * future `certificates`) means adding its name here, not hand-editing
 * merge logic — the earlier per-field-hardcoded version of this file
 * risked silently dropping a newly-added array's data on merge if a future
 * change forgot to update it by hand. Fields with a `{resourceType,
 * resourceId, ...}` shape (`purchasedItems`, `bookmarks`) or a different
 * shape entirely (`identifierLinks`) are NOT flat id lists and are handled
 * by their own dedicated union logic below instead.
 */
const ARRAY_ID_FIELDS = ['orders', 'invoices'];

/**
 * Fields shaped `[{resourceType, resourceId, <timestampKey>}]` — declared
 * once so a future field of this same shape (there are currently two) only
 * needs adding here, not a third hand-written union function.
 */
const RESOURCE_REF_LIST_FIELDS = [
  { field: 'purchasedItems', timestampKey: 'purchasedAt' },
  { field: 'bookmarks', timestampKey: 'savedAt' },
];

/** Custom error carrying the field-level conflicts that blocked a merge. */
export class LeadMergeConflictError extends Error {
  constructor(conflicts) {
    super('VerifiedLead merge blocked by conflicting field values');
    this.name = 'LeadMergeConflictError';
    this.conflicts = conflicts;
  }
}

/** Lowercase/trim, or null — same normalization every model in this app uses for email. */
export function normalizeEmail(email) {
  const trimmed = String(email || '').trim().toLowerCase();
  return trimmed || null;
}

/**
 * Reuses lib/eventValidation.js's last10Digits() — the same rule
 * app/api/bookings/lookup already matches mobile numbers by, so a stored
 * "+91 98765 43210" and a typed "9876543210" are recognized as the same
 * person here too. Returns null for anything that isn't a plausible mobile.
 */
export function normalizeMobile(mobile) {
  if (!mobile) return null;
  const digits = last10Digits(mobile);
  return digits.length === 10 ? digits : null;
}

/**
 * Pure decision function — given two plain lead-like objects (never a
 * Mongoose doc; keeps this testable without a DB), decides what the merged
 * record should look like and flags any field where both sides hold
 * different, non-null "identity-bearing" values. Conflicts are never
 * auto-resolved by this function — see mergeVerifiedLeads().
 */
export function planLeadMerge(primary, secondary) {
  const conflicts = [];

  function pickScalar(field, { isIdentity = false } = {}) {
    const a = primary[field] ?? null;
    const b = secondary[field] ?? null;
    if (a != null && b != null && String(a) !== String(b)) {
      if (isIdentity) conflicts.push({ field, primaryValue: a, secondaryValue: b });
      return a; // keep primary's value; identity conflicts are still reported above
    }
    return a ?? b ?? null;
  }

  function pickEarliestDate(field) {
    const a = primary[field] ? new Date(primary[field]) : null;
    const b = secondary[field] ? new Date(secondary[field]) : null;
    if (a && b) return a <= b ? a : b;
    return a || b || null;
  }

  function unionIds(field) {
    const a = (primary[field] || []).map(String);
    const b = (secondary[field] || []).map(String);
    return Array.from(new Set([...a, ...b]));
  }

  // purchasedItems/bookmarks aren't bare ids — dedupe by the (resourceType,
  // resourceId) pair, keeping the earlier timestamp when both sides
  // recorded the same resource independently.
  function unionResourceRefList(field, timestampKey) {
    const byKey = new Map();
    for (const entry of [...(primary[field] || []), ...(secondary[field] || [])]) {
      const key = `${entry.resourceType}:${entry.resourceId}`;
      const existing = byKey.get(key);
      if (!existing || new Date(entry[timestampKey]) < new Date(existing[timestampKey])) {
        byKey.set(key, entry);
      }
    }
    return Array.from(byKey.values());
  }

  const merged = {
    name: primary.name || secondary.name || '',
    email: pickScalar('email', { isIdentity: true }),
    mobile: pickScalar('mobile', { isIdentity: true }),
    preferredMethod: primary.preferredMethod || secondary.preferredMethod || null,
    emailVerifiedAt: pickEarliestDate('emailVerifiedAt'),
    mobileVerifiedAt: pickEarliestDate('mobileVerifiedAt'),
    linkedUser: pickScalar('linkedUser', { isIdentity: true }),
    membership: pickScalar('membership', { isIdentity: true }),
    membershipExpiry: primary.membership ? primary.membershipExpiry : secondary.membershipExpiry,
    identifierLinks: [...(primary.identifierLinks || []), ...(secondary.identifierLinks || [])],
  };

  for (const field of ARRAY_ID_FIELDS) {
    merged[field] = unionIds(field);
  }
  for (const { field, timestampKey } of RESOURCE_REF_LIST_FIELDS) {
    merged[field] = unionResourceRefList(field, timestampKey);
  }

  return { merged, conflicts };
}

function toPlain(leadDoc) {
  const plain = {
    name: leadDoc.name,
    email: leadDoc.email,
    mobile: leadDoc.mobile,
    preferredMethod: leadDoc.preferredMethod,
    emailVerifiedAt: leadDoc.emailVerifiedAt,
    mobileVerifiedAt: leadDoc.mobileVerifiedAt,
    linkedUser: leadDoc.linkedUser,
    membership: leadDoc.membership,
    membershipExpiry: leadDoc.membershipExpiry,
    identifierLinks: leadDoc.identifierLinks,
  };
  for (const field of ARRAY_ID_FIELDS) {
    plain[field] = leadDoc[field];
  }
  for (const { field } of RESOURCE_REF_LIST_FIELDS) {
    plain[field] = leadDoc[field];
  }
  return plain;
}

/**
 * Follows the mergedInto tombstone chain to the canonical, still-active
 * lead. Any caller holding a possibly-stale lead id (e.g. an old lead
 * session token) should resolve through this before trusting the record.
 */
export async function resolveActiveLead(leadId) {
  await connectDB();

  let current = await VerifiedLead.findById(leadId);
  let hops = 0;
  while (current?.mergedInto && hops < MAX_MERGE_CHAIN_HOPS) {
    current = await VerifiedLead.findById(current.mergedInto);
    hops += 1;
  }
  return current || null;
}

/**
 * Finds an existing active lead by normalized email/mobile, or creates one.
 * This is the function the OTP flow calls after every successful
 * verification — every future OTP-gated resource type reuses it with zero
 * extra code (see lib/verification/verificationService.js).
 */
export async function findOrCreateVerifiedLead({ name, email, mobile, method }) {
  await connectDB();

  const normalizedEmail = normalizeEmail(email);
  const normalizedMobile = normalizeMobile(mobile);
  const identifierField = method === 'email' ? 'email' : 'mobile';
  const identifierValue = method === 'email' ? normalizedEmail : normalizedMobile;

  if (!identifierValue) {
    throw new Error(`findOrCreateVerifiedLead: a valid ${method} is required`);
  }

  const now = new Date();
  const existing = await VerifiedLead.findOne({ [identifierField]: identifierValue, mergedInto: null });

  if (existing) {
    if (name && !existing.name) existing.name = name;
    existing.lastActivityAt = now;
    if (method === 'email') existing.emailVerifiedAt = existing.emailVerifiedAt || now;
    if (method === 'mobile') existing.mobileVerifiedAt = existing.mobileVerifiedAt || now;
    if (!existing.preferredMethod) existing.preferredMethod = method;
    await existing.save();
    return existing;
  }

  try {
    return await VerifiedLead.create({
      name: name || '',
      email: method === 'email' ? identifierValue : null,
      mobile: method === 'mobile' ? identifierValue : null,
      preferredMethod: method,
      emailVerifiedAt: method === 'email' ? now : null,
      mobileVerifiedAt: method === 'mobile' ? now : null,
      lastActivityAt: now,
      identifierLinks: [{ type: method, value: identifierValue, method: 'otp', linkedAt: now }],
    });
  } catch (err) {
    // Concurrent request created the same lead between our findOne and
    // create() — re-fetch rather than surfacing a duplicate-key error.
    if (err?.code === 11000) {
      const raceWinner = await VerifiedLead.findOne({ [identifierField]: identifierValue, mergedInto: null });
      if (raceWinner) return raceWinner;
    }
    throw err;
  }
}

/**
 * Merges `secondaryId` into `primaryId`. Throws LeadMergeConflictError
 * (without changing anything) if the two leads disagree on an
 * identity-bearing field (email, mobile, linkedUser, membership) — a
 * conflict means the "same person" assumption itself needs a human to
 * confirm, not something this function should guess through. On success,
 * the secondary lead is tombstoned (mergedInto set, its own email/mobile
 * cleared) rather than deleted, so any reference/token that still points
 * at it can be resolved via resolveActiveLead().
 */
export async function mergeVerifiedLeads(primaryId, secondaryId, { reason = 'admin_manual' } = {}) {
  await connectDB();

  if (String(primaryId) === String(secondaryId)) {
    throw new Error('Cannot merge a VerifiedLead into itself');
  }

  const [primary, secondary] = await Promise.all([
    VerifiedLead.findById(primaryId),
    VerifiedLead.findById(secondaryId),
  ]);
  if (!primary) throw new Error('Primary VerifiedLead not found');
  if (!secondary) throw new Error('Secondary VerifiedLead not found');
  if (primary.mergedInto || secondary.mergedInto) {
    throw new Error('Cannot merge a lead that has already been merged — resolve to the canonical lead first');
  }

  const { merged, conflicts } = planLeadMerge(toPlain(primary), toPlain(secondary));
  if (conflicts.length > 0) {
    throw new LeadMergeConflictError(conflicts);
  }

  Object.assign(primary, merged);
  await primary.save();

  secondary.mergedInto = primary._id;
  secondary.email = null;
  secondary.mobile = null;
  await secondary.save();

  return primary;
}

/**
 * The one "sufficient evidence" auto-merge path available this sprint:
 * proving a second identifier (email or mobile) via OTP *while an active
 * lead session already recognizes the visitor* is strong evidence they're
 * the same person (they hold both the session cookie and control of the
 * new channel). Anything weaker (matching name, coincidental timing) is
 * never auto-merged — see docs/13_DECISIONS.md.
 */
export async function linkIdentifierToLead(activeLeadId, { type, value, method }) {
  await connectDB();

  const identifierValue = type === 'email' ? normalizeEmail(value) : normalizeMobile(value);
  if (!identifierValue) throw new Error(`linkIdentifierToLead: invalid ${type}`);
  if (method !== 'otp') {
    throw new Error('linkIdentifierToLead: only otp evidence is auto-applied; use mergeVerifiedLeads directly for admin_manual');
  }

  const activeLead = await resolveActiveLead(activeLeadId);
  if (!activeLead) throw new Error('Active lead not found');

  const owner = await VerifiedLead.findOne({ [type]: identifierValue, mergedInto: null });

  if (!owner || String(owner._id) === String(activeLead._id)) {
    // No separate record owns this identifier yet — just attach it.
    activeLead[type] = identifierValue;
    activeLead[type === 'email' ? 'emailVerifiedAt' : 'mobileVerifiedAt'] = new Date();
    activeLead.identifierLinks.push({ type, value: identifierValue, method, linkedAt: new Date() });
    await activeLead.save();
    return activeLead;
  }

  // A different lead already owns this identifier — strong evidence
  // (proven via OTP under an already-recognized session) that they're the
  // same person, so merge rather than leaving two rows. Keep whichever
  // lead is older as canonical (first-verified identity wins).
  const [primary, secondary] =
    activeLead.createdAt <= owner.createdAt ? [activeLead, owner] : [owner, activeLead];
  return mergeVerifiedLeads(primary._id, secondary._id, { reason: 'otp_second_identifier' });
}

/**
 * Links a VerifiedLead to a User account (future registration/login flow —
 * not wired up this sprint, no such flow exists yet). If that User is
 * already linked to a *different* active lead, that's the other
 * strong-evidence auto-merge path this design anticipates: the same User
 * account proves both leads are the same person.
 */
export async function linkUserToLead(leadId, userId) {
  await connectDB();

  const lead = await resolveActiveLead(leadId);
  if (!lead) throw new Error('Lead not found');

  const existingForUser = await VerifiedLead.findOne({ linkedUser: userId, mergedInto: null });

  if (!existingForUser || String(existingForUser._id) === String(lead._id)) {
    lead.linkedUser = userId;
    lead.linkedUserAt = new Date();
    await lead.save();
    return lead;
  }

  const [primary, secondary] =
    lead.createdAt <= existingForUser.createdAt ? [lead, existingForUser] : [existingForUser, lead];
  return mergeVerifiedLeads(primary._id, secondary._id, { reason: 'linked_user_account' });
}
