import { generateFingerprint } from "./eleme_fp.js";
import { sendCode, loginBySms } from "./eleme_login.js";

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function ok(data) {
  return json({ ok: true, ...data });
}

export function fail(err, status = 400) {
  const message = err && err.message ? err.message : String(err || "error");
  return json({ ok: false, error: message }, status);
}

async function readJson(request) {
  try {
    const text = await request.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    throw new Error("请求 Body 不是合法 JSON");
  }
}

export async function health() {
  return ok({ service: "eleme-edgeone-makers", ts: Date.now() });
}

export async function fp(request) {
  const body = await readJson(request);
  const result = await generateFingerprint(body || {});
  if (!result.ok) return fail(result.error || "fingerprint failed", 500);
  return ok({
    ua: result.ua,
    bxUa: result.bxUa,
    bxUmidToken: result.bxUmidToken,
    cookies: result.cookies || {},
  });
}

export async function smsSend(request) {
  const body = await readJson(request);
  const session = await sendCode(body.phone, body.phoneCode || "86");
  return ok({ session });
}

export async function smsLogin(request) {
  const body = await readJson(request);
  const result = await loginBySms(body.session, body.smsCode);
  return ok(result);
}

export function wrap(handler) {
  return async (context) => {
    try {
      return await handler(context.request);
    } catch (e) {
      return fail(e, 500);
    }
  };
}
