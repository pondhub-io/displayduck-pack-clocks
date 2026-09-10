const X = () => typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
class Y {
  constructor() {
    this.pending = /* @__PURE__ */ new Map(), this.subscribers = /* @__PURE__ */ new Map(), this.handleMessage = (t) => {
      const e = t.data;
      if (!(!e || typeof e != "object")) {
        if (e.kind === "response") {
          this.handleResponse(e);
          return;
        }
        e.kind === "push" && this.handlePush(e);
      }
    }, self.addEventListener("message", this.handleMessage);
  }
  call(t, e) {
    const i = X(), s = { kind: "request", id: i, method: t, params: e };
    return new Promise((n, c) => {
      this.pending.set(i, { resolve: n, reject: c }), self.postMessage(s);
    });
  }
  emit(t, e) {
    const i = { kind: "event", method: t, params: e };
    self.postMessage(i);
  }
  subscribe(t, e) {
    let i = this.subscribers.get(t);
    return i || (i = /* @__PURE__ */ new Set(), this.subscribers.set(t, i)), i.add(e), () => {
      i?.delete(e);
    };
  }
  handleResponse(t) {
    const e = this.pending.get(t.id);
    e && (this.pending.delete(t.id), t.ok ? e.resolve(t.result) : e.reject(new Error(t.error ?? "RPC call failed.")));
  }
  handlePush(t) {
    const e = this.subscribers.get(t.channel);
    if (e?.size)
      for (const i of [...e])
        i(t.payload);
  }
}
let A = null;
const Q = () => (A || (A = new Y()), A), P = /* @__PURE__ */ new Map(), J = (a) => String(a ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"), Z = (a) => {
  const t = P.get(a);
  if (t)
    return t;
  const e = a.replace(/\bthis\b/g, "__item"), i = new Function("scope", `with (scope) { return (${e}); }`);
  return P.set(a, i), i;
}, S = (a, t) => {
  try {
    return Z(a)(t);
  } catch {
    return "";
  }
}, D = (a, t = 0, e) => {
  const i = [];
  let s = t;
  for (; s < a.length; ) {
    const n = a.indexOf("{{", s);
    if (n === -1)
      return i.push({ type: "text", value: a.slice(s) }), { nodes: i, index: a.length };
    n > s && i.push({ type: "text", value: a.slice(s, n) });
    const c = a.indexOf("}}", n + 2);
    if (c === -1)
      return i.push({ type: "text", value: a.slice(n) }), { nodes: i, index: a.length };
    const d = a.slice(n + 2, c).trim();
    if (s = c + 2, d === "/if" || d === "/each") {
      if (e === d)
        return { nodes: i, index: s };
      i.push({ type: "text", value: `{{${d}}}` });
      continue;
    }
    if (d.startsWith("#if ")) {
      const u = D(a, s, "/if");
      i.push({
        type: "if",
        condition: d.slice(4).trim(),
        children: u.nodes
      }), s = u.index;
      continue;
    }
    if (d.startsWith("#each ")) {
      const u = D(a, s, "/each");
      i.push({
        type: "each",
        source: d.slice(6).trim(),
        children: u.nodes
      }), s = u.index;
      continue;
    }
    i.push({ type: "expr", value: d });
  }
  return { nodes: i, index: s };
}, R = (a, t) => {
  let e = "";
  for (const i of a) {
    if (i.type === "text") {
      e += i.value;
      continue;
    }
    if (i.type === "expr") {
      e += J(S(i.value, t));
      continue;
    }
    if (i.type === "if") {
      S(i.condition, t) && (e += R(i.children, t));
      continue;
    }
    const s = S(i.source, t);
    if (Array.isArray(s))
      for (const n of s) {
        const c = Object.create(t);
        c.__item = n, e += R(i.children, c);
      }
  }
  return e;
}, tt = (a) => {
  const t = D(a).nodes;
  return (e) => R(t, e);
}, et = (a) => {
  if (typeof a != "function")
    return !1;
  const t = a;
  return t._isSignal === !0 && typeof t.set == "function" && typeof t.subscribe == "function";
}, it = (a) => {
  let t = a;
  const e = /* @__PURE__ */ new Set(), i = (() => t);
  return i._isSignal = !0, i.set = (s) => {
    if (!Object.is(t, s)) {
      t = s;
      for (const n of e)
        n(t);
    }
  }, i.update = (s) => {
    i.set(s(t));
  }, i.subscribe = (s) => (e.add(s), () => e.delete(s)), i;
}, st = /* @__PURE__ */ new Set([
  // Worker/message-channel plumbing the RPC layer itself needs.
  "self",
  "postMessage",
  "addEventListener",
  "removeEventListener",
  "dispatchEvent",
  "onmessage",
  "onmessageerror",
  "onerror",
  "onunhandledrejection",
  "onrejectionhandled",
  "name",
  "close",
  // Timers / scheduling.
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
  "queueMicrotask",
  // Pure computation / encoding -- no network, no storage, no cross-context reach.
  "crypto",
  "Crypto",
  "CryptoKey",
  "SubtleCrypto",
  "TextEncoder",
  "TextDecoder",
  "structuredClone",
  "atob",
  "btoa",
  "URL",
  "URLSearchParams",
  "AbortController",
  "AbortSignal",
  "console",
  "performance",
  "Performance",
  "PerformanceEntry",
  "PerformanceMark",
  "PerformanceMeasure",
  // Standard ECMAScript built-ins.
  "Object",
  "Array",
  "Function",
  "Boolean",
  "Symbol",
  "Error",
  "EvalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError",
  "AggregateError",
  "Number",
  "BigInt",
  "Math",
  "Date",
  "String",
  "RegExp",
  "JSON",
  "Promise",
  "Proxy",
  "Reflect",
  "Map",
  "Set",
  "WeakMap",
  "WeakSet",
  "WeakRef",
  "FinalizationRegistry",
  "ArrayBuffer",
  "SharedArrayBuffer",
  "DataView",
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Uint16Array",
  "Int32Array",
  "Uint32Array",
  "Float32Array",
  "Float64Array",
  "BigInt64Array",
  "BigUint64Array",
  "globalThis",
  "undefined",
  "NaN",
  "Infinity",
  "parseInt",
  "parseFloat",
  "isNaN",
  "isFinite",
  "encodeURIComponent",
  "decodeURIComponent",
  "encodeURI",
  "decodeURI"
]), ot = () => {
  const a = self;
  for (const t of Object.getOwnPropertyNames(a))
    if (!st.has(t))
      try {
        delete a[t];
      } catch {
      }
};
ot();
const at = (a, t) => {
  const e = [];
  for (const i of Object.keys(a)) {
    const s = a[i];
    et(s) && e.push(s.subscribe(() => t()));
  }
  return () => {
    for (const i of e)
      i();
  };
}, nt = (a, t) => new Proxy(
  { payload: t },
  {
    get(e, i) {
      if (typeof i != "string")
        return;
      if (i in e)
        return e[i];
      const s = a[i];
      return typeof s == "function" ? s.bind(a) : s;
    },
    has(e, i) {
      return typeof i != "string" ? !1 : i in e || i in a;
    }
  }
), C = "{{ASSETS}}", rt = /\{\{pack-install-path\}\}\/([^"')\s]+)/g, N = (a, t) => {
  const e = t.trim().replace(/^\.\/+/, "").replace(/^\/+/, "");
  return !a || !e ? t : `${a.replace(/\/+$/, "")}/${e}`;
}, I = (a, t) => {
  if (!t)
    return a;
  let e = a;
  return e.includes(C) && (e = e.replaceAll(C, t)), e.replace(rt, (i, s) => N(t, s));
};
class ct {
  constructor(t, e) {
    this.rpc = t, this.selector = e;
  }
  setText(t) {
    this.rpc.emit("dom.setText", { selector: this.selector, text: t });
  }
  setAttribute(t, e) {
    this.rpc.emit("dom.setAttribute", { selector: this.selector, name: t, value: e });
  }
  removeAttribute(t) {
    this.rpc.emit("dom.removeAttribute", { selector: this.selector, name: t });
  }
  setStyle(t, e) {
    this.rpc.emit("dom.setStyle", { selector: this.selector, property: t, value: e });
  }
  addClass(...t) {
    this.rpc.emit("dom.addClass", { selector: this.selector, names: t });
  }
  removeClass(...t) {
    this.rpc.emit("dom.removeClass", { selector: this.selector, names: t });
  }
  toggleClass(t, e) {
    this.rpc.emit("dom.toggleClass", { selector: this.selector, name: t, on: e });
  }
  async getRect() {
    return this.rpc.call("dom.getRect", { selector: this.selector });
  }
}
let lt = class {
  get config() {
    return this._getConfig();
  }
  /** The full payload the host mounted this widget with (id, name,
   * directory, configuredWidgetId, config) -- most packs only need
   * `config`, but this is available for cases that need the widget's own
   * identity, e.g. distinguishing which manifest entry a shared bundle is
   * running as. */
  get payload() {
    return this._getPayload();
  }
  on(t, e, i) {
    return this._onRegister(t, e, i);
  }
  /** Internal: called once by createWidgetClass() right after construction. */
  _attach(t) {
    this.dom = t.dom, this.assets = t.assets, this.network = t.network, this.media = t.media, this.audio = t.audio, this.metrics = t.metrics, this.storage = t.storage, this.permissions = t.permissions, this.app = t.app, this._getConfig = t.getConfig, this._getPayload = t.getPayload, this._onRegister = t.onRegister;
  }
};
const dt = (a, t) => {
  const e = Q();
  let i = null, s = {}, n = {}, c = "", d = [], u = [], p = !1, v = !1, F = () => {
  };
  const y = /* @__PURE__ */ new Map();
  let M = null;
  const $ = (o, r, l) => {
    let f = y.get(o);
    f || (f = /* @__PURE__ */ new Map(), y.set(o, f));
    let h = f.get(r);
    return h || (h = /* @__PURE__ */ new Set(), f.set(r, h), e.emit("on.register", { eventName: o, selector: r })), h.add(l), M ??= e.subscribe("dom-event", (T) => {
      const k = T, b = y.get(k.eventName)?.get(k.selector);
      if (b)
        for (const K of [...b])
          K(k);
    }), () => {
      h?.delete(l);
    };
  }, q = {
    fetch: (o) => e.call("network.fetch", { url: o }),
    fetchAsDataUrl: (o) => e.call("network.fetchAsDataUrl", { url: o }),
    checkIframeEmbeddable: (o) => e.call("app.checkIframeEmbeddable", { url: o }),
    request: (o, r) => e.call("network.request", {
      url: o,
      method: r?.method ?? "GET",
      headers: r?.headers,
      body: r?.body
    })
  }, U = {
    get: (o) => e.call("storage.get", { key: o }),
    set: (o, r) => e.call("storage.set", { key: o, value: r }),
    remove: (o) => e.call("storage.remove", { key: o })
  }, w = /* @__PURE__ */ new Map();
  let z = null;
  const L = {
    playHls: (o) => e.call("media.playHls", { url: o }),
    stop: () => e.call("media.stop"),
    setVolume: (o) => e.call("media.setVolume", { volume: o }),
    setMuted: (o) => e.call("media.setMuted", { muted: o }),
    on: (o, r) => {
      let l = w.get(o);
      return l || (l = /* @__PURE__ */ new Set(), w.set(o, l)), l.add(r), z ??= e.subscribe("media-event", (f) => {
        const { eventName: h, detail: T } = f, k = w.get(h);
        if (k)
          for (const b of [...k])
            b(T);
      }), () => {
        l?.delete(r);
      };
    }
  }, H = {
    listDevices: (o) => e.call("audio.listDevices", { vendor: o }),
    setVolume: (o, r, l) => e.call("audio.setVolume", { vendor: o, deviceId: r, volumePercent: l }),
    setMuted: (o, r, l) => e.call("audio.setMuted", { vendor: o, deviceId: r, muted: l })
  };
  let E = null, m = null;
  const O = {
    subscribe: (o, r) => (m = r, E ??= e.subscribe("metrics-update", (l) => {
      m?.(l);
    }), e.call("metrics.subscribe", { intervalMs: o }), () => {
      m = null, e.call("metrics.unsubscribe").catch(() => {
      });
    })
  }, W = {
    has: (o) => d.includes(o),
    get requested() {
      return u;
    }
  }, j = {
    setLoading: (o) => e.emit("app.setLoading", { loading: o }),
    focusView: () => e.call("app.focusView"),
    setRequireFocus: (o) => e.call("app.setRequireFocus", { required: o }),
    isViewFocused: () => e.call("app.isViewFocused"),
    switchView: (o) => e.call("app.switchView", { viewNumber: o })
  }, B = {
    query: (o) => new ct(e, o)
  }, V = {
    resolve: (o) => N(c, o)
  }, x = () => {
    if (p = !1, !i || v)
      return;
    const o = nt(i, s), r = I(t.template, c), l = I(t.styles, c), h = tt(r)(o);
    e.emit("render", { html: h, styles: l }), i.afterRender?.();
  }, G = () => {
    p || v || (p = !0, queueMicrotask(() => {
      !v && p && x();
    }));
  };
  e.subscribe("init", (o) => {
    const r = o;
    s = r.payload ?? {}, n = r.config ?? {}, c = r.assetsBaseUrl ?? "", d = r.grantedPermissions ?? [], u = r.requestedPermissions ?? [], i = new a(), i._attach({
      dom: B,
      assets: V,
      network: q,
      media: L,
      audio: H,
      metrics: O,
      storage: U,
      permissions: W,
      app: j,
      getConfig: () => n,
      getPayload: () => s,
      onRegister: $
    }), F = at(i, G), i.onInit?.(), x();
  }), e.subscribe("payload-update", (o) => {
    const r = o;
    s = r.payload ?? {}, n = r.config ?? {}, i?.onUpdate?.(s), x();
  }), e.subscribe("destroy", () => {
    v = !0, p = !1, F(), M?.(), z?.(), E?.(), m && (m = null, e.call("metrics.unsubscribe").catch(() => {
    })), i?.onDestroy?.();
  }), e.emit("ready");
};
var g;
let pt = (g = class extends lt {
  constructor() {
    super(...arguments), this.clockTimerId = null, this.flipTimeouts = /* @__PURE__ */ new Map(), this.analogMarkerRotation = 0, this.flipDigits = [], this.previousTickActive = new Array(60).fill(""), this.analogQuarterDigits = [3, 6, 9, 12], this.analogAllDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], this.analogTicks = Array.from({ length: 60 }, (t, e) => e), this.shadows = it(!1);
  }
  onInit() {
    this.shadows.set(this.config.shadow === !0), this.flipDigits = this.createFlipDigits(this.getCurrentTime()), this.applyTimeToDom(this.getCurrentTime(), !0), this.scheduleNextTick();
  }
  onUpdate() {
    this.shadows.set(this.config.shadow === !0), this.flipDigits = this.createFlipDigits(this.getCurrentTime()), this.applyTimeToDom(this.getCurrentTime(), !0), this.scheduleNextTick();
  }
  onDestroy() {
    this.stopClock();
  }
  shadowsEnabled() {
    return this.shadows();
  }
  isAnalog() {
    return this.styles() === "analog";
  }
  isDigital() {
    return this.styles() === "digital";
  }
  isFlip() {
    return this.styles() === "flip";
  }
  styles() {
    const t = String(this.config.styles ?? "").toLowerCase();
    if (t === "flip" || t === "digital" || t === "analog")
      return t;
    const e = String(this.payload.name ?? "").toLowerCase();
    return e.includes("flip") ? "flip" : e.includes("analog") ? "analog" : (e.includes("digital"), "digital");
  }
  showSeconds() {
    return !!this.config.showSeconds;
  }
  ledFont() {
    return !!this.config.ledFont;
  }
  blinkSeparator() {
    return !!this.config.blinkSeparator;
  }
  showAllNumbers() {
    return !!this.config.showAllNumbers;
  }
  analogDigits() {
    return this.showAllNumbers() ? this.analogAllDigits : this.analogQuarterDigits;
  }
  getTickRotation(t) {
    return `rotate(${t * 6})`;
  }
  getDigitTransform(t) {
    return `rotate(${t * 30}) translate(0 -55) rotate(${-t * 30})`;
  }
  firstFlipPair() {
    return [0, 1];
  }
  secondFlipPair() {
    return [2, 3];
  }
  thirdFlipPair() {
    return [4, 5];
  }
  scheduleNextTick() {
    if (this.stopClock(), this.isAnalog()) {
      const e = () => {
        const i = /* @__PURE__ */ new Date();
        this.analogMarkerRotation = (i.getSeconds() + i.getMilliseconds() / 1e3) * 6, this.applyTimeToDom(this.getTimeForDate(i), !1), this.clockTimerId = setTimeout(e, g.ANALOG_REFRESH_MS);
      };
      e();
      return;
    }
    const t = () => {
      const e = Date.now(), i = this.isFlip() ? g.FLIP_DURATION_MS : 0;
      let s = 1e3 - e % 1e3 - i;
      s <= 0 && (s += 1e3), this.clockTimerId = setTimeout(() => {
        const n = Date.now(), c = this.isFlip() ? n + g.FLIP_DURATION_MS : n;
        this.applyTimeToDom(this.getTimeForDate(new Date(c)), !1), t();
      }, s);
    };
    t();
  }
  stopClock() {
    this.clockTimerId && (clearTimeout(this.clockTimerId), this.clockTimerId = null);
    for (const t of this.flipTimeouts.values())
      clearTimeout(t);
    this.flipTimeouts.clear();
  }
  applyTimeToDom(t, e) {
    this.applyDigital(t), this.applyAnalog(t), this.applyFlip(t, e);
  }
  applyDigital(t) {
    this.isDigital() && (this.dom.query("[data-clock-hour]").setText(t.h), this.dom.query("[data-clock-minute]").setText(t.m), this.showSeconds() && this.dom.query("[data-clock-second]").setText(t.s));
  }
  applyAnalog(t) {
    if (!this.isAnalog()) return;
    const e = this.getAnalogHourRotation(t), i = this.getAnalogMinuteRotation(t);
    this.dom.query("[data-analog-hour]").setAttribute("transform", `rotate(${e})`), this.dom.query("[data-analog-minute]").setAttribute("transform", `rotate(${i})`), this.showSeconds() && this.dom.query("[data-analog-marker]").setAttribute(
      "transform",
      `rotate(${this.analogMarkerRotation - 3} 0 0)`
    );
    for (let s = 0; s < this.analogTicks.length; s += 1) {
      const n = this.showSeconds() ? (() => {
        const c = this.getAnalogTickDistance(s);
        return c >= 0 ? String(c) : "";
      })() : "";
      this.previousTickActive[s] !== n && (this.previousTickActive[s] = n, this.dom.query(`[data-analog-tick="${s}"]`).setAttribute("data-active", n));
    }
  }
  applyFlip(t, e) {
    if (!this.isFlip()) return;
    const i = `${t.h}${t.m}${t.s}`.split("");
    for (let s = 0; s < i.length; s += 1) {
      const n = this.flipDigits[s] ?? { current: "0", next: "0", flipping: !1 }, c = i[s] ?? "0", d = this.flipTimeouts.get(s);
      if (d && (clearTimeout(d), this.flipTimeouts.delete(s)), e || n.current === c) {
        n.current = c, n.next = c, n.flipping = !1, this.flipDigits[s] = n, this.renderFlipDigit(s);
        continue;
      }
      n.next = c, n.flipping = !0, this.flipDigits[s] = n, this.renderFlipDigit(s);
      const u = setTimeout(() => {
        const p = this.flipDigits[s];
        p && (p.current = p.next, p.flipping = !1, this.flipDigits[s] = p, this.renderFlipDigit(s), this.flipTimeouts.delete(s));
      }, g.FLIP_DURATION_MS);
      this.flipTimeouts.set(s, u);
    }
  }
  renderFlipDigit(t) {
    const e = this.flipDigits[t];
    if (!e) return;
    const i = `[data-flip-index="${t}"]`;
    this.dom.query(i).toggleClass("flipping", e.flipping), this.dom.query(`${i} .digit-full`).setText(e.current), this.dom.query(`${i} .digit-static.top .value`).setText(e.flipping ? e.next : e.current), this.dom.query(`${i} .digit-static.bottom .value`).setText(e.current), this.dom.query(`${i} .digit-flip.top .value`).setText(e.current), this.dom.query(`${i} .digit-flip.bottom .value`).setText(e.next);
  }
  getAnalogHourRotation(t) {
    const e = Number(t.h) % 12, i = Number(t.m);
    return (e + i / 60) * 30;
  }
  getAnalogMinuteRotation(t) {
    const e = Number(t.m), i = Number(t.s);
    return (e + i / 60) * 6;
  }
  getAnalogTickDistance(t) {
    const e = (Math.round(this.analogMarkerRotation / 6) % 60 + 60) % 60;
    if (!Number.isFinite(e)) return -1;
    const i = (e - t + 60) % 60;
    return i <= 4 ? i : -1;
  }
  getCurrentTime() {
    return this.getTimeForDate(/* @__PURE__ */ new Date());
  }
  getTimeForDate(t) {
    const e = this.config.use24Hour === void 0 ? !0 : !!this.config.use24Hour;
    let i = t.getHours();
    return e || (i = i % 12 || 12), {
      h: String(i).padStart(2, "0"),
      m: String(t.getMinutes()).padStart(2, "0"),
      s: String(t.getSeconds()).padStart(2, "0")
    };
  }
  createFlipDigits(t) {
    return `${t.h}${t.m}${t.s}`.split("").map((e) => ({
      current: e,
      next: e,
      flipping: !1
    }));
  }
}, g.FLIP_DURATION_MS = 180, g.ANALOG_REFRESH_MS = 50, g);
const gt = `<div class="clock {{#if shadowsEnabled()}}shadows{{/if}}">
  {{#if isAnalog()}}
    <div class="analog-wrapper">
      <svg class="analog-clock" viewBox="-60 -60 120 120" aria-label="Analog clock">
        <circle class="dial" cx="0" cy="0" r="46"></circle>
        <g class="second-ticks">
          {{#each analogTicks}}
            <line
              class="tick"
              data-analog-tick="{{ this }}"
              data-active="{{ showSeconds() ? getAnalogTickDistance(this) : '' }}"
              x1="0"
              y1="-38"
              x2="0"
              y2="-42"
              transform="{{ getTickRotation(this) }}">
            </line>
          {{/each}}
        </g>
        <g class="hour-labels">
          {{#each analogDigits()}}
            <text
              class="digit"
              x="0"
              y="0"
              text-anchor="middle"
              dominant-baseline="middle"
              transform="{{ getDigitTransform(this) }}">
              {{ this }}
            </text>
          {{/each}}
        </g>
        <g class="hands">
          <line class="hand hour" data-analog-hour="true" x1="0" y1="5" x2="0" y2="-17"></line>
          <line class="hand minute" data-analog-minute="true" x1="0" y1="8" x2="0" y2="-26"></line>
        </g>
        {{#if showSeconds()}}
          <g class="seconds-marker" data-analog-marker="true">
            <path d="M -3 -31 L 3 -31 L 0 -36 Z"></path>
          </g>
        {{/if}}
        <circle class="pivot" cx="0" cy="0" r="2.4"></circle>
      </svg>
    </div>
  {{/if}}

  {{#if isDigital()}}
    <div class="digital-clock">
      {{#if ledFont()}}
        <div class="background">
          <div class="digits led">88</div>
          <div class="separator led">:</div>
          <div class="digits led">88</div>
          {{#if showSeconds()}}
            <div class="separator led">:</div>
            <div class="digits led">88</div>
          {{/if}}
        </div>
      {{/if}}

      <div class="digits{{ ledFont() ? ' led' : '' }}" data-clock-hour="true">00</div>
      <div class="separator{{ ledFont() ? ' led' : '' }}{{ blinkSeparator() ? ' blink' : '' }}">:</div>
      <div class="digits{{ ledFont() ? ' led' : '' }}" data-clock-minute="true">00</div>
      {{#if showSeconds()}}
        <div class="separator{{ ledFont() ? ' led' : '' }}{{ blinkSeparator() ? ' blink' : '' }}">:</div>
        <div class="digits{{ ledFont() ? ' led' : '' }}" data-clock-second="true">00</div>
      {{/if}}
    </div>
  {{/if}}

  {{#if isFlip()}}
    <div class="flipclock">
      <div class="digit-group">
        {{#each firstFlipPair()}}
          <div class="digit" data-flip-index="{{ this }}">
            <span class="digit-full">0</span>
            <span class="digit-static top"><span class="value">0</span></span>
            <span class="digit-static bottom"><span class="value">0</span></span>
            <span class="digit-flip top"><span class="value">0</span></span>
            <span class="digit-flip bottom"><span class="value">0</span></span>
          </div>
        {{/each}}
      </div>
      <div class="separator{{ blinkSeparator() ? ' blink' : '' }}">:</div>
      <div class="digit-group">
        {{#each secondFlipPair()}}
          <div class="digit" data-flip-index="{{ this }}">
            <span class="digit-full">0</span>
            <span class="digit-static top"><span class="value">0</span></span>
            <span class="digit-static bottom"><span class="value">0</span></span>
            <span class="digit-flip top"><span class="value">0</span></span>
            <span class="digit-flip bottom"><span class="value">0</span></span>
          </div>
        {{/each}}
      </div>
      {{#if showSeconds()}}
        <div class="separator{{ blinkSeparator() ? ' blink' : '' }}">:</div>
        <div class="digit-group">
          {{#each thirdFlipPair()}}
            <div class="digit" data-flip-index="{{ this }}">
              <span class="digit-full">0</span>
              <span class="digit-static top"><span class="value">0</span></span>
              <span class="digit-static bottom"><span class="value">0</span></span>
              <span class="digit-flip top"><span class="value">0</span></span>
              <span class="digit-flip bottom"><span class="value">0</span></span>
            </div>
          {{/each}}
        </div>
      {{/if}}
    </div>
  {{/if}}
</div>
`, ut = '.clock{width:100%;height:100%}.clock.shadows{filter:drop-shadow(-1px 1px 1px #000000)}.clock .blink{animation:blink .75s ease-out infinite alternate}.clock .analog-wrapper{--clock-size: min(var(--host-width, 200px), var(--host-height, 200px));--clock-padding: calc(var(--clock-size) / 15);width:100%;height:100%;display:flex;justify-content:center;align-items:center}.clock .analog-clock{width:calc(var(--clock-size) - var(--clock-padding) * 2);height:calc(var(--clock-size) - var(--clock-padding) * 2);overflow:visible;color:rgb(from var(--color-text) r g b/.88)}.clock .analog-clock .dial{fill:transparent;stroke:rgb(from var(--color-text) r g b/.68);stroke-width:1.2px}.clock .analog-clock .second-ticks .tick{stroke:rgb(from var(--color-text) r g b/.3);stroke-width:.8px;stroke-linecap:round;opacity:1;transition:stroke 1s linear,stroke-width 1s linear,opacity 1s linear}.clock .analog-clock .second-ticks .tick[data-active="0"]{stroke:rgb(from var(--color-text) r g b/.95);stroke-width:1.8px;opacity:1}.clock .analog-clock .second-ticks .tick[data-active="1"]{stroke:rgb(from var(--color-text) r g b/.8);stroke-width:1.5px;opacity:.82}.clock .analog-clock .second-ticks .tick[data-active="2"]{stroke:rgb(from var(--color-text) r g b/.62);stroke-width:1.25px;opacity:.64}.clock .analog-clock .second-ticks .tick[data-active="3"]{stroke:rgb(from var(--color-text) r g b/.48);stroke-width:1.05px;opacity:.5}.clock .analog-clock .second-ticks .tick[data-active="4"]{stroke:rgb(from var(--color-text) r g b/.44);stroke-width:.9px;opacity:.7}.clock .analog-clock .hour-labels .digit{fill:currentColor;font-size:.53rem;font-weight:500;font-family:sans-serif}.clock .analog-clock .hands .hand{stroke-linecap:round}.clock .analog-clock .hands .hour{stroke:rgb(from var(--color-text) r g b/.58);stroke-width:2.4px}.clock .analog-clock .hands .minute{stroke:rgb(from var(--color-text) r g b/.88);stroke-width:1.35px}.clock .analog-clock .seconds-marker path{fill:rgb(from var(--color-text) r g b/.96)}.clock .analog-clock .pivot{fill:var(--color-primary);stroke:var(--color-text);stroke-width:1.2px}.clock .digital-clock{width:100%;height:100%;display:flex;justify-content:center;align-items:center;font-size:calc(var(--host-width, 200px) / 5);position:relative}.clock .digital-clock .separator{display:flex;align-items:center;transform:translateY(-.1em)}.clock .digital-clock .separator.led{transform:translateY(-15%)}.clock .digital-clock .digits{font-variant-numeric:tabular-nums lining-nums}.clock .digital-clock .digits.led{font-family:digi-mono,monospace,sans-serif}.clock .digital-clock .background{display:flex;position:absolute;opacity:.2}.clock .flipclock{--clock-size: calc(var(--host-width, 200px) / 24);--digit-width: calc(var(--clock-size) * 3);--digit-height: calc(var(--clock-size) * 4.2);--digit-font-size: calc(var(--clock-size) * 3);--digit-radius: calc(var(--clock-size) * .4);--flip-duration: .25s;display:flex;align-items:center;justify-content:center;gap:calc(var(--clock-size) * .65);width:100%;height:100%}.clock .flipclock .digit-group{display:flex;gap:calc(var(--clock-size) * .3)}.clock .flipclock .separator{color:#eee;font-size:calc(var(--clock-size) * 2.4);font-weight:700;line-height:1;text-shadow:0 calc(var(--clock-size) * .05) calc(var(--clock-size) * .12) #333}.clock .flipclock .digit{position:relative;width:var(--digit-width);height:var(--digit-height);perspective:calc(var(--clock-size) * 28);border-radius:var(--digit-radius);box-shadow:0 calc(var(--clock-size) * .15) calc(var(--clock-size) * .45) #111}.clock .flipclock .digit .digit-full{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#eee;font-size:var(--digit-font-size);font-weight:700;line-height:1;text-shadow:0 calc(var(--clock-size) * .05) calc(var(--clock-size) * .12) #333;z-index:2}.clock .flipclock .digit:after{content:"";position:absolute;left:0;top:50%;width:100%;height:calc(var(--clock-size) * .08);transform:translateY(calc(var(--clock-size) * -.04));background:#000;z-index:4}.clock .flipclock .digit-static,.clock .flipclock .digit-flip{position:absolute;left:0;width:100%;height:50%;overflow:hidden;backface-visibility:hidden;z-index:1}.clock .flipclock .digit-static .value,.clock .flipclock .digit-flip .value{position:absolute;left:50%;width:100%;height:var(--digit-height);display:block;color:#eee;font-size:var(--digit-font-size);font-weight:700;line-height:var(--digit-height);text-align:center;transform:translate(-50%);text-shadow:0 calc(var(--clock-size) * .05) calc(var(--clock-size) * .12) #333}.clock .flipclock .digit-static.top,.clock .flipclock .digit-flip.top{top:0;background:#181818;border-top:1px solid black;border-radius:var(--digit-radius) var(--digit-radius) 0 0;box-shadow:inset 0 calc(var(--clock-size) * .5) calc(var(--clock-size) * 1.2) #111}.clock .flipclock .digit-static.top .value,.clock .flipclock .digit-flip.top .value{top:0}.clock .flipclock .digit-static.bottom,.clock .flipclock .digit-flip.bottom{bottom:0;background:#2a2a2a;border-bottom:1px solid #444444;border-radius:0 0 var(--digit-radius) var(--digit-radius);box-shadow:inset 0 calc(var(--clock-size) * .5) calc(var(--clock-size) * 1.2) #202020}.clock .flipclock .digit-static.bottom .value,.clock .flipclock .digit-flip.bottom .value{top:calc(var(--digit-height) * -.5)}.clock .flipclock .digit-static .value{opacity:0}.clock .flipclock .digit-flip{opacity:0;pointer-events:none;z-index:3}.clock .flipclock .digit-flip.top{transform-origin:50% 100%;transform:rotateX(0)}.clock .flipclock .digit-flip.bottom{display:none}.clock .flipclock .digit.flipping .digit-flip.top{opacity:1;animation:flipTop var(--flip-duration) ease-out forwards}@keyframes flipTop{0%{transform:rotateX(0)}to{transform:rotateX(-90deg)}}@keyframes blink{0%{opacity:1}49%{opacity:1}50%{opacity:0}to{opacity:0}}.text-shadows .analog-clock{filter:drop-shadow(1px 1px .25em rgba(0,0,0,.5))}', _ = dt(pt, { template: gt, styles: ut }), ht = _, kt = { DisplayDuckWidget: _, Widget: ht };
export {
  _ as DisplayDuckWidget,
  ht as Widget,
  kt as default
};
