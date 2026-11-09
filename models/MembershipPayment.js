import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;

// One provider order per subscription; retries reuse it rather than charging
// against another order. Never store card details, signatures or raw webhooks.
const schema = new Schema({
  subscription: { type: Schema.Types.ObjectId, ref: 'MembershipSubscription', required: true, unique: true },
  lead: { type: Schema.Types.ObjectId, ref: 'VerifiedLead', required: true, index: true },
  amount: { type: Number, required: true, min: 100 },
  currency: { type: String, enum: ['INR', 'USD'], required: true },
  planName: { type: String, required: true },
  billingPeriod: { type: String, required: true },
  status: { type: String, enum: ['creating', 'created', 'failed', 'paid', 'partially_refunded', 'refunded', 'review_required'], default: 'creating' },
  orderId: { type: String, unique: true, sparse: true },
  paymentId: { type: String, unique: true, sparse: true },
  refundedAmount: { type: Number, default: 0 },
  paidAt: { type: Date, default: null },
  orderLockUntil: { type: Date, default: null },
  creationAttempted: { type: Boolean, default: false },
}, { timestamps: true });

export default models.MembershipPayment || model('MembershipPayment', schema);
