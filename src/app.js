import express from "express";
import { generateFingerprint } from "./eleme_fp.js";
import { sendCode, loginBySms } from "./eleme_login.js";

const app = express();
app.use(express.json({ limit: "2mb" }));

function ok(res, data) {
  res.status(200).json({ ok: true, ...data });
}

function fail(res, err, status = 400) {
  const message = err && err.message ? err.message : String(err || "error");
  res.status(status).json({ ok: false, error: message });
}

function mount(method, paths, handler) {
  for (const p of paths) app[method](p, handler);
}

const healthPaths = ["/eleme/health", "/api/eleme/health", "/"];
const fpPaths = ["/eleme/fp", "/api/eleme/fp"];
const sendPaths = ["/eleme/sms/send", "/api/eleme/sms/send"];
const loginPaths = ["/eleme/sms/login", "/api/eleme/sms/login"];

mount("get", healthPaths, (_req, res) => {
  ok(res, { service: "eleme-edgeone-makers", ts: Date.now() });
});

mount("post", fpPaths, async (req, res) => {
  try {
    const fp = await generateFingerprint(req.body || {});
    if (!fp.ok) return fail(res, fp.error || "fingerprint failed", 500);
    ok(res, {
      ua: fp.ua,
      bxUa: fp.bxUa,
      bxUmidToken: fp.bxUmidToken,
      cookies: fp.cookies || {},
    });
  } catch (e) {
    fail(res, e, 500);
  }
});

mount("post", sendPaths, async (req, res) => {
  try {
    const phone = req.body && req.body.phone;
    const phoneCode = (req.body && req.body.phoneCode) || "86";
    const session = await sendCode(phone, phoneCode);
    ok(res, { session });
  } catch (e) {
    fail(res, e, 500);
  }
});

mount("post", loginPaths, async (req, res) => {
  try {
    const session = req.body && req.body.session;
    const smsCode = req.body && req.body.smsCode;
    const result = await loginBySms(session, smsCode);
    ok(res, result);
  } catch (e) {
    fail(res, e, 500);
  }
});

app.use((req, res) => {
  fail(res, `not found: ${req.method} ${req.path}`, 404);
});

export default app;
