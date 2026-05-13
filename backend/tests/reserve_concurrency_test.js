// Usage: set TEST_API_URL and TEST_TOKEN and PRODUCT_ID then run with node
// Example (powershell):
// $env:TEST_API_URL='http://localhost:5000'; $env:TEST_TOKEN='Bearer ...'; $env:PRODUCT_ID='...'; node tests/reserve_concurrency_test.js

const API_URL = process.env.TEST_API_URL || 'http://localhost:5000';
const TOKEN = process.env.TEST_TOKEN;
const PRODUCT_ID = process.env.PRODUCT_ID;

if (!TOKEN || !PRODUCT_ID) {
  console.error('Please set TEST_TOKEN and PRODUCT_ID env vars');
  process.exit(1);
}

const fetch = global.fetch || require('node-fetch');

async function reserveOnce(label) {
  const res = await fetch(`${API_URL}/api/payment/reserve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: TOKEN,
    },
    body: JSON.stringify({ orderItems: [{ product: PRODUCT_ID, qty: 1 }] }),
  });
  const data = await res.json();
  return { status: res.status, body: data };
}

(async () => {
  console.log('Starting two parallel reservations for product', PRODUCT_ID);
  const [a, b] = await Promise.all([reserveOnce('A'), reserveOnce('B')]);

  console.log('Result A:', a.status, a.body);
  console.log('Result B:', b.status, b.body);

  if ((a.status === 201 && b.status === 400) || (a.status === 400 && b.status === 201)) {
    console.log('PASS: one succeeded and one failed as expected');
  } else {
    console.warn('UNEXPECTED: concurrency results may be incorrect');
  }

  process.exit(0);
})();
