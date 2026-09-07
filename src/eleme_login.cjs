"use strict";

const crypto = require("crypto");
const { generateFingerprint } = require("./eleme_fp.cjs");

const APP_KEY = "12574478";
const BX_V = "2.5.11";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";
const H5 = "https://h5.ele.me";
const PASSPORT = "https://ipassport.ele.me";
const MTOP = "https://waimai-guide.ele.me";
const EG_JS = "https://log.mmstat.com/eg.js";

function md5(text) {
  return crypto.createHash("md5").update(String(text), "utf8").digest("hex");
}

function randAlnum(n) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < n; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function cookieValue(cookie, name) {
  const prefix = name + "=";
  for (const part of String(cookie || "").split(";")) {
    const item = part.trim();
    if (item.startsWith(prefix)) return item.slice(prefix.length);
  }
  return "";
}

function mergeCookie(...parts) {
  const seen = {};
  for (const part of parts) {
    if (!part) continue;
    for (const raw of String(part).split(";")) {
      const item = raw.trim();
      if (!item || !item.includes("=")) continue;
      const i = item.indexOf("=");
      const name = item.slice(0, i).trim();
      const value = item.slice(i + 1).trim();
      if (!name || value === "" || value === "deleted") continue;
      seen[name] = value;
    }
  }
  return Object.entries(seen)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function seedAnalyticsCookies() {
  const today = new Date().toISOString().slice(0, 10);
  const nowMs = Date.now();
  return mergeCookie(
    `ubt_ssid=${randAlnum(32)}_${today}`,
    `perf_ssid=${randAlnum(32)}_${today}`,
    `_bl_uid=${randAlnum(28)}`,
    `__ebg_utdid=${crypto.randomUUID()}-${nowMs}`,
    `arms_uid=${crypto.randomUUID()}`,
    `_uab_collina=${nowMs}${Math.floor(1e11 + Math.random() * 9e11)}`,
    "mtop_partitioned_detect=1",
  );
}

function parseSetCookie(headers) {
  let list = [];
  if (typeof headers.getSetCookie === "function") {
    list = headers.getSetCookie();
  } else {
    const raw = headers.raw ? headers.raw()["set-cookie"] : null;
    if (Array.isArray(raw)) list = raw;
    else {
      const one = headers.get("set-cookie");
      if (one) list = [one];
    }
  }
  const parts = [];
  for (const header of list) {
    const nv = String(header).split(";", 1)[0].trim();
    if (!nv || !nv.includes("=")) continue;
    const value = nv.split("=", 1)[1];
    if (value === "deleted") continue;
    parts.push(nv);
  }
  return parts.join("; ");
}

function findSetCookie(headers, name) {
  const merged = parseSetCookie(headers);
  return cookieValue(merged, name) || null;
}

function parseCna(text) {
  const m = text.match(/Etag\s*=\s*"([^"]+)"/) || text.match(/cna=([^;"'\s]+)/);
  return m ? m[1] : "";
}

function parseViewData(html) {
  let m = html.match(/window\.viewData\s*=\s*(\{[\s\S]*?\});\s*\n\s*window\._lang/);
  if (!m) m = html.match(/window\.viewData\s*=\s*(\{[\s\S]*?\});/);
  if (!m) throw new Error("未解析到饿了么登录页 viewData");
  return JSON.parse(m[1]);
}

function pageTraceId(html, headers) {
  const m = html.match(/name=["']eagleeye-trace["']\s+content=["']([^"']+)["']/);
  if (m) return m[1];
  return headers.get("eagleeye-traceid") || headers.get("htrace-id") || "";
}

function mtopSign(token, t, data) {
  return md5(`${token}&${t}&${APP_KEY}&${data}`);
}

function browserHeaders(cookie, { referer, origin } = {}) {
  const headers = {
    "User-Agent": UA,
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9",
    Referer: referer,
    Cookie: cookie,
  };
  if (origin) headers.Origin = origin;
  return headers;
}

async function httpRequest(url, { method = "GET", headers = {}, body } = {}) {
  const res = await fetch(url, { method, headers, body, redirect: "manual" });
  const text = await res.text();
  return { status: res.status, headers: res.headers, text, ok: res.status >= 200 && res.status < 300 };
}

async function fetchCna(cookie) {
  const res = await httpRequest(EG_JS, {
    headers: {
      "User-Agent": UA,
      Referer: `${H5}/`,
      Origin: H5,
      Accept: "*/*",
      Cookie: cookie,
    },
  });
  return findSetCookie(res.headers, "cna") || parseCna(res.text) || randAlnum(24);
}

async function mtopBootstrap(cookie) {
  const data = "{}";
  for (let i = 0; i < 2; i++) {
    const t = String(Date.now());
    const token = cookieValue(cookie, "_m_h5_tk").split("_")[0] || "";
    const sign = mtopSign(token, t, data);
    const query = new URLSearchParams({
      jsv: "2.7.5",
      appKey: APP_KEY,
      t,
      sign,
      api: "mtop.alsc.user.session.ele.check",
      v: "1.0",
      type: "originaljson",
      dataType: "json",
      timeout: "5000",
      mainDomain: "ele.me",
      subDomain: "waimai-guide",
      pageDomain: "ele.me",
      H5Request: "true",
      syncCookieMode: "true",
      method: "POST",
    });
    const res = await httpRequest(`${MTOP}/h5/mtop.alsc.user.session.ele.check/1.0/?${query}`, {
      method: "POST",
      headers: {
        ...browserHeaders(cookie, { referer: `${H5}/minisite/`, origin: H5 }),
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({ data }).toString(),
    });
    cookie = mergeCookie(cookie, parseSetCookie(res.headers));
    if (cookieValue(cookie, "_m_h5_tk")) return cookie;
  }
  return cookie;
}

async function openMiniLogin(cookie) {
  const loginUrl =
    `${PASSPORT}/mini_login.htm?` +
    new URLSearchParams({
      lang: "zh_cn",
      appName: "eleme",
      appEntrance: "eleme_sms_h5",
      styleType: "vertical",
      bizParams: "",
      notLoadSsoView: "true",
      notKeepLogin: "false",
      isMobile: "false",
      rnd: String(Math.random()),
    }).toString();
  const res = await httpRequest(loginUrl, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      Referer: `${H5}/`,
      Cookie: cookie,
      "Upgrade-Insecure-Requests": "1",
    },
  });
  if (res.status >= 400) throw new Error(`打开饿了么登录页失败: HTTP ${res.status}`);
  cookie = mergeCookie(cookie, parseSetCookie(res.headers));
  const view = parseViewData(res.text);
  const trace = pageTraceId(res.text, res.headers);
  return { cookie, view, loginUrl, trace };
}

async function runFp(loginUrl) {
  const fp = await generateFingerprint({
    userAgent: UA,
    url: loginUrl,
    screen: { width: 1707, height: 1067 },
    language: "zh-CN",
    platform: "Win32",
  });
  if (!fp.ok) throw new Error(fp.error || "指纹生成失败");
  if (!String(fp.ua || "").startsWith("140#")) throw new Error("指纹 ua 无效");
  if (!String(fp.bxUa || "").startsWith("231")) throw new Error("指纹 bx-ua 无效");
  return fp;
}

function smsForm({
  phone,
  phoneCode,
  countryCode,
  form,
  ua,
  bxUa,
  bxUmidtoken,
  pageTraceId,
  screenPixel,
  smsCode,
  smsToken,
}) {
  const loginForm = form.loginFormData || {};
  const data = {
    loginId: phone,
    phoneCode,
    countryCode,
    ua,
    umidGetStatusVal: "255",
    screenPixel,
    navlanguage: "zh-CN",
    navUserAgent: UA,
    navPlatform: "Win32",
    appName: String(loginForm.appName || form.appName || "eleme"),
    appEntrance: String(loginForm.appEntrance || form.appEntrance || "eleme_sms_h5"),
    _csrf_token: String(loginForm._csrf_token || ""),
    umidToken: String(loginForm.umidToken || form.umidToken || ""),
    isMobile: "false",
    lang: String(loginForm.lang || "zh_CN"),
    returnUrl: String(loginForm.returnUrl || ""),
    hsiz: String(loginForm.hsiz || ""),
    fromSite: String(loginForm.fromSite || "25"),
    bizParams: String(loginForm.bizParams || ""),
    umidTag: "SERVER",
    weiBoMpBridge: "",
    deviceId: "",
    pageTraceId,
    "bx-ua": bxUa,
    "bx-umidtoken": bxUmidtoken,
  };
  if (smsCode == null) data.codeLength = "6";
  else {
    data.smsCode = smsCode;
    data.smsToken = smsToken || "";
    data.keepLogin = "false";
  }
  return data;
}

async function bootstrap() {
  let cookie = seedAnalyticsCookies();
  const cna = await fetchCna(cookie);
  cookie = mergeCookie(cookie, `cna=${cna}`);
  cookie = await mtopBootstrap(cookie);
  const opened = await openMiniLogin(cookie);
  cookie = opened.cookie;
  const fp = await runFp(opened.loginUrl);
  const extra = [];
  if (fp.cookies && fp.cookies.isg) extra.push(`isg=${fp.cookies.isg}`);
  if (fp.cookies && fp.cookies.tfstk) extra.push(`tfstk=${fp.cookies.tfstk}`);
  if (extra.length) cookie = mergeCookie(cookie, ...extra);
  return { cookie, view: opened.view, loginUrl: opened.loginUrl, trace: opened.trace, fp };
}

async function sendCode(phone, phoneCode = "86") {
  phone = String(phone || "").trim();
  if (!/^\d+$/.test(phone)) throw new Error("请输入正确的手机号");
  phoneCode = String(phoneCode || "86").trim();
  const countryCode = "CN";

  const { cookie: bootCookie, view, loginUrl, trace, fp } = await bootstrap();
  let cookie = bootCookie;
  const loginForm = view.loginFormData || {};
  const csrf = String(loginForm._csrf_token || "");
  const umidToken = String(loginForm.umidToken || view.umidToken || "");
  const hsiz = String(loginForm.hsiz || cookieValue(cookie, "cookie2"));
  if (!csrf || !hsiz) throw new Error("登录页缺少 csrf/hsiz，请稍后重试");

  const form = smsForm({
    phone,
    phoneCode,
    countryCode,
    form: view,
    ua: fp.ua,
    bxUa: fp.bxUa,
    bxUmidtoken: fp.bxUmidToken || "",
    pageTraceId: trace,
    screenPixel: "1707x1067",
  });
  const res = await httpRequest(`${PASSPORT}/newlogin/sms/send.do?appName=eleme&fromSite=25&_bx-v=${BX_V}`, {
    method: "POST",
    headers: {
      ...browserHeaders(cookie, { referer: loginUrl, origin: PASSPORT }),
      "Content-Type": "application/x-www-form-urlencoded",
      "bx-v": BX_V,
    },
    body: new URLSearchParams(form).toString(),
  });
  cookie = mergeCookie(cookie, parseSetCookie(res.headers));
  let node;
  try {
    node = JSON.parse(res.text);
  } catch {
    throw new Error(`发送验证码响应异常: ${res.text.slice(0, 200)}`);
  }
  const content = (node && node.content) || {};
  const data = content.data || {};
  if (node.hasError || !content.success) {
    throw new Error(JSON.stringify(node).slice(0, 300) || "发送验证码失败");
  }
  const resultCode = Number(data.resultCode || -1);
  const smsToken = String(data.smsToken || "");
  if (resultCode !== 100 || !smsToken) {
    throw new Error(JSON.stringify(node).slice(0, 300) || "发送验证码失败");
  }

  return {
    cookie,
    phone,
    phoneCode,
    countryCode,
    csrfToken: csrf,
    umidToken,
    hsiz,
    pageTraceId: trace,
    bxUmidtoken: fp.bxUmidToken || "",
    ua: fp.ua,
    bxUa: fp.bxUa,
    smsToken,
    loginUrl,
    screenPixel: "1707x1067",
  };
}

async function loginBySms(session, smsCode) {
  smsCode = String(smsCode || "").trim();
  if (!smsCode) throw new Error("请输入验证码");
  if (!session || typeof session !== "object") throw new Error("缺少 session");

  const fp = await runFp(session.loginUrl);
  let cookie = session.cookie || "";
  const extra = [];
  if (fp.cookies && fp.cookies.isg) extra.push(`isg=${fp.cookies.isg}`);
  if (fp.cookies && fp.cookies.tfstk) extra.push(`tfstk=${fp.cookies.tfstk}`);
  if (extra.length) cookie = mergeCookie(cookie, ...extra);

  const form = {
    loginFormData: {
      appName: "eleme",
      appEntrance: "eleme_sms_h5",
      _csrf_token: session.csrfToken,
      umidToken: session.umidToken,
      isMobile: false,
      lang: "zh_CN",
      returnUrl: "",
      hsiz: session.hsiz,
      fromSite: 25,
      bizParams: "",
    },
  };
  const body = smsForm({
    phone: session.phone,
    phoneCode: session.phoneCode || "86",
    countryCode: session.countryCode || "CN",
    form,
    ua: fp.ua,
    bxUa: fp.bxUa,
    bxUmidtoken: fp.bxUmidToken || session.bxUmidtoken || "",
    pageTraceId: session.pageTraceId || "",
    screenPixel: session.screenPixel || "1707x1067",
    smsCode,
    smsToken: session.smsToken,
  });
  const res = await httpRequest(`${PASSPORT}/newlogin/sms/login.do?appName=eleme&fromSite=25&_bx-v=${BX_V}`, {
    method: "POST",
    headers: {
      ...browserHeaders(cookie, { referer: session.loginUrl, origin: PASSPORT }),
      "Content-Type": "application/x-www-form-urlencoded",
      "bx-v": BX_V,
    },
    body: new URLSearchParams(body).toString(),
  });
  cookie = mergeCookie(cookie, parseSetCookie(res.headers));
  let node;
  try {
    node = JSON.parse(res.text);
  } catch {
    throw new Error(`登录响应异常: ${res.text.slice(0, 200)}`);
  }
  const content = (node && node.content) || {};
  const data = content.data || {};
  if (node.hasError || !content.success) {
    throw new Error(JSON.stringify(node).slice(0, 300) || "登录失败");
  }
  if (String(data.loginResult || "") !== "success" && Number(data.resultCode || -1) !== 100) {
    throw new Error(JSON.stringify(node).slice(0, 300) || "登录失败");
  }
  const userId = findSetCookie(res.headers, "USERID") || String(data.user_id || "") || null;
  const sid = findSetCookie(res.headers, "SID") || String(data.sid || "") || null;
  if (!userId && !cookie.includes("USERID=")) {
    throw new Error("登录成功但未拿到 USERID/SID cookie");
  }
  return {
    cookie,
    userId,
    sid,
    username: String(data.username || "") || null,
    st: String(data.st || "") || null,
  };
}

module.exports = {
  sendCode,
  loginBySms,
  runFp,
};
