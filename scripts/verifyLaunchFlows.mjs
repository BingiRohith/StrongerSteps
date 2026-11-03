/**
 * Opt-in integration verification. Reads a bounded copy of existing leads,
 * writes only to a uniquely named temporary database, then drops that database.
 * No email/SMS is sent. OTP transport is mock; a generated verification's hash
 * is replaced inside the isolated database to exercise real verification APIs.
 * Run: node scripts/verifyLaunchFlows.mjs --isolated-copy
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import assert from 'node:assert/strict';
import { randomBytes, randomInt, createHmac } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile, unlink, mkdtemp, rmdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

dotenv.config({ path: '.env.local', quiet: true });
assert.ok(process.argv.includes('--isolated-copy'), 'Requires --isolated-copy');
assert.ok(process.env.MONGODB_URI, 'MONGODB_URI is required');
const runId = randomBytes(6).toString('hex');
const databaseName = `strongersteps_verify_${runId}`;
const uri = new URL(process.env.MONGODB_URI);
uri.pathname = `/${databaseName}`;
const source = new mongoose.mongo.MongoClient(process.env.MONGODB_URI);
const isolated = new mongoose.mongo.MongoClient(uri.href);
let server;
let gatewayDirectory;
const testFiles = [];
const port = Number(process.env.VERIFY_PORT || 3117);
const base = `http://127.0.0.1:${port}`;
let checkCount = 0;
function passed(label) { checkCount += 1; console.log(`PASS ${label}`); }
async function child(command, args, env) {
  const proc = spawn(command, args, { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  proc.stdout.on('data', (data) => { output += data; });
  proc.stderr.on('data', (data) => { output += data; });
  const code = await new Promise((resolve, reject) => { proc.once('error', reject); proc.once('exit', resolve); });
  assert.equal(code, 0, 'Child verification step failed (output withheld to protect configuration)');
  return output;
}
try {
  await source.connect();
  await isolated.connect();
  const db = isolated.db(databaseName);
  assert.equal(db.databaseName, databaseName);
  assert.notEqual(source.db().databaseName, databaseName);
  const existingLeads = await source.db().collection('verifiedleads').find({}).limit(1000).toArray();
  if (existingLeads.length) await db.collection('verifiedleads').insertMany(existingLeads);
  const oldIndexes = await source.db().collection('verifiedleads').indexes();
  for (const index of oldIndexes.filter((entry) => entry.name !== '_id_')) {
    const { key, name, unique, sparse, partialFilterExpression, expireAfterSeconds } = index;
    await db.collection('verifiedleads').createIndex(key, {
      name, ...(unique && { unique }), ...(sparse && { sparse }),
      ...(partialFilterExpression && { partialFilterExpression }),
      ...(expireAfterSeconds !== undefined && { expireAfterSeconds }),
    });
  }
  // Include deterministic legacy-null records even if the source was migrated.
  for (const field of ['email', 'mobile']) {
    if (!await db.collection('verifiedleads').findOne({ [field]: { $type: 10 } })) {
      await db.collection('verifiedleads').insertOne({ [field]: null });
    }
  }
  const before = await db.collection('verifiedleads').find({}).toArray();
  const env = {
    ...process.env, MONGODB_URI: uri.href, NODE_ENV: 'production',
    JWT_SECRET: randomBytes(32).toString('hex'), OTP_EMAIL_PROVIDER: 'mock', OTP_SMS_PROVIDER: 'mock',
    NOTIFICATION_EMAIL_PROVIDER: 'mock', NOTIFICATION_SMS_PROVIDER: 'mock',
    RAZORPAY_KEY_ID: 'rzp_test_isolated', RAZORPAY_KEY_SECRET: randomBytes(32).toString('hex'),
    RAZORPAY_WEBHOOK_SECRET: randomBytes(32).toString('hex'),
  };
  await child(process.execPath, ['scripts/migrateVerifiedLeadNulls.mjs'], env);
  assert.equal(await db.collection('verifiedleads').countDocuments({ $or: [{ email: { $type: 10 } }, { mobile: { $type: 10 } }] }), 0);
  const after = await db.collection('verifiedleads').find({}).toArray();
  assert.deepEqual(after, before.map((lead) => {
    const expected = { ...lead };
    if (expected.email === null) delete expected.email;
    if (expected.mobile === null) delete expected.mobile;
    return expected;
  }));
  passed(`Migration on isolated copy (${existingLeads.length} source leads); only explicit null identifiers changed`);
  const rerun = await child(process.execPath, ['scripts/migrateVerifiedLeadNulls.mjs'], env);
  assert.equal((rerun.match(/on 0 lead\(s\)/g) || []).length, 2);
  assert.deepEqual(await db.collection('verifiedleads').find({}).toArray(), after);
  passed('Migration second run is a no-op');
  const oid = () => new mongoose.Types.ObjectId();
  const plan = { _id: oid(), name: 'Verification plan', shortDescription: 'Isolated regression fixture', status: 'active', billingPeriod: 'monthly', price: 100, currency: 'INR' };
  const courseId = oid(); const resourceId = oid(); const fileId = oid(); const memberFileId = oid(); const lessonId = oid(); const toolId = oid(); const questionId = oid();
  await db.collection('memberships').insertOne(plan);
  await db.collection('courses').insertOne({ _id: courseId, title: 'Verification course', slug: `verify-course-${runId}`, status: 'published' });
  await db.collection('resources').insertOne({ _id: resourceId, title: 'Verification resource', slug: `verify-resource-${runId}`, status: 'published', deletedAt: null });
  const filename = `verify-${runId}.pdf`;
  const content = '%PDF-1.4\nIsolated regression fixture\n%%EOF';
  for (const directory of ['resources-files', 'lessons-pdfs', 'infographics-pdfs']) {
    const absolute = path.join(process.cwd(), 'private-uploads', directory, filename);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, content, { flag: 'wx' }); testFiles.push(absolute);
  }
  await db.collection('resourcefiles').insertMany([fileId, memberFileId].map((_id, index) => ({
    _id, resource: resourceId, title: 'Verification PDF', fileType: 'pdf', accessLevel: index ? 'MEMBER' : 'OTP',
    deletedAt: null, file: { url: filename, filename, mimeType: 'application/pdf' }, downloadable: true,
  })));
  await db.collection('lessons').insertOne({ _id: lessonId, section: oid(), course: courseId, title: 'Verification lesson', accessLevel: 'OTP', pdf: { url: filename, filename } });
  const infographicId = oid();
  await db.collection('infographics').insertOne({ _id: infographicId, title: 'Verification infographic', status: 'published', pdf: { url: filename, filename } });
  await db.collection('tools').insertOne({ _id: toolId, title: 'Verification tool', slug: `verify-tool-${runId}`, status: 'published', accessLevel: 'OTP' });
  await db.collection('toolquestions').insertOne({ _id: questionId, tool: toolId, section: oid(), questionText: 'Fixture', questionType: 'radio', required: true, options: [{ label: 'Yes', value: 'yes', score: 2 }] });
  await db.collection('toolresultbands').insertOne({ tool: toolId, minScore: 0, maxScore: 10, label: 'Fixture result' });
  const adminEmail = `admin-${runId}@example.invalid`; const adminPassword = randomBytes(20).toString('hex');
  await db.collection('users').insertOne({ name: 'Regression admin', email: adminEmail, password: await bcrypt.hash(adminPassword, 12), role: 'admin', isActive: true });
  await db.collection('membershipsubscriptions').createIndex({ lead: 1 }, { unique: true, partialFilterExpression: { status: { $in: ['pending', 'active'] } } });
  gatewayDirectory = await mkdtemp(path.join(os.tmpdir(), 'strongersteps-gateway-'));
  const gatewayFile = path.join(gatewayDirectory, 'state.json');
  await writeFile(gatewayFile, JSON.stringify({ orders: {}, payments: {} }));
  env.RAZORPAY_TEST_STATE_FILE = gatewayFile;
  const fixture = pathToFileURL(path.join(process.cwd(), 'tests/helpers/razorpayGateway.mjs')).href;
  server = spawn(process.execPath, ['--import', fixture, 'node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  // Never print server output: legacy error paths may contain sensitive details.
  server.stdout.resume(); server.stderr.resume();
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    if (server.exitCode !== null) throw new Error('Verification server exited');
    try { if ((await fetch(`${base}/api/me`)).ok) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  assert.ok(ready, 'Verification server did not become ready');
  async function request(route, { method = 'GET', body, cookie = '' } = {}) {
    const res = await fetch(`${base}${route}`, { method, headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, ...(body && { body: JSON.stringify(body) }) });
    const data = res.headers.get('content-type')?.includes('application/json') ? await res.json() : await res.text();
    return { status: res.status, data, cookie: res.headers.get('set-cookie')?.split(';')[0] };
  }
  async function verify(method, value, { type = 'membership', id = plan._id, cookie = '' } = {}) {
    const generated = await request('/api/verify/generate-otp', { method: 'POST', body: { resourceType: type, resourceId: String(id), method, [method === 'email' ? 'email' : 'mobile']: value } });
    assert.equal(generated.status, 201, `Generate ${type}/${method} OTP failed`);
    const otp = String(randomInt(100000, 1000000));
    // Test transport substitution is confined to the throwaway database.
    await db.collection('verifications').updateOne({ _id: new mongoose.Types.ObjectId(generated.data.verificationId) }, { $set: { otpHash: await bcrypt.hash(otp, 10) } });
    const verified = await request('/api/verify/verify-otp', { method: 'POST', cookie, body: { verificationId: generated.data.verificationId, otp } });
    assert.equal(verified.status, 200, `Verify ${type}/${method} OTP failed`);
    assert.ok(verified.cookie); assert.ok(verified.data.downloadToken);
    return verified;
  }
  const email = `email-${runId}@example.invalid`;
  const emailSession = await verify('email', email);
  await verify('email', `email-second-${runId}@example.invalid`);
  assert.equal(Object.hasOwn(await db.collection('verifiedleads').findOne({ email }), 'mobile'), false);
  passed('Two email-only verifications back-to-back');
  const mobile = String(randomInt(7000000000, 7999999999));
  await verify('mobile', mobile); await verify('mobile', String(Number(mobile) + 1));
  assert.equal(Object.hasOwn(await db.collection('verifiedleads').findOne({ mobile }), 'email'), false);
  passed('Two mobile-only verifications back-to-back');
  const linkedMobile = String(Number(mobile) + 2);
  const linked = await verify('mobile', linkedMobile, { cookie: emailSession.cookie });
  const me = await request('/api/me', { cookie: linked.cookie });
  assert.equal(me.data.lead.email, email); assert.equal(me.data.lead.mobile, linkedMobile);
  passed('Email and mobile verified on one permanent identity');
  const existing = existingLeads.find((lead) => !lead.mergedInto && (lead.email || lead.mobile));
  if (existing) {
    const method = existing.email ? 'email' : 'mobile';
    const relogin = await verify(method, existing[method]);
    const current = await request('/api/me', { cookie: relogin.cookie });
    assert.equal(current.data.lead.id, String(existing._id));
    passed('Existing copied lead authenticates with the same identity');
  } else throw new Error('No existing lead available for reauthentication check');
  const admin = await request('/api/auth/login', { method: 'POST', body: { email: adminEmail, password: adminPassword } });
  assert.equal(admin.status, 200); assert.ok(admin.cookie);
  passed('Admin authentication');
  assert.equal((await request('/api/membership/requests', { method: 'POST', body: { planId: String(plan._id) } })).status, 401);
  const requests = await Promise.all([1, 2].map(() => request('/api/membership/requests', { method: 'POST', cookie: linked.cookie, body: { planId: String(plan._id) } })));
  assert.deepEqual(requests.map((entry) => entry.status).sort(), [201, 409]);
  const sub = await db.collection('membershipsubscriptions').findOne({ lead: new mongoose.Types.ObjectId(me.data.lead.id) });
  assert.equal(await db.collection('membershipsubscriptions').countDocuments({ lead: sub.lead }), 1);
  passed('Membership request and concurrent duplicate conflict');
  assert.equal((await request(`/api/admin/members/${sub._id}`, { cookie: admin.cookie })).status, 200);
  assert.equal((await request(`/admin/members/${sub._id}`, { cookie: admin.cookie })).status, 200);
  assert.equal((await request('/api/admin/members?status=pending&search=Verification', { cookie: admin.cookie })).data.pagination.total, 1);
  passed('Admin member detail, page, search and status filter');
  const endpoint = `/api/admin/members/${sub._id}/status`;
  const action = (value, extra = {}) => request(endpoint, { method: 'PATCH', cookie: admin.cookie, body: { action: value, ...extra } });
  assert.equal((await action('activate', { expiresAt: 'not-a-date' })).status, 400);
  assert.equal((await action('activate', { expiresAt: '2020-01-01' })).status, 400);
  assert.equal((await db.collection('membershipsubscriptions').findOne({ _id: sub._id })).status, 'pending');
  passed('Invalid activation dates leave the request pending');
  assert.equal((await request(`/api/resource-files/${memberFileId}`, { cookie: linked.cookie })).status, 403);
  assert.equal((await action('activate')).status, 200);
  assert.equal((await action('activate')).status, 409);
  assert.equal((await request('/api/me', { cookie: linked.cookie })).data.membership.status, 'active_member');
  assert.equal((await request(`/api/resource-files/${memberFileId}`, { cookie: linked.cookie })).data, content);
  passed('Transactional activation, duplicate conflict and premium resource access');
  assert.equal((await action('expire')).status, 200); assert.equal((await action('expire')).status, 409);
  assert.equal((await request('/api/me', { cookie: linked.cookie })).data.membership.status, 'expired_member');
  assert.equal((await request(`/api/resource-files/${memberFileId}`, { cookie: linked.cookie })).status, 403);
  passed('Expiration revokes membership access');
  const renewal = await request('/api/membership/requests', { method: 'POST', cookie: linked.cookie, body: { planId: String(plan._id) } });
  assert.equal(renewal.status, 201);
  const pending = await db.collection('membershipsubscriptions').findOne({ lead: sub.lead, status: 'pending' });
  const cancel = () => request(`/api/admin/members/${pending._id}/status`, { method: 'PATCH', cookie: admin.cookie, body: { action: 'cancel' } });
  assert.equal((await cancel()).status, 200); assert.equal((await cancel()).status, 409);
  passed('Renewal request and repeated cancellation');
  const lapsedId = oid();
  const past = new Date(Date.now() - 60000);
  await db.collection('membershipsubscriptions').insertOne({ _id: lapsedId, lead: sub.lead, plan: plan._id, status: 'active', paymentStatus: 'manual', expiresAt: past });
  await db.collection('verifiedleads').updateOne({ _id: sub.lead }, { $set: { membership: plan._id, membershipExpiry: past } });
  assert.equal((await request('/api/membership/requests', { method: 'POST', cookie: linked.cookie, body: { planId: String(plan._id) } })).status, 201);
  assert.equal((await db.collection('membershipsubscriptions').findOne({ _id: lapsedId })).status, 'expired');
  passed('Calendar expiry allows a new request without a scheduled worker');
  const orphanId = oid();
  await db.collection('membershipsubscriptions').insertOne({ _id: orphanId, lead: oid(), plan: plan._id, status: 'pending', paymentStatus: 'pending' });
  const orphanResult = await request(`/api/admin/members/${orphanId}/status`, { method: 'PATCH', cookie: admin.cookie, body: { action: 'activate' } });
  assert.equal(orphanResult.status, 404);
  assert.equal((await db.collection('membershipsubscriptions').findOne({ _id: orphanId })).status, 'pending');
  passed('Activation rolls back subscription changes when lead synchronization fails');
  for (const [type, id, kind] of [['resource', resourceId, String(fileId)], ['lesson', lessonId, 'pdf'], ['infographic', infographicId, 'pdf']]) {
    const session = await verify('email', `${type}-${runId}@example.invalid`, { type, id });
    const result = await request(`/api/verify/download?token=${encodeURIComponent(session.data.downloadToken)}&fileKind=${kind}`, { cookie: session.cookie });
    assert.equal(result.status, 200); assert.equal(result.data, content);
    passed(`${type} OTP verification and protected download`);
  }
  const toolPath = `/api/tools/verify-tool-${runId}/attempt`;
  const answers = [{ questionId: String(questionId), value: 'yes' }];
  assert.equal((await request(toolPath, { method: 'POST', body: { answers } })).status, 401);
  const toolSession = await verify('email', `tool-${runId}@example.invalid`, { type: 'tool', id: toolId });
  const result = await request(toolPath, { method: 'POST', body: { answers, downloadToken: toolSession.data.downloadToken } });
  assert.equal(result.status, 200); assert.equal(result.data.totalScore, 2);
  passed('Tool OTP verification and scored result');
  assert.equal((await request('/dashboard', { cookie: linked.cookie })).status, 200);
  assert.equal((await request('/join')).data.includes('https://wa.me/'), false);
  passed('Dashboard renders and membership page has no WhatsApp redirect');
  const payer = await verify('email', `payer-${runId}@example.invalid`);
  const checkoutRequest = (cookie = payer.cookie, extra = {}) => request('/api/membership/checkout', { method: 'POST', cookie, body: { planId: String(plan._id), amount: 1, ...extra } });
  assert.equal((await checkoutRequest('')).status, 401);
  const first = await checkoutRequest();
  assert.equal(first.status, 200);
  const checkout = first.data.checkout;
  assert.equal(checkout.amount, 10000); // Client's amount:1 must be ignored.
  const repeated = await Promise.all([checkoutRequest(), checkoutRequest()]);
  assert.ok(repeated.every((entry) => entry.status === 200 && entry.data.checkout.orderId === checkout.orderId));
  passed('Authenticated checkout uses server price and reuses its gateway order');
  let gatewayState = JSON.parse(await readFile(gatewayFile, 'utf8'));
  assert.equal(Object.keys(gatewayState.orders).length, 1);
  const payId = 'pay_FixtureCaptured';
  async function setGatewayPayment(id, order, values = {}) {
    gatewayState = JSON.parse(await readFile(gatewayFile, 'utf8'));
    gatewayState.payments[id] = { id, order_id: order.orderId, amount: order.amount, currency: order.currency, status: 'captured', amount_refunded: 0, ...values };
    await writeFile(gatewayFile, JSON.stringify(gatewayState));
  }
  await setGatewayPayment(payId, checkout, { status: 'authorized' });
  const callbackBody = (order, id) => ({ razorpay_order_id: order.orderId, razorpay_payment_id: id,
    razorpay_signature: createHmac('sha256', env.RAZORPAY_KEY_SECRET).update(`${order.orderId}|${id}`).digest('hex') });
  const callback = (order, id, cookie = payer.cookie, extra = {}) => request('/api/membership/payments/verify', { method: 'POST', cookie, body: { ...callbackBody(order, id), ...extra } });
  assert.equal((await callback(checkout, payId, payer.cookie, { razorpay_signature: '0'.repeat(64) })).status, 400);
  assert.equal((await callback(checkout, payId, linked.cookie)).status, 404);
  assert.equal((await callback(checkout, payId)).status, 202);
  assert.equal((await request('/api/me', { cookie: payer.cookie })).data.membership.status, 'registered');
  passed('Forged/cross-user callbacks are rejected; authorization alone grants no access');
  await setGatewayPayment(payId, checkout, { amount: 1 });
  assert.equal((await callback(checkout, payId)).status, 409);
  await setGatewayPayment(payId, checkout);
  const captures = await Promise.all([callback(checkout, payId), callback(checkout, payId)]);
  assert.ok(captures.every((entry) => entry.status === 200));
  const paidSub = await db.collection('membershipsubscriptions').findOne({ _id: new mongoose.Types.ObjectId(checkout.subscriptionId) });
  assert.equal(paidSub.status, 'active'); assert.equal(paidSub.paymentStatus, 'paid');
  const expiry = paidSub.expiresAt.toISOString();
  const webhook = async (event, id, signatureOverride) => {
    const payload = event === 'refund.processed' ? { refund: { entity: { payment_id: id } } } : { payment: { entity: { id } } };
    const raw = JSON.stringify({ event, payload });
    const res = await fetch(`${base}/api/payments/razorpay/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-razorpay-event-id': `fixture-${id}`, 'x-razorpay-signature': signatureOverride || createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest('hex') }, body: raw });
    return res.status;
  };
  assert.equal(await webhook('payment.captured', payId, '0'.repeat(64)), 400);
  assert.equal(await webhook('payment.captured', payId), 200);
  assert.equal(await webhook('payment.captured', payId), 200);
  assert.equal((await db.collection('membershipsubscriptions').findOne({ _id: paidSub._id })).expiresAt.toISOString(), expiry);
  passed('Captured payment activates once across concurrent callbacks and repeated webhooks');
  assert.equal((await request(`/api/membership/payments/${checkout.id}/receipt`, { cookie: payer.cookie })).status, 200);
  assert.equal((await request(`/api/membership/payments/${checkout.id}/receipt`, { cookie: linked.cookie })).status, 404);
  passed('Payment receipt is restricted to its owner or staff');
  await setGatewayPayment(payId, checkout, { amount_refunded: 1000 });
  assert.equal(await webhook('refund.processed', payId), 200);
  assert.equal((await request('/api/me', { cookie: payer.cookie })).data.membership.status, 'active_member');
  await setGatewayPayment(payId, checkout, { amount_refunded: checkout.amount });
  assert.equal(await webhook('refund.processed', payId), 200);
  assert.equal(await webhook('payment.captured', payId), 200);
  assert.equal((await request('/api/me', { cookie: payer.cookie })).data.membership.status, 'expired_member');
  assert.equal((await db.collection('membershipsubscriptions').findOne({ _id: paidSub._id })).status, 'cancelled');
  passed('Partial refunds preserve access; full refunds revoke it and stale capture cannot restore it');
  const late = (await checkoutRequest()).data.checkout;
  await request(`/api/admin/members/${late.subscriptionId}/status`, { method: 'PATCH', cookie: admin.cookie, body: { action: 'cancel' } });
  await setGatewayPayment('pay_LateCapture', late);
  const lateResult = await callback(late, 'pay_LateCapture');
  assert.equal(lateResult.data.payment.status, 'review_required');
  assert.equal((await request('/api/me', { cookie: payer.cookie })).data.membership.status, 'expired_member');
  passed('Late capture after cancellation is retained for review without restoring access');
  const retryOrder = (await checkoutRequest()).data.checkout;
  await setGatewayPayment('pay_FailedAttempt', retryOrder, { status: 'failed' });
  assert.equal(await webhook('payment.failed', 'pay_FailedAttempt'), 200);
  assert.equal((await db.collection('membershipsubscriptions').findOne({ _id: new mongoose.Types.ObjectId(retryOrder.subscriptionId) })).paymentStatus, 'failed');
  const resumeOrder = (await checkoutRequest()).data.checkout;
  assert.equal(resumeOrder.orderId, retryOrder.orderId);
  await setGatewayPayment('pay_SuccessRetry', retryOrder);
  assert.equal(await webhook('payment.captured', 'pay_SuccessRetry'), 200);
  assert.equal(await webhook('payment.failed', 'pay_FailedAttempt'), 200);
  assert.equal((await request('/api/me', { cookie: payer.cookie })).data.membership.status, 'active_member');
  passed('Webhook-only capture succeeds after a failed attempt; stale failure cannot revoke access');
  // Simulate an order response that never reached the application database.
  await db.collection('membershippayments').updateOne({ _id: new mongoose.Types.ObjectId(retryOrder.id) }, { $unset: { orderId: '' } });
  assert.equal(await webhook('payment.captured', 'pay_SuccessRetry'), 200);
  assert.equal((await db.collection('membershippayments').findOne({ _id: new mongoose.Types.ObjectId(retryOrder.id) })).orderId, retryOrder.orderId);
  passed('Early webhook recovers an order binding from its server-owned receipt');
  console.log(`Verified ${checkCount} integration groups; delivery transport was mocked.`);
} catch (error) {
  // Assertion details may contain identifiers, tokens, or response bodies.
  console.error(`Verification failed: ${error.message?.split('\n')[0] || error.name}`);
  process.exitCode = 1;
} finally {
  if (server && server.exitCode === null) {
    server.kill();
    await Promise.race([new Promise((resolve) => server.once('exit', resolve)), new Promise((resolve) => setTimeout(resolve, 5000))]);
  }
  for (const file of testFiles) await unlink(file);
  if (gatewayDirectory) { await unlink(path.join(gatewayDirectory, 'state.json')); await rmdir(gatewayDirectory); }
  // Exact run-owned target; never drop the configured source database.
  if (isolated.topology?.isConnected() && isolated.db().databaseName === databaseName && /^strongersteps_verify_[a-f0-9]{12}$/.test(databaseName)) {
    await isolated.db(databaseName).dropDatabase();
    console.log('Removed isolated verification database and generated fixture files.');
  }
  await source.close(); await isolated.close();
}
process.exit(process.exitCode || 0);
