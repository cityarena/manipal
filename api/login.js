// City Arena — the manager sign-in, kept on Vercel (owner, 22 October). The username and password are Vercel environment
// variables (LOGIN_USERNAME, LOGIN_PASSWORD), set by the owner in the Vercel project's settings; neither is in this file or in
// the page. A right username and password get a short pass (two minutes) signed with REPORT_KEY; the Apps Script server holds
// the same REPORT_KEY and opens a session only for a pass it can check. The pass names a version made from the password, so a
// new password set on Vercel signs every device out at the next sign-in. A wrong try waits a second before answering.
const crypto = require('crypto');
const ORIGINS = ["https://cityarena-manipal.vercel.app"];
const allowed = origin => ORIGINS.includes(origin) || /^https:\/\/[a-z0-9-]+-script\.googleusercontent\.com$/.test(origin || '');
const same = (a, b) => crypto.timingSafeEqual(crypto.createHash('sha256').update(String(a)).digest(), crypto.createHash('sha256').update(String(b)).digest());
const sign = (key, text) => crypto.createHmac('sha256', key).update(text).digest('hex');
module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  if (allowed(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'POST'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); return res.status(204).end(); }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Not allowed.' });
  const user = String(process.env.LOGIN_USERNAME || '').trim().toLowerCase(), password = process.env.LOGIN_PASSWORD, key = process.env.REPORT_KEY;
  if (!user || !password || !key) return res.status(503).json({ error: 'The sign-in is not set up on Vercel yet.' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const name = String(body.username || '').trim().toLowerCase();
  if (!same(name, user) || !same(String(body.password || ''), password)) {
    await new Promise(done => setTimeout(done, 1000));
    return res.status(401).json({ error: 'Invalid username or password.' });
  }
  const expires = String(Date.now() + 2 * 60000), version = sign(key, 'version|' + password).slice(0, 16);
  return res.status(200).json({ pass: ['login', user, version, expires, sign(key, 'login|' + user + '|' + version + '|' + expires)].join('.') });
};
