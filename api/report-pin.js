// City Arena — the Reports PIN, kept on Vercel (owner, 20 October). The PIN and a signing key are Vercel environment variables
// (REPORT_PIN, REPORT_KEY), set by the owner in the Vercel project's settings; neither is in this file or in the page.
// A right PIN gets a pass: an expiry time signed with REPORT_KEY. The Apps Script server holds the same REPORT_KEY and sends
// the report figures only for a pass it can check. A wrong PIN waits a second before answering, to slow guessing.
const crypto = require('crypto');
const ORIGINS = ["https://cityarena-manipal.vercel.app"];
const allowed = origin => ORIGINS.includes(origin) || /^https:\/\/[a-z0-9-]+-script\.googleusercontent\.com$/.test(origin || '');
const same = (a, b) => crypto.timingSafeEqual(crypto.createHash('sha256').update(String(a)).digest(), crypto.createHash('sha256').update(String(b)).digest());
module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  if (allowed(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'POST'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); return res.status(204).end(); }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Not allowed.' });
  const pin = process.env.REPORT_PIN, key = process.env.REPORT_KEY;
  if (!pin || !key) return res.status(503).json({ error: 'The Reports PIN is not set up on Vercel yet.' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  if (!same(String(body.pin || ''), pin)) {
    await new Promise(done => setTimeout(done, 1000));
    return res.status(401).json({ error: 'That PIN is not right.' });
  }
  // Remembered on this device: a year; otherwise twelve hours.
  const expires = String(Date.now() + (body.remember ? 365 : 0.5) * 86400000);
  return res.status(200).json({ pass: expires + '.' + crypto.createHmac('sha256', key).update(expires).digest('hex') });
};
