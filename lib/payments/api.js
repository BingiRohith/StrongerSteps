import { ok, fail } from '@/lib/apiResponse';
import { PaymentError } from './razorpay';

/** Keep provider payloads, authorization headers and signatures out of logs. */
export function paymentHandler(handler) {
  return async (request, context) => {
    try {
      const response = await handler(request, context);
      response.headers.set('Cache-Control', 'no-store');
      return response;
    } catch (error) {
      if (error instanceof PaymentError || error?.name === 'MembershipStateError') return fail(error.message, error.status || 400);
      if (error instanceof SyntaxError) return fail('Invalid request body.', 400);
      console.error('[MEMBERSHIP_PAYMENT_ERROR] Request could not be completed');
      return fail('Could not complete the payment request. Please retry from your dashboard.', 500);
    }
  };
}
export { ok, fail };
