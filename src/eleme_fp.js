/**
 * Ele.me / Ali passport fingerprint helper.
 * Reads JSON from stdin, writes JSON to stdout.
 *
 * Input:  { userAgent?, url?, screen?: {width,height}, language?, platform? }
 * Output: { ok, ua, bxUa, bxUmidToken, cookies?: {isg?, tfstk?}, error? }
 */

import https from "https";
import http from "http";
import zlib from "zlib";
import { JSDOM, VirtualConsole } from "jsdom";

const COLLINA_URL = "https://g.alicdn.com/AWSC/uab/1.140.0/collina.js";
const FIREYE_URL = "https://g.alicdn.com/AWSC/fireyejs/1.231.67/fireyejs.js";
const ET_URL = "https://g.alicdn.com/AWSC/et/1.77.4/et_f.js";
const SUFEI_URL = "https://g.alicdn.com/secdev/sufei_data/3.9.14/index.js";
const WU_URL = "https://ynuf.aliapp.org/w/wu.json";

function fetchText(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
          "Accept-Encoding": "gzip",
          ...headers,
        },
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
            if (res.headers["content-encoding"] === "gzip" || (buf[0] === 0x1f && buf[1] === 0x8b)) {
              buf = zlib.gunzipSync(buf);
            }
          } catch (_) {}
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: buf.toString("utf8"),
            etag: res.headers.etag,
          });
        });
      },
    );
    req.on("error", reject);
  });
}

function installCookieJar(window) {
  const jar = Object.create(null);
  Object.defineProperty(window.document, "cookie", {
    configurable: true,
    get() {
      return Object.entries(jar)
        .map(([k, v]) => k + "=" + v)
        .join("; ");
    },
    set(v) {
      const nv = String(v || "").split(";", 1)[0];
      const i = nv.indexOf("=");
      if (i <= 0) return;
      const name = nv.slice(0, i).trim();
      const value = nv.slice(i + 1).trim();
      if (!name) return;
      // ignore broken writes like tfstk=undefined
      if (value === "" || value === "undefined" || value === "null") return;
      jar[name] = value;
    },
  });
  return jar;
}

function stubEnvironment(window, opts) {
  const width = (opts.screen && opts.screen.width) || 1707;
  const height = (opts.screen && opts.screen.height) || 1067;
  window.__cookieJar = installCookieJar(window);

  Object.defineProperty(window, "isSecureContext", {
    get: () => true,
    configurable: true,
  });
  Object.defineProperty(window, "devicePixelRatio", {
    get: () => 1.5,
    configurable: true,
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
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    };
  };

  window.HTMLCanvasElement.prototype.getContext = function getContext(type) {
    if (String(type).includes("webgl")) {
      const noop = () => {};
      const gl = {
        canvas: this,
        drawingBufferWidth: this.width || 300,
        drawingBufferHeight: this.height || 150,
        getExtension(name) {
          if (name === "WEBGL_debug_renderer_info") {
            return { UNMASKED_VENDOR_WEBGL: 0x9245, UNMASKED_RENDERER_WEBGL: 0x9246 };
          }
          return {};
        },
        getParameter(p) {
          if (p === 0x9245) return "Google Inc. (NVIDIA)";
          if (p === 0x9246) return "ANGLE (NVIDIA, Direct3D11 vs_5_0 ps_5_0)";
          if (p === 0x1f00) return "WebKit";
          if (p === 0x1f01) return "WebKit WebGL";
          if (p === 0x8b4c) return new Float32Array([1, 1]); // ALIASED_POINT_SIZE_RANGE etc.
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
        isContextLost: () => false,
      };
      return new Proxy(gl, {
        get(target, prop) {
          if (prop in target) return target[prop];
          // Any missing WebGL method becomes a no-op / fake object factory.
          if (typeof prop === "string" && prop.startsWith("create")) return () => ({});
          if (typeof prop === "string" && (prop.startsWith("get") || prop.startsWith("is"))) {
            return () => (prop.startsWith("is") ? false : 0);
          }
          return noop;
        },
      });
    }
    return {
      canvas: this,
      fillRect() {},
      clearRect() {},
      getImageData() {
        return { data: new Uint8ClampedArray(400) };
      },
      putImageData() {},
      createImageData() {
        return { data: new Uint8ClampedArray(400) };
      },
      setTransform() {},
      drawImage() {},
      save() {},
      restore() {},
      fillText() {},
      beginPath() {},
      moveTo() {},
      lineTo() {},
      closePath() {},
      stroke() {},
      translate() {},
      scale() {},
      rotate() {},
      arc() {},
      fill() {},
      measureText() {
        return { width: 12 };
      },
      transform() {},
      rect() {},
      clip() {},
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
        connect() {},
        disconnect() {},
      };
    }
    createOscillator() {
      return {
        type: "triangle",
        frequency: { value: 10000 },
        connect() {},
        start() {},
        stop() {},
      };
    }
    createDynamicsCompressor() {
      return {
        threshold: { value: -50 },
        knee: { value: 40 },
        ratio: { value: 12 },
        attack: { value: 0 },
        release: { value: 0.25 },
        connect() {},
      };
    }
    createGain() {
      return { gain: { value: 1 }, connect() {} };
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
        },
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
      return { close() {} };
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
    close() {}
    addEventListener() {}
  };
  window.webkitRTCPeerConnection = window.RTCPeerConnection;

  window.speechSynthesis = {
    getVoices() {
      return [{ name: "Microsoft Huihui - Chinese (Simplified)", lang: "zh-CN" }];
    },
    addEventListener() {},
    removeEventListener() {},
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
    configurable: true,
  });
  Object.defineProperty(window.navigator, "language", {
    get: () => opts.language || "zh-CN",
    configurable: true,
  });
  Object.defineProperty(window.navigator, "platform", {
    get: () => opts.platform || "Win32",
    configurable: true,
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
      addEventListener() {},
    }),
    configurable: true,
  });
  window.navigator.getBattery = async () => ({
    charging: true,
    level: 1,
    chargingTime: 0,
    dischargingTime: Infinity,
    addEventListener() {},
  });

  window.chrome = { runtime: {}, app: { isInstalled: false }, csi() { return {}; }, loadTimes() { return {}; } };

  // Quiet network: fireye probes umid hosts; we supply umid via wu.json separately.
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
      open() {},
      setRequestHeader() {},
      getAllResponseHeaders() {
        return "";
      },
      getResponseHeader() {
        return null;
      },
      addEventListener(type, cb) {
        this["on" + type] = cb;
      },
      removeEventListener() {},
      abort() {},
      send() {
        setTimeout(() => {
          this.readyState = 4;
          this.status = 200;
          this.responseText = "{}";
          this.response = "{}";
          if (this.onreadystatechange) this.onreadystatechange();
          if (this.onload) this.onload();
        }, 1);
      },
    };
  };
  window.fetch = async function fetch() {
    return {
      ok: true,
      status: 200,
      text: async () => "{}",
      json: async () => ({}),
      headers: { get() { return null; } },
    };
  };
  Object.defineProperty(window.HTMLImageElement.prototype, "src", {
    configurable: true,
    get() {
      return this._src || "";
    },
    set(v) {
      this._src = String(v);
      // Surface fireye error beacons for debugging when ELEME_FP_DEBUG=1
      if (process.env.ELEME_FP_DEBUG && /acjs\.aliyun\.com\/error/.test(this._src)) {
        try {
          const u = new URL(this._src, "https://x/");
          const err = u.searchParams.get("e");
          if (err) process.stderr.write("[fy] " + decodeURIComponent(err) + "\n");
        } catch (_) {}
      }
      setTimeout(() => {
        if (typeof this.onload === "function") this.onload();
      }, 1);
    },
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
  const userAgent =
    input.userAgent ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";
  const url =
    input.url ||
    "https://ipassport.ele.me/mini_login.htm?lang=zh_cn&appName=eleme&appEntrance=eleme_sms_h5&styleType=vertical";

  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", () => {});
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
    url,
    referrer: "https://h5.ele.me/",
    userAgent,
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole,
  });
  const { window } = dom;
  stubEnvironment(window, input);

  const [collina, fireye, et, sufei, umid] = await Promise.all([
    fetchText(COLLINA_URL),
    fetchText(FIREYE_URL),
    fetchText(ET_URL),
    fetchText(SUFEI_URL),
    fetchBxUmidToken(url),
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
        },
      );
    } catch (_) {
      clearTimeout(timer);
      resolve();
    }
  });

  // Give fireye a few ticks after init.
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try {
      const token = window.__fyModule.getFYToken();
      if (token && String(token).startsWith("231")) break;
    } catch (_) {}
  }

  // tfstk: AWSC etSign()
  let tfstk = "";
  try {
    if (typeof window.etSign === "function") {
      tfstk = String(window.etSign(url) || window.etSign() || "");
    }
  } catch (_) {}
  if (tfstk && tfstk !== "undefined") {
    window.document.cookie = "tfstk=" + tfstk;
  }

  // isg: sufei_data writes document.cookie
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
  } catch (_) {}
  try {
    bxUa = String(window.__fyModule.getFYToken() || "");
  } catch (e) {
    if (process.env.ELEME_FP_DEBUG) {
      process.stderr.write("[fy] getFYToken throw: " + e.message + "\n");
    }
  }
  try {
    uid = String(window.__fyModule.getUidToken() || "");
  } catch (_) {}

  const cookies = parseCookieString(window.document.cookie);
  if ((!cookies.tfstk || cookies.tfstk === "undefined") && tfstk && tfstk !== "undefined") {
    cookies.tfstk = tfstk;
  }
  const bxUmidToken = (uid && uid.startsWith("T2gA") ? uid : "") || umid;

  try {
    dom.window.close();
  } catch (_) {}

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
      tfstk: cookies.tfstk || "",
    },
  };
}

export { generateFingerprint };

async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => {
      if (!data.trim()) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
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
