// City Arena — passes checked on Vercel (owner, 22 October: every secret a Vercel environment variable, none in Apps Script).
// The Apps Script server sends a sign-in pass or a Reports pass here; this checks its signature with REPORT_KEY (a Vercel
// environment variable) and says whether it is good. It reveals nothing but yes or no.
const crypto = require('crypto');
const sign = (key, text) => crypto.createHmac('sha256', key).update(text).digest('hex');
const same = (a, b) => crypto.timingSafeEqual(crypto.createHash('sha256').update(String(a)).digest(), crypto.createHash('sha256').update(String(b)).digest());
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Not allowed.' });
  const key = process.env.REPORT_KEY;
  if (!key) return res.status(503).json({ error: 'REPORT_KEY is not set on Vercel yet.' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const parts = String((body || {}).pass || '').split('.'), now = Date.now();
  // A sign-in pass: login.<username>.<version>.<expires>.<signature>, good for a few minutes.
  if (parts.length === 5 && parts[0] === 'login') {
    const good = Number(parts[3]) > now && Number(parts[3]) <= now + 5 * 60000 && same(sign(key, 'login|' + parts[1] + '|' + parts[2] + '|' + parts[3]), parts[4]);
    return res.status(200).json(good ? { ok: true, kind: 'login', username: parts[1], version: parts[2] } : { ok: false });
  }
  // A Reports pass: <expires>.<signature>.
  if (parts.length === 2) {
    const good = Number(parts[0]) > now && same(sign(key, parts[0]), parts[1]);
    return res.status(200).json(good ? { ok: true, kind: 'report', expires: Number(parts[0]) } : { ok: false });
  }
  return res.status(200).json({ ok: false });
};
