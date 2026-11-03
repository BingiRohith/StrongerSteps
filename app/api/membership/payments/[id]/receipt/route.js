import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import MembershipPayment from '@/models/MembershipPayment';
import { getCurrentLead } from '@/lib/access/leadSession';
import { getCurrentUser } from '@/lib/auth';
import { paymentHandler, fail } from '@/lib/payments/api';
export const dynamic = 'force-dynamic';

export const GET = paymentHandler(async (request, { params }) => {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return fail('Invalid receipt.', 400);
  const [lead, admin] = await Promise.all([getCurrentLead(request), getCurrentUser(request)]);
  if (!lead && !admin) return fail('Please log in to view this receipt.', 401);
  await connectDB();
  const payment = await MembershipPayment.findOne({ _id: id, ...(!admin && { lead: lead._id }) }).lean();
  if (!payment || !payment.paidAt) return fail('Receipt not found.', 404);
  const text = [
    'Stronger Steps - Payment Receipt', `Receipt: SS-${payment._id}`,
    `Plan: ${payment.planName}`, `Amount: ${(payment.amount / 100).toFixed(2)} ${payment.currency}`,
    `Paid at: ${new Date(payment.paidAt).toISOString()}`, `Order: ${payment.orderId}`,
    `Payment: ${payment.paymentId}`, `Status: ${payment.status}`,
    `Refunded: ${((payment.refundedAmount || 0) / 100).toFixed(2)} ${payment.currency}`,
    '', 'This acknowledges payment; it is not a GST/tax invoice.',
  ].join('\n');
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': `attachment; filename="SS-${payment._id}.txt"`, 'Cache-Control': 'no-store' } });
});
