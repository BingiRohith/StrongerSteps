import { createHmac, timingSafeEqual } from 'node:crypto';
import { membershipAmountMinor } from '@/lib/membershipPricing';

export class PaymentError extends Error {
  constructor(message, status = 400) { super(message); this.name = 'PaymentError'; this.status = status; }
}

export function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new PaymentError('Online payments are not configured yet. Please try again later.', 503);
  return { keyId, keySecret };
}

export function verifyHmac(message, signature, secret) {
  if (!secret || typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac('sha256', secret).update(message).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

export function membershipPrice(plan) {
  const amount = membershipAmountMinor(plan);
  if (!['INR', 'USD'].includes(plan.currency) || !Number.isSafeInteger(amount) || amount < 100) {
    throw new PaymentError('This plan is not available for online payment. Please choose another plan.');
  }
  return { amount, currency: plan.currency };
}

/** Fixed upstream origin; neither credentials nor upstream errors reach logs/UI. */
export async function razorpayRequest(resource, { method = 'GET', body } = {}) {
  const { keyId, keySecret } = getRazorpayConfig();
  let response;
  try {
    response = await fetch(`https://api.razorpay.com/v1/${resource}`, {
      method, cache: 'no-store', signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`, 'Content-Type': 'application/json' },
      ...(body && { body: JSON.stringify(body) }),
    });
  } catch {
    throw new PaymentError('The payment provider could not be reached. Please retry from your dashboard.', 503);
  }
  if (!response.ok) throw new PaymentError('The payment provider could not complete this request. Please try again later.', 502);
  return response.json();
}

export function assertPaymentMatches(payment, gatewayPayment) {
  if (gatewayPayment.order_id !== payment.orderId || gatewayPayment.amount !== payment.amount || gatewayPayment.currency !== payment.currency) {
    throw new PaymentError('The payment details do not match this membership order.', 409);
  }
}
