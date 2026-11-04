import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Membership from '@/models/Membership';
import MembershipSubscription from '@/models/MembershipSubscription';
import MembershipPayment from '@/models/MembershipPayment';
import VerifiedLead from '@/models/VerifiedLead';
import { createMembershipRequest, MembershipRequestConflictError } from '@/lib/membershipSubscription';
import { applyMembershipActivation } from '@/lib/membershipSubscription';
import { PaymentError, getRazorpayConfig, membershipPrice, razorpayRequest, assertPaymentMatches } from './razorpay';

export function paymentSummary(payment) {
  return { id: String(payment._id), subscriptionId: String(payment.subscription), status: payment.status,
    amount: payment.amount, currency: payment.currency, planName: payment.planName,
    orderId: payment.orderId, paymentId: payment.paymentId, paidAt: payment.paidAt, refundedAmount: payment.refundedAmount };
}

export async function listMembershipPayments(leadId) {
  await connectDB();
  return (await MembershipPayment.find({ lead: leadId }).sort({ createdAt: -1 }).lean()).map(paymentSummary);
}

/** Receipt-based recovery handles a timed-out order creation without blindly
 * minting a second order. The short DB lease serializes concurrent checkouts. */
export async function createMembershipCheckout(lead, planId) {
  const { keyId } = getRazorpayConfig();
  await connectDB();
  await MembershipPayment.init();
  const plan = await Membership.findOne({ _id: planId, status: 'active' });
  if (!plan) throw new PaymentError('This membership plan is not available.', 404);
  const price = membershipPrice(plan);
  let subscription;
  try { subscription = await createMembershipRequest({ leadId: lead._id, planId }); }
  catch (error) {
    if (!(error instanceof MembershipRequestConflictError)) throw error;
    subscription = await MembershipSubscription.findOne({ lead: lead._id, plan: planId, status: 'pending' });
    if (!subscription) throw new PaymentError('You already have an active membership or a request for another plan.', 409);
  }
  let payment = await MembershipPayment.findOne({ subscription: subscription._id });
  if (!payment) {
    try {
      payment = await MembershipPayment.create({ subscription: subscription._id, lead: lead._id, ...price, planName: plan.name, billingPeriod: plan.billingPeriod });
    } catch (error) {
      if (error.code !== 11000) throw error;
      payment = await MembershipPayment.findOne({ subscription: subscription._id });
    }
  }
  if (['paid', 'refunded', 'partially_refunded', 'review_required'].includes(payment.status)) {
    throw new PaymentError('This payment has already been processed. Please check your dashboard.', 409);
  }
  if (!payment.orderId) {
    const locked = await MembershipPayment.findOneAndUpdate({ _id: payment._id, orderId: { $exists: false },
      $or: [{ orderLockUntil: null }, { orderLockUntil: { $lte: new Date() } }] },
    { $set: { orderLockUntil: new Date(Date.now() + 60000), creationAttempted: true } }, { new: false });
    if (!locked) throw new PaymentError('Your checkout is being prepared. Please retry in a moment.', 409);
    const receipt = `ss_${payment._id}`;
    try {
      let order;
      if (locked.creationAttempted) {
        const found = await razorpayRequest(`orders?receipt=${encodeURIComponent(receipt)}`);
        order = found.items?.find((item) => item.receipt === receipt);
        if (!order) throw new PaymentError('Your payment order is awaiting confirmation. Please retry shortly or contact support.', 409);
      }
      if (!order) order = await razorpayRequest('orders', { method: 'POST', body: { amount: payment.amount, currency: payment.currency, receipt, partial_payment: false, notes: { subscriptionId: String(subscription._id) } } });
      if (!/^order_[a-zA-Z0-9]+$/.test(order.id) || order.amount !== payment.amount || order.currency !== payment.currency) throw new PaymentError('The payment provider returned an unexpected order.', 502);
      payment = await MembershipPayment.findByIdAndUpdate(payment._id, { $set: { orderId: order.id, status: 'created', orderLockUntil: null } }, { new: true });
    } catch (error) {
      await MembershipPayment.updateOne({ _id: payment._id }, { $set: { orderLockUntil: null } });
      throw error;
    }
  }
  return { keyId, ...paymentSummary(payment) };
}

/** Both browser verification and webhooks converge here. Gateway state is
 * fetched afresh, so delayed failures cannot undo capture, and a refund that
 * arrives before a capture event cannot accidentally grant access. */
export async function reconcileMembershipPayment(paymentId) {
  if (!/^pay_[a-zA-Z0-9]+$/.test(paymentId || '')) throw new PaymentError('Invalid payment reference.');
  const gateway = await razorpayRequest(`payments/${paymentId}`);
  await connectDB();
  let stored = await MembershipPayment.findOne({ orderId: gateway.order_id });
  if (!stored && /^order_[a-zA-Z0-9]+$/.test(gateway.order_id || '')) {
    // A webhook can beat the order-create response. Recover its binding from
    // the provider's receipt, then process normally instead of dropping it.
    const order = await razorpayRequest(`orders/${gateway.order_id}`);
    if (/^ss_[a-f0-9]{24}$/.test(order.receipt || '')) {
      const candidate = await MembershipPayment.findById(order.receipt.slice(3));
      if (candidate && !candidate.orderId && order.amount === candidate.amount && order.currency === candidate.currency) {
        stored = await MembershipPayment.findOneAndUpdate({ _id: candidate._id, orderId: { $exists: false } }, { $set: { orderId: order.id, orderLockUntil: null } }, { new: true });
        if (!stored) stored = await MembershipPayment.findOne({ orderId: gateway.order_id });
      }
    }
  }
  if (!stored) return null; // Other product orders on the same gateway account.
  assertPaymentMatches(stored, gateway);
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const payment = await MembershipPayment.findById(stored._id).session(session);
      const subscription = await MembershipSubscription.findById(payment.subscription).session(session);
      if (!subscription) throw new PaymentError('Membership request could not be found.', 409);
      const refunded = Number(gateway.amount_refunded || 0);
      if (refunded >= payment.amount) {
        payment.status = 'refunded'; payment.refundedAmount = refunded; payment.paymentId = paymentId;
        payment.paidAt = payment.paidAt || new Date();
        subscription.paymentStatus = 'refunded';
        if (['pending', 'active'].includes(subscription.status)) {
          const wasActive = subscription.status === 'active';
          subscription.status = 'cancelled'; subscription.cancelledAt = new Date();
          const otherActive = await MembershipSubscription.exists({ lead: subscription.lead, _id: { $ne: subscription._id }, status: 'active' }).session(session);
          if (wasActive && !otherActive) await VerifiedLead.updateOne({ _id: subscription.lead, membership: subscription.plan }, { $set: { membershipExpiry: new Date() } }, { session });
        }
        await subscription.save({ session });
      } else if (gateway.status === 'captured') {
        if (payment.paymentId && payment.paymentId !== paymentId) throw new PaymentError('A different payment is already associated with this order.', 409);
        if (!['paid', 'partially_refunded', 'refunded', 'review_required'].includes(payment.status)) {
          payment.paymentId = paymentId; payment.paidAt = new Date();
          if (subscription.status === 'pending') {
            const lead = await VerifiedLead.findById(subscription.lead).session(session);
            if (!lead || lead.mergedInto) throw new PaymentError('Membership identity needs review before activation.', 409);
            await applyMembershipActivation(subscription, { _id: subscription.plan, billingPeriod: payment.billingPeriod }, lead, { session, paymentStatus: 'paid' });
            payment.status = 'paid';
          } else if (subscription.status === 'active') {
            subscription.paymentStatus = 'paid'; await subscription.save({ session }); payment.status = 'paid';
          } else {
            // A late capture after cancellation/expiry is retained for admin
            // reconciliation; it must never silently restore revoked access.
            payment.status = 'review_required'; subscription.paymentStatus = 'review_required'; await subscription.save({ session });
          }
        }
        if (refunded > payment.refundedAmount && payment.status !== 'refunded') {
          payment.refundedAmount = refunded;
          if (payment.status === 'paid') payment.status = 'partially_refunded';
        }
      } else if (gateway.status === 'failed' && !['paid', 'partially_refunded', 'refunded', 'review_required'].includes(payment.status)) {
        payment.status = 'failed'; subscription.paymentStatus = 'failed'; await subscription.save({ session });
      }
      await payment.save({ session });
      result = paymentSummary(payment);
    });
    return result;
  } finally { await session.endSession(); }
}
