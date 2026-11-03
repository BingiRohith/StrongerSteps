'use client';

let loading;
export function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => window.Razorpay ? resolve() : reject(new Error('Checkout did not load.'));
    script.onerror = () => { loading = null; script.remove(); reject(new Error('Could not load secure checkout. Please try again.')); };
    document.body.appendChild(script);
  });
  return loading;
}

export async function openMembershipCheckout(checkout) {
  await loadRazorpayCheckout();
  return new Promise((resolve) => {
    const instance = new window.Razorpay({
      key: checkout.keyId, order_id: checkout.orderId, amount: checkout.amount, currency: checkout.currency,
      name: 'Stronger Steps', description: checkout.planName,
      handler: (result) => resolve({ result }),
      modal: { ondismiss: () => resolve({ dismissed: true }) },
      theme: { color: '#2F6B4F' },
    });
    // A failed attempt can be retried inside Checkout. Dismissal leaves the
    // same order resumable from the dashboard; the server controls access.
    instance.open();
  });
}
