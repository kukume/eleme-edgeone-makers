// src/eleme_fp.js
import https from "https";
import http from "http";
import zlib from "zlib";
import { JSDOM, VirtualConsole } from "jsdom";
var COLLINA_URL = "https://g.alicdn.com/AWSC/uab/1.140.0/collina.js";
var FIREYE_URL = "https://g.alicdn.com/AWSC/fireyejs/1.231.67/fireyejs.js";
var ET_URL = "https://g.alicdn.com/AWSC/et/1.77.4/et_f.js";
var SUFEI_URL = "https://g.alicdn.com/secdev/sufei_data/3.9.14/index.js";
var WU_URL = "https://ynuf.aliapp.org/w/wu.json";
function fetchText(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
          "Accept-Encoding": "gzip",
          ...headers
        }
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchText(new URL(res.headers.location, url).href, headers).then(resolve, reject);
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          let buf = Buffer.concat(chunks);
          try {
            if (res.headers["content-encoding"] === "gzip" || buf[0] === 31 && buf[1] === 139) {
              buf = zlib.gunzipSync(buf);
            }
          } catch (_) {
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: buf.toString("utf8"),
            etag: res.headers.etag
          });
        });
      }
    );
    req.on("error", reject);
  });
}
function installCookieJar(window) {
  const jar = /* @__PURE__ */ Object.create(null);
  Object.defineProperty(window.document, "cookie", {
    configurable: true,
    get() {
      return Object.entries(jar).map(([k, v]) => k + "=" + v).join("; ");
    },
    set(v) {
      const nv = String(v || "").split(";", 1)[0];
      const i = nv.indexOf("=");
      if (i <= 0) return;
      const name = nv.slice(0, i).trim();
      const value = nv.slice(i + 1).trim();
      if (!name) return;
      if (value === "" || value === "undefined" || value === "null") return;
      jar[name] = value;
    }
  });
  return jar;
}
function stubEnvironment(window, opts) {
  const width = opts.screen && opts.screen.width || 1707;
  const height = opts.screen && opts.screen.height || 1067;
  window.__cookieJar = installCookieJar(window);
  Object.defineProperty(window, "isSecureContext", {
    get: () => true,
    configurable: true
  });
  Object.defineProperty(window, "devicePixelRatio", {
    get: () => 1.5,
    configurable: true
  });
  Object.defineProperty(window.screen, "width", { get: () => width });
  Object.defineProperty(window.screen, "height", { get: () => height });
  Object.defineProperty(window.screen, "availWidth", { get: () => width });
  Object.defineProperty(window.screen, "availHeight", { get: () => Math.max(height - 48, 1) });
  Object.defineProperty(window.screen, "colorDepth", { get: () => 24 });
  Object.defineProperty(window.screen, "pixelDepth", { get: () => 24 });
  window.matchMedia = function matchMedia(query) {
    const q = String(query || "");
    return {
      matches: /display-mode:\s*browser/i.test(q) || q === "(display-mode: browser)",
      media: q,
      onchange: null,
      addListener() {
      },
      removeListener() {
      },
      addEventListener() {
      },
      removeEventListener() {
      },
      dispatchEvent() {
        return false;
      }
    };
  };
  window.HTMLCanvasElement.prototype.getContext = function getContext(type) {
    if (String(type).includes("webgl")) {
      const noop = () => {
      };
      const gl = {
        canvas: this,
        drawingBufferWidth: this.width || 300,
        drawingBufferHeight: this.height || 150,
        getExtension(name) {
          if (name === "WEBGL_debug_renderer_info") {
            return { UNMASKED_VENDOR_WEBGL: 37445, UNMASKED_RENDERER_WEBGL: 37446 };
          }
          return {};
        },
        getParameter(p) {
          if (p === 37445) return "Google Inc. (NVIDIA)";
          if (p === 37446) return "ANGLE (NVIDIA, Direct3D11 vs_5_0 ps_5_0)";
          if (p === 7936) return "WebKit";
          if (p === 7937) return "WebKit WebGL";
          if (p === 35660) return new Float32Array([1, 1]);
          return 0;
        },
        getSupportedExtensions() {
          return ["WEBGL_debug_renderer_info", "OES_texture_float", "OES_standard_derivatives"];
        },
        getShaderPrecisionFormat() {
          return { rangeMin: 127, rangeMax: 127, precision: 23 };
        },
        createBuffer: () => ({}),
        createProgram: () => ({}),
        createShader: () => ({}),
        createTexture: () => ({}),
        createFramebuffer: () => ({}),
        createRenderbuffer: () => ({}),
        createVertexArray: () => ({}),
        bindBuffer: noop,
        bindTexture: noop,
        bindFramebuffer: noop,
        bindRenderbuffer: noop,
        bindVertexArray: noop,
        bufferData: noop,
        bufferSubData: noop,
        shaderSource: noop,
        compileShader: noop,
        attachShader: noop,
        linkProgram: noop,
        useProgram: noop,
        deleteShader: noop,
        deleteProgram: noop,
        deleteBuffer: noop,
        deleteTexture: noop,
        getProgramParameter: () => true,
        getShaderParameter: () => true,
        getProgramInfoLog: () => "",
        getShaderInfoLog: () => "",
        getAttribLocation: () => 0,
        getUniformLocation: () => ({}),
        enableVertexAttribArray: noop,
        disableVertexAttribArray: noop,
        vertexAttribPointer: noop,
        vertexAttrib1f: noop,
        vertexAttrib2f: noop,
        vertexAttrib3f: noop,
        vertexAttrib4f: noop,
        uniform1f: noop,
        uniform2f: noop,
        uniform3f: noop,
        uniform4f: noop,
        uniform1i: noop,
        uniform2i: noop,
        uniform3i: noop,
        uniform4i: noop,
        uniform1fv: noop,
        uniform2fv: noop,
        uniform3fv: noop,
        uniform4fv: noop,
        uniformMatrix2fv: noop,
        uniformMatrix3fv: noop,
        uniformMatrix4fv: noop,
        drawArrays: noop,
        drawElements: noop,
        viewport: noop,
        scissor: noop,
        clearColor: noop,
        clear: noop,
        clearDepth: noop,
        enable: noop,
        disable: noop,
        blendFunc: noop,
        depthFunc: noop,
        activeTexture: noop,
        texImage2D: noop,
        texParameteri: noop,
        pixelStorei: noop,
        readPixels: noop,
        flush: noop,
        finish: noop,
        isContextLost: () => false
      };
      return new Proxy(gl, {
        get(target, prop) {
          if (prop in target) return target[prop];
          if (typeof prop === "string" && prop.startsWith("create")) return () => ({});
          if (typeof prop === "string" && (prop.startsWith("get") || prop.startsWith("is"))) {
            return () => prop.startsWith("is") ? false : 0;
          }
          return noop;
        }
      });
    }
    return {
      canvas: this,
      fillRect() {
      },
      clearRect() {
      },
      getImageData() {
        return { data: new Uint8ClampedArray(400) };
      },
      putImageData() {
      },
      createImageData() {
        return { data: new Uint8ClampedArray(400) };
      },
      setTransform() {
      },
      drawImage() {
      },
      save() {
      },
      restore() {
      },
      fillText() {
      },
      beginPath() {
      },
      moveTo() {
      },
      lineTo() {
      },
      closePath() {
      },
      stroke() {
      },
      translate() {
      },
      scale() {
      },
      rotate() {
      },
      arc() {
      },
      fill() {
      },
      measureText() {
        return { width: 12 };
      },
      transform() {
      },
      rect() {
      },
      clip() {
      }
    };
  };
  window.HTMLCanvasElement.prototype.toDataURL = function toDataURL() {
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  };
  class FakeAudioContext {
    constructor() {
      this.sampleRate = 44100;
      this.state = "running";
      this.destination = {};
      this.currentTime = 0;
    }
    createAnalyser() {
      return {
        fftSize: 2048,
        frequencyBinCount: 1024,
        smoothingTimeConstant: 0,
        getFloatFrequencyData(arr) {
          for (let i = 0; i < arr.length; i++) arr[i] = -120 + Math.random() * 5;
        },
        connect() {
        },
        disconnect() {
        }
      };
    }
    createOscillator() {
      return {
        type: "triangle",
        frequency: { value: 1e4 },
        connect() {
        },
        start() {
        },
        stop() {
        }
      };
    }
    createDynamicsCompressor() {
      return {
        threshold: { value: -50 },
        knee: { value: 40 },
        ratio: { value: 12 },
        attack: { value: 0 },
        release: { value: 0.25 },
        connect() {
        }
      };
    }
    createGain() {
      return { gain: { value: 1 }, connect() {
      } };
    }
    close() {
      return Promise.resolve();
    }
  }
  window.AudioContext = FakeAudioContext;
  window.webkitAudioContext = FakeAudioContext;
  window.OfflineAudioContext = class extends FakeAudioContext {
    constructor(_ch, length, sampleRate) {
      super();
      this.length = length;
      this.sampleRate = sampleRate;
    }
    startRendering() {
      return Promise.resolve({
        getChannelData() {
          return new Float32Array(16);
        }
      });
    }
  };
  window.webkitOfflineAudioContext = window.OfflineAudioContext;
  window.RTCPeerConnection = class RTCPeerConnection {
    constructor() {
      this.onicecandidate = null;
      this.localDescription = null;
    }
    createDataChannel() {
      return { close() {
      } };
    }
    createOffer() {
      return Promise.resolve({ type: "offer", sdp: "v=0\r\n" });
    }
    setLocalDescription(desc) {
      this.localDescription = desc;
      setTimeout(() => {
        if (typeof this.onicecandidate === "function") {
          this.onicecandidate({ candidate: null });
        }
      }, 1);
      return Promise.resolve();
    }
    close() {
    }
    addEventListener() {
    }
  };
  window.webkitRTCPeerConnection = window.RTCPeerConnection;
  window.speechSynthesis = {
    getVoices() {
      return [{ name: "Microsoft Huihui - Chinese (Simplified)", lang: "zh-CN" }];
    },
    addEventListener() {
    },
    removeEventListener() {
    }
  };
  if (!window.performance.now) {
    window.performance.now = () => Date.now();
  }
  window.performance.getEntriesByType = (type) => {
    if (type === "navigation") {
      return [{ type: "navigate", startTime: 0, duration: 120, name: window.location.href }];
    }
    if (type === "resource") return [];
    return [];
  };
  window.performance.getEntries = () => [];
  window.performance.getEntriesByName = () => [];
  Object.defineProperty(window.navigator, "webdriver", { get: () => false, configurable: true });
  Object.defineProperty(window.navigator, "languages", {
    get: () => [opts.language || "zh-CN", "zh"],
    configurable: true
  });
  Object.defineProperty(window.navigator, "language", {
    get: () => opts.language || "zh-CN",
    configurable: true
  });
  Object.defineProperty(window.navigator, "platform", {
    get: () => opts.platform || "Win32",
    configurable: true
  });
  Object.defineProperty(window.navigator, "vendor", { get: () => "Google Inc.", configurable: true });
  Object.defineProperty(window.navigator, "hardwareConcurrency", { get: () => 8, configurable: true });
  Object.defineProperty(window.navigator, "deviceMemory", { get: () => 8, configurable: true });
  Object.defineProperty(window.navigator, "maxTouchPoints", { get: () => 0, configurable: true });
  Object.defineProperty(window.navigator, "connection", {
    get: () => ({
      effectiveType: "4g",
      rtt: 50,
      downlink: 10,
      saveData: false,
      addEventListener() {
      }
    }),
    configurable: true
  });
  window.navigator.getBattery = async () => ({
    charging: true,
    level: 1,
    chargingTime: 0,
    dischargingTime: Infinity,
    addEventListener() {
    }
  });
  window.chrome = { runtime: {}, app: { isInstalled: false }, csi() {
    return {};
  }, loadTimes() {
    return {};
  } };
  window.XMLHttpRequest = function XMLHttpRequest() {
    return {
      readyState: 0,
      status: 0,
      responseText: "",
      response: "",
      onload: null,
      onerror: null,
      onreadystatechange: null,
      timeout: 0,
      withCredentials: false,
      responseType: "",
      open() {
      },
      setRequestHeader() {
      },
      getAllResponseHeaders() {
        return "";
      },
      getResponseHeader() {
        return null;
      },
      addEventListener(type, cb) {
        this["on" + type] = cb;
      },
      removeEventListener() {
      },
      abort() {
      },
      send() {
        setTimeout(() => {
          this.readyState = 4;
          this.status = 200;
          this.responseText = "{}";
          this.response = "{}";
          if (this.onreadystatechange) this.onreadystatechange();
          if (this.onload) this.onload();
        }, 1);
      }
    };
  };
  window.fetch = async function fetch2() {
    return {
      ok: true,
      status: 200,
      text: async () => "{}",
      json: async () => ({}),
      headers: { get() {
        return null;
      } }
    };
  };
  Object.defineProperty(window.HTMLImageElement.prototype, "src", {
    configurable: true,
    get() {
      return this._src || "";
    },
    set(v) {
      this._src = String(v);
      if (process.env.ELEME_FP_DEBUG && /acjs\.aliyun\.com\/error/.test(this._src)) {
        try {
          const u = new URL(this._src, "https://x/");
          const err = u.searchParams.get("e");
          if (err) process.stderr.write("[fy] " + decodeURIComponent(err) + "\n");
        } catch (_) {
        }
      }
      setTimeout(() => {
        if (typeof this.onload === "function") this.onload();
      }, 1);
    }
  });
}
function parseCookieString(cookie) {
  const out = {};
  for (const part of String(cookie || "").split(";")) {
    const item = part.trim();
    if (!item || !item.includes("=")) continue;
    const i = item.indexOf("=");
    out[item.slice(0, i)] = item.slice(i + 1);
  }
  return out;
}
async function fetchBxUmidToken(referer) {
  const res = await fetchText(WU_URL, { Referer: referer || "https://ipassport.ele.me/mini_login.htm" });
  const fromBody = (res.body.match(/T2gA[A-Za-z0-9_\-+=/]+/) || [])[0];
  const fromEtag = (res.etag || "").replace(/^W\//, "").replace(/"/g, "");
  return fromBody || fromEtag || "";
}
async function generateFingerprint(input) {
  const userAgent = input.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";
  const url = input.url || "https://ipassport.ele.me/mini_login.htm?lang=zh_cn&appName=eleme&appEntrance=eleme_sms_h5&styleType=vertical";
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", () => {
  });
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
    url,
    referrer: "https://h5.ele.me/",
    userAgent,
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole
  });
  const { window } = dom;
  stubEnvironment(window, input);
  const [collina, fireye, et, sufei, umid] = await Promise.all([
    fetchText(COLLINA_URL),
    fetchText(FIREYE_URL),
    fetchText(ET_URL),
    fetchText(SUFEI_URL),
    fetchBxUmidToken(url)
  ]);
  window.eval(collina.body);
  window.eval(fireye.body);
  window.eval(et.body);
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 2500);
    try {
      window.__fyModule.init(
        { appName: "eleme", serviceLocation: "cn" },
        () => {
          clearTimeout(timer);
          resolve();
        }
      );
    } catch (_) {
      clearTimeout(timer);
      resolve();
    }
  });
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try {
      const token = window.__fyModule.getFYToken();
      if (token && String(token).startsWith("231")) break;
    } catch (_) {
    }
  }
  let tfstk = "";
  try {
    if (typeof window.etSign === "function") {
      tfstk = String(window.etSign(url) || window.etSign() || "");
    }
  } catch (_) {
  }
  if (tfstk && tfstk !== "undefined") {
    window.document.cookie = "tfstk=" + tfstk;
  }
  try {
    window.eval(sufei.body);
  } catch (e) {
    if (process.env.ELEME_FP_DEBUG) {
      process.stderr.write("[sufei] eval: " + e.message + "\n");
    }
  }
  for (let i = 0; i < 15; i++) {
    const jar = parseCookieString(window.document.cookie);
    if (jar.isg) break;
    await new Promise((r) => setTimeout(r, 150));
  }
  let ua = "";
  let bxUa = "";
  let uid = "";
  try {
    ua = String(window.__acjs_awsc_140.getUA() || "");
  } catch (_) {
  }
  try {
    bxUa = String(window.__fyModule.getFYToken() || "");
  } catch (e) {
    if (process.env.ELEME_FP_DEBUG) {
      process.stderr.write("[fy] getFYToken throw: " + e.message + "\n");
    }
  }
  try {
    uid = String(window.__fyModule.getUidToken() || "");
  } catch (_) {
  }
  const cookies = parseCookieString(window.document.cookie);
  if ((!cookies.tfstk || cookies.tfstk === "undefined") && tfstk && tfstk !== "undefined") {
    cookies.tfstk = tfstk;
  }
  const bxUmidToken = (uid && uid.startsWith("T2gA") ? uid : "") || umid;
  try {
    dom.window.close();
  } catch (_) {
  }
  if (!ua.startsWith("140#")) {
    throw new Error("collina getUA failed");
  }
  return {
    ok: true,
    ua,
    bxUa: bxUa.startsWith("231") ? bxUa : "",
    bxUmidToken,
    cookies: {
      isg: cookies.isg || "",
      tfstk: cookies.tfstk || ""
    }
  };
}
async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => data += c);
    process.stdin.on("end", () => {
      if (!data.trim()) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    process.stdin.on("error", reject);
  });
}
async function main() {
  try {
    const input = await readStdin();
    const result = await generateFingerprint(input);
    process.stdout.write(JSON.stringify(result));
  } catch (e) {
    process.stdout.write(JSON.stringify({ ok: false, error: e && e.message ? e.message : String(e) }));
    process.exitCode = 1;
  }
}
main();

// src/eleme_login.js
import crypto from "crypto";
var APP_KEY = "12574478";
var BX_V = "2.5.11";
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";
var H5 = "https://h5.ele.me";
var PASSPORT = "https://ipassport.ele.me";
var MTOP = "https://waimai-guide.ele.me";
var EG_JS = "https://log.mmstat.com/eg.js";
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
  return Object.entries(seen).map(([k, v]) => `${k}=${v}`).join("; ");
}
function seedAnalyticsCookies() {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const nowMs = Date.now();
  return mergeCookie(
    `ubt_ssid=${randAlnum(32)}_${today}`,
    `perf_ssid=${randAlnum(32)}_${today}`,
    `_bl_uid=${randAlnum(28)}`,
    `__ebg_utdid=${crypto.randomUUID()}-${nowMs}`,
    `arms_uid=${crypto.randomUUID()}`,
    `_uab_collina=${nowMs}${Math.floor(1e11 + Math.random() * 9e11)}`,
    "mtop_partitioned_detect=1"
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
  if (!m) throw new Error("\u672A\u89E3\u6790\u5230\u997F\u4E86\u4E48\u767B\u5F55\u9875 viewData");
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
    Cookie: cookie
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
      Cookie: cookie
    }
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
      method: "POST"
    });
    const res = await httpRequest(`${MTOP}/h5/mtop.alsc.user.session.ele.check/1.0/?${query}`, {
      method: "POST",
      headers: {
        ...browserHeaders(cookie, { referer: `${H5}/minisite/`, origin: H5 }),
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: new URLSearchParams({ data }).toString()
    });
    cookie = mergeCookie(cookie, parseSetCookie(res.headers));
    if (cookieValue(cookie, "_m_h5_tk")) return cookie;
  }
  return cookie;
}
async function openMiniLogin(cookie) {
  const loginUrl = `${PASSPORT}/mini_login.htm?` + new URLSearchParams({
    lang: "zh_cn",
    appName: "eleme",
    appEntrance: "eleme_sms_h5",
    styleType: "vertical",
    bizParams: "",
    notLoadSsoView: "true",
    notKeepLogin: "false",
    isMobile: "false",
    rnd: String(Math.random())
  }).toString();
  const res = await httpRequest(loginUrl, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      Referer: `${H5}/`,
      Cookie: cookie,
      "Upgrade-Insecure-Requests": "1"
    }
  });
  if (res.status >= 400) throw new Error(`\u6253\u5F00\u997F\u4E86\u4E48\u767B\u5F55\u9875\u5931\u8D25: HTTP ${res.status}`);
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
    platform: "Win32"
  });
  if (!fp.ok) throw new Error(fp.error || "\u6307\u7EB9\u751F\u6210\u5931\u8D25");
  if (!String(fp.ua || "").startsWith("140#")) throw new Error("\u6307\u7EB9 ua \u65E0\u6548");
  if (!String(fp.bxUa || "").startsWith("231")) throw new Error("\u6307\u7EB9 bx-ua \u65E0\u6548");
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
  pageTraceId: pageTraceId2,
  screenPixel,
  smsCode,
  smsToken
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
    pageTraceId: pageTraceId2,
    "bx-ua": bxUa,
    "bx-umidtoken": bxUmidtoken
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
  if (!/^\d+$/.test(phone)) throw new Error("\u8BF7\u8F93\u5165\u6B63\u786E\u7684\u624B\u673A\u53F7");
  phoneCode = String(phoneCode || "86").trim();
  const countryCode = "CN";
  const { cookie: bootCookie, view, loginUrl, trace, fp } = await bootstrap();
  let cookie = bootCookie;
  const loginForm = view.loginFormData || {};
  const csrf = String(loginForm._csrf_token || "");
  const umidToken = String(loginForm.umidToken || view.umidToken || "");
  const hsiz = String(loginForm.hsiz || cookieValue(cookie, "cookie2"));
  if (!csrf || !hsiz) throw new Error("\u767B\u5F55\u9875\u7F3A\u5C11 csrf/hsiz\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
  const form = smsForm({
    phone,
    phoneCode,
    countryCode,
    form: view,
    ua: fp.ua,
    bxUa: fp.bxUa,
    bxUmidtoken: fp.bxUmidToken || "",
    pageTraceId: trace,
    screenPixel: "1707x1067"
  });
  const res = await httpRequest(`${PASSPORT}/newlogin/sms/send.do?appName=eleme&fromSite=25&_bx-v=${BX_V}`, {
    method: "POST",
    headers: {
      ...browserHeaders(cookie, { referer: loginUrl, origin: PASSPORT }),
      "Content-Type": "application/x-www-form-urlencoded",
      "bx-v": BX_V
    },
    body: new URLSearchParams(form).toString()
  });
  cookie = mergeCookie(cookie, parseSetCookie(res.headers));
  let node;
  try {
    node = JSON.parse(res.text);
  } catch {
    throw new Error(`\u53D1\u9001\u9A8C\u8BC1\u7801\u54CD\u5E94\u5F02\u5E38: ${res.text.slice(0, 200)}`);
  }
  const content = node && node.content || {};
  const data = content.data || {};
  if (node.hasError || !content.success) {
    throw new Error(JSON.stringify(node).slice(0, 300) || "\u53D1\u9001\u9A8C\u8BC1\u7801\u5931\u8D25");
  }
  const resultCode = Number(data.resultCode || -1);
  const smsToken = String(data.smsToken || "");
  if (resultCode !== 100 || !smsToken) {
    throw new Error(JSON.stringify(node).slice(0, 300) || "\u53D1\u9001\u9A8C\u8BC1\u7801\u5931\u8D25");
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
    screenPixel: "1707x1067"
  };
}

// src/routes.js
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
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
    throw new Error("\u8BF7\u6C42 Body \u4E0D\u662F\u5408\u6CD5 JSON");
  }
}
async function smsSend(request) {
  const body = await readJson(request);
  const session = await sendCode(body.phone, body.phoneCode || "86");
  return ok({ session });
}
function wrap(handler) {
  return async (context) => {
    try {
      return await handler(context.request);
    } catch (e) {
      return fail(e, 500);
    }
  };
}

// src/entries/sms-send.js
var onRequestPost = wrap(smsSend);
var onRequest = onRequestPost;
export {
  onRequest,
  onRequestPost
};
