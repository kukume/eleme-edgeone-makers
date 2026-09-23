import { generateFingerprint } from "./eleme_fp.js";
import { sendCode, loginBySms } from "./eleme_login.js";
import { ok, fail, readJson } from "./http.js";

export { json, ok, fail, wrap } from "./http.js";
export { health } from "./health.js";

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
