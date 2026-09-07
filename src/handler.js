import { generateFingerprint } from "./eleme_fp.js";
import { sendCode, loginBySms } from "./eleme_login.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function ok(data) {
  return json({ ok: true, ...data });
}

function fail(err, status = 400) {
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

function normalizePath(pathname) {
  // /api/eleme/fp 与 /eleme/fp 都接受
  let p = pathname || "/";
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  if (p.startsWith("/api/")) p = p.slice(4);
  return p;
}

async function handle(request) {
  const url = new URL(request.url);
  const path = normalizePath(url.pathname);
  const method = (request.method || "GET").toUpperCase();

  if (method === "GET" && (path === "/eleme/health" || path === "/" || path === "/eleme")) {
    return ok({ service: "eleme-edgeone-makers", ts: Date.now(), path });
  }

  if (method === "POST" && path === "/eleme/fp") {
    const body = await readJson(request);
    const fp = await generateFingerprint(body || {});
    if (!fp.ok) return fail(fp.error || "fingerprint failed", 500);
    return ok({
      ua: fp.ua,
      bxUa: fp.bxUa,
      bxUmidToken: fp.bxUmidToken,
      cookies: fp.cookies || {},
    });
  }

  if (method === "POST" && path === "/eleme/sms/send") {
    const body = await readJson(request);
    const session = await sendCode(body.phone, body.phoneCode || "86");
    return ok({ session });
  }

  if (method === "POST" && path === "/eleme/sms/login") {
    const body = await readJson(request);
    const result = await loginBySms(body.session, body.smsCode);
    return ok(result);
  }

  return fail(`not found: ${method} ${url.pathname}`, 404);
}

// EdgeOne Node Cloud Functions — handler mode (比 Express 更稳，ZIP 上传不易丢路由)
export async function onRequest(context) {
  try {
    return await handle(context.request);
  } catch (e) {
    return fail(e, 500);
  }
}

export async function onRequestGet(context) {
  return onRequest(context);
}

export async function onRequestPost(context) {
  return onRequest(context);
}
