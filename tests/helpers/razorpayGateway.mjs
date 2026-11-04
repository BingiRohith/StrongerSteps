// Explicit Node --import fixture for the isolated launch runner only. The
// application has no gateway-origin override or production test bypass.
import fs from 'node:fs';
const stateFile = process.env.RAZORPAY_TEST_STATE_FILE;
if (!stateFile) throw new Error('Razorpay fixture requires isolated state');
const original = globalThis.fetch;
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url || String(input));
  if (url.origin !== 'https://api.razorpay.com') return original(input, options);
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
  if (url.pathname === '/v1/orders' && options.method === 'POST') {
    const body = JSON.parse(options.body);
    const existing = Object.values(state.orders).find((item) => item.receipt === body.receipt);
    if (existing) return json({ error: 'Duplicate receipt' }, 400);
    const order = { ...body, id: `order_${Object.keys(state.orders).length + 1}`, status: 'created' };
    state.orders[order.id] = order; fs.writeFileSync(stateFile, JSON.stringify(state));
    return json(order);
  }
  if (url.pathname === '/v1/orders') return json({ items: Object.values(state.orders).filter((item) => item.receipt === url.searchParams.get('receipt')) });
  if (url.pathname.startsWith('/v1/orders/')) return state.orders[url.pathname.split('/').pop()] ? json(state.orders[url.pathname.split('/').pop()]) : json({}, 404);
  if (url.pathname.startsWith('/v1/payments/')) {
    const id = url.pathname.split('/').pop();
    return state.payments[id] ? json(state.payments[id]) : json({ error: 'Unknown fixture payment' }, 404);
  }
  return json({ error: 'Unsupported fixture request' }, 404);
};
