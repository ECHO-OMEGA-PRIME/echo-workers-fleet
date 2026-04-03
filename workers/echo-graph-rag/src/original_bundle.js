--88e6989bdf480e66c6eeaa63a4703e5166ed977e0d69a0cb75c5b39d35ba
Content-Disposition: form-data; name="index.js"

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// node_modules/unenv/dist/runtime/_internal/utils.mjs
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
__name(PerformanceEntry, "PerformanceEntry");
var PerformanceMark = /* @__PURE__ */ __name(class PerformanceMark2 extends PerformanceEntry {
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
}, "PerformanceMark");
var PerformanceMeasure = class extends PerformanceEntry {
  entryType = "measure";
};
__name(PerformanceMeasure, "PerformanceMeasure");
var PerformanceResourceTiming = class extends PerformanceEntry {
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
__name(PerformanceResourceTiming, "PerformanceResourceTiming");
var PerformanceObserverEntryList = class {
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
__name(PerformanceObserverEntryList, "PerformanceObserverEntryList");
var Performance = class {
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
__name(Performance, "Performance");
var PerformanceObserver = class {
  __unenv__ = true;
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
__name(PerformanceObserver, "PerformanceObserver");
__publicField(PerformanceObserver, "supportedEntryTypes", []);
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
import { Socket } from "node:net";
var ReadStream = class extends Socket {
  fd;
  constructor(fd) {
    super();
    this.fd = fd;
  }
  isRaw = false;
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
  isTTY = false;
};
__name(ReadStream, "ReadStream");

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
import { Socket as Socket2 } from "node:net";
var WriteStream = class extends Socket2 {
  fd;
  constructor(fd) {
    super();
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  columns = 80;
  rows = 24;
  isTTY = false;
};
__name(WriteStream, "WriteStream");

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class extends EventEmitter {
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return "";
  }
  get versions() {
    return {};
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  ref() {
  }
  unref() {
  }
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: () => 0 });
  mainModule = void 0;
  domain = void 0;
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};
__name(Process, "Process");

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var { exit, platform, nextTick } = getBuiltinModule(
  "node:process"
);
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  nextTick
});
var {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  finalization,
  features,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  on,
  off,
  once,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context2, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context2.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context2, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context2.error = err;
            res = await onError(err, context2);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context2.finalized === false && onNotFound) {
          res = await onNotFound(context2);
        }
      }
      if (res && (context2.finalized === false || isError)) {
        context2.res = res;
      }
      return context2;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = /* @__PURE__ */ __name(class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
}, "HonoRequest");

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context2, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context: context2 }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context2, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = /* @__PURE__ */ __name(class {
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (layout) => this.#layout = layout;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#layout;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
}, "Context");

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = /* @__PURE__ */ __name(class extends Error {
}, "UnsupportedPathError");

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = /* @__PURE__ */ __name(class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env2, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env2, "GET")))();
    }
    const path = this.getPath(request, { env: env2 });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env: env2,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context2 = await composed(c);
        if (!context2.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context2.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
}, "_Hono");

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }, "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = /* @__PURE__ */ __name(class _Node {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context2, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context2.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context2, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
}, "_Node");

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = /* @__PURE__ */ __name(class {
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
}, "Trie");

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = /* @__PURE__ */ __name(class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
}, "RegExpRouter");

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = /* @__PURE__ */ __name(class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
}, "SmartRouter");

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = /* @__PURE__ */ __name(class _Node2 {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
}, "_Node");

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = /* @__PURE__ */ __name(class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
}, "TrieRouter");

// node_modules/hono/dist/hono.js
var Hono2 = /* @__PURE__ */ __name(class extends Hono {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
}, "Hono");

// node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// src/index.ts
var ALLOWED_ORIGINS = ["https://echo-ept.com", "https://www.echo-ept.com", "https://echo-op.com", "https://profinishusa.com", "https://bgat.echo-op.com"];
var app = new Hono2();
app.use("*", cors({
  origin: (o) => ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Echo-API-Key"]
}));
app.use("*", async (c, next) => {
  await next();
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("X-Frame-Options", "DENY");
  c.res.headers.set("X-XSS-Protection", "1; mode=block");
  c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  c.res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
});
var CACHE_TTL_SECONDS = 300;
var MAX_BATCH_SIZE = 500;
var MAX_HOPS = 5;
var MAX_RESULTS = 50;
var QUERY_TIME_BUDGET_MS = 8e3;
var TRAVERSE_TIME_BUDGET_MS = 1e4;
var EXPLAIN_TIME_BUDGET_MS = 8e3;
var STOP_WORDS = /* @__PURE__ */ new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "shall",
  "can",
  "that",
  "which",
  "who",
  "whom",
  "this",
  "these",
  "those",
  "it",
  "its",
  "not",
  "no",
  "nor",
  "as",
  "if",
  "then",
  "than",
  "too",
  "very",
  "just",
  "about",
  "also",
  "into",
  "over",
  "after",
  "before",
  "between",
  "under",
  "above",
  "such",
  "each",
  "every",
  "all",
  "any",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "only",
  "same",
  "so",
  "what",
  "how",
  "when",
  "where",
  "why",
  "while",
  "during",
  "through",
  "because",
  "since",
  "until"
]);
function log3(level, message, data) {
  const entry = JSON.stringify({ ts: (/* @__PURE__ */ new Date()).toISOString(), level, message, worker: "echo-graph-rag", ...data });
  if (level === "error")
    console.error(entry);
  else if (level === "warn")
    console.warn(entry);
  else
    console.log(entry);
}
__name(log3, "log");
function normalizeText(text) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, " ");
}
__name(normalizeText, "normalizeText");
function generateNodeId(label, type, domain2) {
  const normalized = normalizeText(label);
  return `${type}:${domain2}:${normalized}`.replace(/\s+/g, "_").substring(0, 200);
}
__name(generateNodeId, "generateNodeId");
function extractKeywords(text) {
  const words = normalizeText(text).split(/\s+/);
  return words.filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}
__name(extractKeywords, "extractKeywords");
function cosineSimilarity(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item))
      intersection++;
  }
  const denominator = Math.sqrt(setA.size) * Math.sqrt(setB.size);
  return denominator === 0 ? 0 : intersection / denominator;
}
__name(cosineSimilarity, "cosineSimilarity");
function jsonParse(raw2, fallback) {
  if (!raw2)
    return fallback;
  try {
    return JSON.parse(raw2);
  } catch (e) {
    log3("warn", "JSON parse failed, using fallback", { error: e?.message || String(e) });
    return fallback;
  }
}
__name(jsonParse, "jsonParse");
function dbNodeToGraphNode(row) {
  return {
    id: row.id,
    label: row.label,
    type: row.type,
    domain: row.domain,
    properties: jsonParse(row.properties, {}),
    doctrine_ids: jsonParse(row.doctrine_ids, []),
    weight: row.weight || 1,
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at
  };
}
__name(dbNodeToGraphNode, "dbNodeToGraphNode");
function dbEdgeToGraphEdge(row) {
  return {
    id: row.id,
    source_id: row.source_id,
    target_id: row.target_id,
    relationship: row.relationship,
    weight: row.weight || 1,
    properties: jsonParse(row.properties, {}),
    created_at: row.created_at
  };
}
__name(dbEdgeToGraphEdge, "dbEdgeToGraphEdge");
function extractEntitiesFromDoctrine(doctrine) {
  const entities = [];
  const domain2 = doctrine.domain || "unknown";
  const docId = doctrine.id;
  if (doctrine.topic) {
    entities.push({
      id: generateNodeId(doctrine.topic, "concept", domain2),
      label: doctrine.topic,
      type: "concept",
      domain: domain2,
      source_doctrine_id: docId,
      context: doctrine.conclusion_template || ""
    });
  }
  if (doctrine.keywords && Array.isArray(doctrine.keywords)) {
    for (const kw of doctrine.keywords) {
      if (kw && kw.length > 2) {
        entities.push({
          id: generateNodeId(kw, "keyword", domain2),
          label: kw,
          type: "keyword",
          domain: domain2,
          source_doctrine_id: docId,
          context: doctrine.topic || ""
        });
      }
    }
  }
  if (doctrine.primary_authority && Array.isArray(doctrine.primary_authority)) {
    for (const auth of doctrine.primary_authority) {
      if (auth && auth.length > 2) {
        const authDomain = "authority";
        entities.push({
          id: generateNodeId(auth, "authority", authDomain),
          label: auth,
          type: "authority",
          domain: authDomain,
          source_doctrine_id: docId,
          context: doctrine.topic || ""
        });
      }
    }
  }
  if (doctrine.controlling_precedent && doctrine.controlling_precedent.length > 3) {
    entities.push({
      id: generateNodeId(doctrine.controlling_precedent, "precedent", domain2),
      label: doctrine.controlling_precedent,
      type: "precedent",
      domain: domain2,
      source_doctrine_id: docId,
      context: doctrine.topic || ""
    });
  }
  if (doctrine.key_factors && Array.isArray(doctrine.key_factors)) {
    for (const factor of doctrine.key_factors) {
      if (factor && factor.length > 5) {
        entities.push({
          id: generateNodeId(factor, "concept", domain2),
          label: factor,
          type: "concept",
          domain: domain2,
          source_doctrine_id: docId,
          context: doctrine.topic || ""
        });
      }
    }
  }
  if (doctrine.entity_scope && doctrine.entity_scope.length > 2) {
    entities.push({
      id: generateNodeId(doctrine.entity_scope, "entity", domain2),
      label: doctrine.entity_scope,
      type: "entity",
      domain: domain2,
      source_doctrine_id: docId,
      context: doctrine.topic || ""
    });
  }
  entities.push({
    id: generateNodeId(domain2, "domain", domain2),
    label: domain2,
    type: "domain",
    domain: domain2,
    source_doctrine_id: docId,
    context: `Domain: ${domain2}`
  });
  const legalCodePattern = /(?:IRC|26\s*U\.?S\.?C\.?|I\.?R\.?C\.?)\s*(?:(?:Section|Sec\.?|§)\s*)?(\d+[A-Za-z]?(?:\([a-z0-9]+\))*)/gi;
  const combinedText = `${doctrine.conclusion_template || ""} ${doctrine.reasoning_framework || ""}`;
  const codeMatches = combinedText.matchAll(legalCodePattern);
  for (const match2 of codeMatches) {
    const code = match2[0].trim();
    if (code.length > 3) {
      entities.push({
        id: generateNodeId(code, "legal_code", "tax_code"),
        label: code,
        type: "legal_code",
        domain: "tax_code",
        source_doctrine_id: docId,
        context: doctrine.topic || ""
      });
    }
  }
  const regPattern = /(?:Treas\.?\s*Reg\.?|Treasury\s*Regulation|26\s*C\.?F\.?R\.?)\s*(?:Section|Sec\.?|§)?\s*([\d.]+(?:\([a-z0-9]+\))*)/gi;
  const regMatches = combinedText.matchAll(regPattern);
  for (const match2 of regMatches) {
    const reg = match2[0].trim();
    if (reg.length > 5) {
      entities.push({
        id: generateNodeId(reg, "legal_code", "regulation"),
        label: reg,
        type: "legal_code",
        domain: "regulation",
        source_doctrine_id: docId,
        context: doctrine.topic || ""
      });
    }
  }
  return entities;
}
__name(extractEntitiesFromDoctrine, "extractEntitiesFromDoctrine");
function extractEdgesFromDoctrine(doctrine, entities) {
  const edges = [];
  const docId = doctrine.id;
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const a = entities[i];
      const b = entities[j];
      if (a.id === b.id)
        continue;
      if (a.type === "domain" && b.type === "domain")
        continue;
      let relationship = "co_occurs";
      let weight = 0.5;
      if (a.type === "concept" && b.type === "authority" || a.type === "authority" && b.type === "concept") {
        relationship = "cites";
        weight = 0.8;
      }
      if (a.type === "concept" && b.type === "legal_code" || a.type === "legal_code" && b.type === "concept") {
        relationship = "cites";
        weight = 0.9;
      }
      if (a.type === "keyword" && b.type === "concept") {
        relationship = "specializes";
        weight = 0.6;
      }
      if (a.type === "concept" && b.type === "keyword") {
        relationship = "generalizes";
        weight = 0.6;
      }
      if (a.type === "domain" || b.type === "domain") {
        relationship = "related_to";
        weight = 0.3;
      }
      if (a.domain !== b.domain && a.type !== "domain" && b.type !== "domain") {
        relationship = "bridges";
        weight = 1;
      }
      edges.push({
        source_id: a.id,
        target_id: b.id,
        relationship,
        weight,
        doctrine_id: docId
      });
    }
  }
  return edges;
}
__name(extractEdgesFromDoctrine, "extractEdgesFromDoctrine");
function findCrossDoctrineEdges(nodeMap) {
  const crossEdges = [];
  const nodeIds = Array.from(nodeMap.keys());
  for (let i = 0; i < nodeIds.length; i++) {
    const nodeA = nodeMap.get(nodeIds[i]);
    if (nodeA.doctrineIds.size < 2)
      continue;
    for (let j = i + 1; j < nodeIds.length; j++) {
      const nodeB = nodeMap.get(nodeIds[j]);
      if (nodeB.doctrineIds.size < 2)
        continue;
      let sharedDoctrines = 0;
      for (const dId of nodeA.doctrineIds) {
        if (nodeB.doctrineIds.has(dId))
          sharedDoctrines++;
      }
      if (sharedDoctrines > 0) {
        const domainsA = Array.from(nodeA.domains);
        const domainsB = Array.from(nodeB.domains);
        const crossDomain = !domainsA.some((d) => domainsB.includes(d));
        crossEdges.push({
          source_id: nodeIds[i],
          target_id: nodeIds[j],
          relationship: crossDomain ? "bridges" : "related_to",
          weight: Math.min(sharedDoctrines * 0.3, 2),
          doctrine_id: `cross:${sharedDoctrines}`
        });
      }
    }
    if (crossEdges.length > 5e4)
      break;
  }
  return crossEdges;
}
__name(findCrossDoctrineEdges, "findCrossDoctrineEdges");
function parseDomain(engineId) {
  return engineId.replace(/\d+$/, "").toLowerCase();
}
__name(parseDomain, "parseDomain");
function parseJsonArray(raw2) {
  if (!raw2)
    return [];
  try {
    const parsed = JSON.parse(raw2);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    log3("warn", "parseJsonArray failed, treating as comma-separated", { error: e?.message || String(e) });
    return raw2.includes(",") ? raw2.split(",").map((s) => s.trim()).filter(Boolean) : [raw2];
  }
}
__name(parseJsonArray, "parseJsonArray");
function d1RowToDoctrine(row) {
  const engineId = row.engine_id || "";
  return {
    id: String(row.id || ""),
    engine_id: engineId,
    domain: parseDomain(engineId),
    topic: row.topic || "",
    keywords: parseJsonArray(row.keywords),
    conclusion_template: row.conclusion || "",
    reasoning_framework: row.reasoning || "",
    key_factors: parseJsonArray(row.key_factors),
    primary_authority: parseJsonArray(row.authorities),
    controlling_precedent: "",
    confidence: row.confidence || "DEFENSIBLE",
    entity_scope: "",
    burden_holder: "",
    adversary_position: "",
    counter_arguments: [],
    resolution_strategy: ""
  };
}
__name(d1RowToDoctrine, "d1RowToDoctrine");
async function fetchDoctrines(env2, offset, limit) {
  try {
    const [countRes, dataRes] = await Promise.all([
      env2.DOCTRINES_DB.prepare("SELECT COUNT(*) as cnt FROM doctrines").first(),
      env2.DOCTRINES_DB.prepare(
        "SELECT id, engine_id, topic, keywords, conclusion, reasoning, key_factors, authorities, confidence FROM doctrines ORDER BY id LIMIT ? OFFSET ?"
      ).bind(limit, offset).all()
    ]);
    const total = countRes?.cnt || 0;
    const doctrines = (dataRes.results || []).map((row) => d1RowToDoctrine(row));
    return { doctrines, total };
  } catch (err) {
    log3("error", "doctrine_fetch_failed", { error: String(err) });
    return { doctrines: [], total: 0 };
  }
}
__name(fetchDoctrines, "fetchDoctrines");
async function fetchDoctrineById(env2, doctrineId) {
  try {
    const numId = parseInt(doctrineId, 10);
    if (!isNaN(numId)) {
      const row2 = await env2.DOCTRINES_DB.prepare(
        "SELECT id, engine_id, topic, keywords, conclusion, reasoning, key_factors, authorities, confidence FROM doctrines WHERE id = ?"
      ).bind(numId).first();
      if (row2)
        return d1RowToDoctrine(row2);
    }
    const row = await env2.DOCTRINES_DB.prepare(
      "SELECT id, engine_id, topic, keywords, conclusion, reasoning, key_factors, authorities, confidence FROM doctrines WHERE INSTR(LOWER(topic), LOWER(?)) > 0 LIMIT 1"
    ).bind(doctrineId).first();
    if (row)
      return d1RowToDoctrine(row);
    return null;
  } catch (e) {
    log3("warn", "Doctrine lookup failed", { error: e?.message || String(e) });
    return null;
  }
}
__name(fetchDoctrineById, "fetchDoctrineById");
async function detectCommunities(db) {
  const edgeResult = await db.prepare(
    `SELECT source_id, target_id, weight FROM edges WHERE weight >= 0.5 ORDER BY weight DESC LIMIT 10000`
  ).all();
  if (!edgeResult.results || edgeResult.results.length === 0)
    return 0;
  const adjacency = /* @__PURE__ */ new Map();
  for (const row of edgeResult.results) {
    const s = row.source_id;
    const t = row.target_id;
    const w = row.weight || 1;
    if (!adjacency.has(s))
      adjacency.set(s, /* @__PURE__ */ new Map());
    if (!adjacency.has(t))
      adjacency.set(t, /* @__PURE__ */ new Map());
    adjacency.get(s).set(t, w);
    adjacency.get(t).set(s, w);
  }
  const labels = /* @__PURE__ */ new Map();
  let labelCounter = 0;
  for (const nodeId of adjacency.keys()) {
    labels.set(nodeId, labelCounter++);
  }
  for (let iter = 0; iter < 5; iter++) {
    const nodeIds = Array.from(adjacency.keys());
    for (let i = nodeIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nodeIds[i], nodeIds[j]] = [nodeIds[j], nodeIds[i]];
    }
    for (const nodeId of nodeIds) {
      const neighbors = adjacency.get(nodeId);
      if (!neighbors || neighbors.size === 0)
        continue;
      const votes = /* @__PURE__ */ new Map();
      for (const [neighbor, weight] of neighbors) {
        const nlabel = labels.get(neighbor);
        if (nlabel !== void 0) {
          votes.set(nlabel, (votes.get(nlabel) || 0) + weight);
        }
      }
      let maxVote = -1;
      let bestLabel = labels.get(nodeId);
      for (const [label, vote] of votes) {
        if (vote > maxVote) {
          maxVote = vote;
          bestLabel = label;
        }
      }
      labels.set(nodeId, bestLabel);
    }
  }
  const communityMap = /* @__PURE__ */ new Map();
  for (const [nodeId, label] of labels) {
    if (!communityMap.has(label))
      communityMap.set(label, []);
    communityMap.get(label).push(nodeId);
  }
  await db.prepare("DELETE FROM communities").run();
  let communitiesFound = 0;
  const stmts = [];
  for (const [, members] of communityMap) {
    if (members.length < 3)
      continue;
    const placeholders = members.slice(0, 50).map(() => "?").join(",");
    const domainResult = await db.prepare(
      `SELECT DISTINCT domain FROM nodes WHERE id IN (${placeholders}) AND domain IS NOT NULL`
    ).bind(...members.slice(0, 50)).all();
    const domains = domainResult.results?.map((r) => r.domain) || [];
    const labelResult = await db.prepare(
      `SELECT label FROM nodes WHERE id IN (${placeholders}) AND type = 'concept' ORDER BY weight DESC LIMIT 3`
    ).bind(...members.slice(0, 50)).all();
    const topLabels = labelResult.results?.map((r) => r.label) || [];
    const communityName = topLabels.length > 0 ? topLabels.join(" + ") : `Community ${communitiesFound + 1}`;
    const summary = `Cluster of ${members.length} connected concepts across domains: ${domains.join(", ")}. Key topics: ${topLabels.join(", ")}.`;
    let internalEdges = 0;
    if (members.length <= 50) {
      const memberSet = new Set(members);
      for (const m of members) {
        const neighbors = adjacency.get(m);
        if (neighbors) {
          for (const [n] of neighbors) {
            if (memberSet.has(n))
              internalEdges++;
          }
        }
      }
      internalEdges = internalEdges / 2;
    }
    const maxEdges = members.length * (members.length - 1) / 2;
    const density = maxEdges > 0 ? internalEdges / maxEdges : 0;
    stmts.push(
      db.prepare(
        `INSERT INTO communities (name, node_ids, summary, domains, size, density) VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        communityName,
        JSON.stringify(members.slice(0, 500)),
        summary,
        JSON.stringify(domains),
        members.length,
        Math.round(density * 1e3) / 1e3
      )
    );
    communitiesFound++;
    if (stmts.length >= 20) {
      await db.batch(stmts.splice(0, stmts.length));
    }
  }
  if (stmts.length > 0) {
    await db.batch(stmts);
  }
  return communitiesFound;
}
__name(detectCommunities, "detectCommunities");
app.get("/health", async (c) => {
  const db = c.env.DB;
  let nodeCount = 0;
  let edgeCount = 0;
  try {
    const nRes = await db.prepare("SELECT COUNT(*) as cnt FROM nodes").first();
    const eRes = await db.prepare("SELECT COUNT(*) as cnt FROM edges").first();
    nodeCount = nRes?.cnt || 0;
    edgeCount = eRes?.cnt || 0;
  } catch (e) {
    log3("warn", "Health check DB count failed, tables may not exist yet", { error: e?.message || String(e) });
  }
  return c.json({
    status: "healthy",
    service: "echo-graph-rag",
    version: "1.0.0",
    graph: {
      nodes: nodeCount,
      edges: edgeCount
    },
    uptime: Date.now(),
    environment: c.env.ENVIRONMENT
  });
});
app.get("/graph/stats", async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;
  const cached = await cache.get("graph:stats", "json");
  if (cached)
    return c.json(cached);
  try {
    const [
      nodeCountRes,
      edgeCountRes,
      communityCountRes,
      nodeTypeRes,
      edgeRelRes,
      topNodesRes,
      crossDomainRes,
      domainNodeRes,
      lastBuildRes
    ] = await Promise.all([
      db.prepare("SELECT COUNT(*) as cnt FROM nodes").first(),
      db.prepare("SELECT COUNT(*) as cnt FROM edges").first(),
      db.prepare("SELECT COUNT(*) as cnt FROM communities").first(),
      db.prepare("SELECT type, COUNT(*) as cnt FROM nodes GROUP BY type").all(),
      db.prepare("SELECT relationship, COUNT(*) as cnt FROM edges GROUP BY relationship").all(),
      db.prepare(`
        SELECT n.id, n.label, COUNT(e.id) as connections
        FROM nodes n
        LEFT JOIN edges e ON (e.source_id = n.id OR e.target_id = n.id)
        GROUP BY n.id
        ORDER BY connections DESC
        LIMIT 20
      `).all(),
      db.prepare(`
        SELECT COUNT(*) as cnt FROM edges e
        JOIN nodes n1 ON e.source_id = n1.id
        JOIN nodes n2 ON e.target_id = n2.id
        WHERE n1.domain != n2.domain AND n1.domain IS NOT NULL AND n2.domain IS NOT NULL
      `).first(),
      db.prepare("SELECT domain, COUNT(*) as cnt FROM nodes WHERE domain IS NOT NULL GROUP BY domain").all(),
      db.prepare("SELECT created_at FROM build_log ORDER BY id DESC LIMIT 1").first()
    ]);
    const totalNodes = nodeCountRes?.cnt || 0;
    const totalEdges = edgeCountRes?.cnt || 0;
    const nodeTypeDist = {};
    for (const row of nodeTypeRes.results || []) {
      nodeTypeDist[row.type] = row.cnt;
    }
    const edgeRelDist = {};
    for (const row of edgeRelRes.results || []) {
      edgeRelDist[row.relationship] = row.cnt;
    }
    const domainDist = {};
    for (const row of domainNodeRes.results || []) {
      const d = row.domain;
      domainDist[d] = { nodes: row.cnt, edges: 0 };
    }
    const mostConnected = (topNodesRes.results || []).map((r) => ({
      id: r.id,
      label: r.label,
      connections: r.connections
    }));
    const avgDegree = totalNodes > 0 ? 2 * totalEdges / totalNodes : 0;
    const maxPossibleEdges = totalNodes * (totalNodes - 1) / 2;
    const density = maxPossibleEdges > 0 ? totalEdges / maxPossibleEdges : 0;
    const stats = {
      total_nodes: totalNodes,
      total_edges: totalEdges,
      total_communities: communityCountRes?.cnt || 0,
      node_type_distribution: nodeTypeDist,
      edge_relationship_distribution: edgeRelDist,
      domain_distribution: domainDist,
      most_connected_nodes: mostConnected,
      cross_domain_edge_count: crossDomainRes?.cnt || 0,
      avg_degree: Math.round(avgDegree * 100) / 100,
      density: Math.round(density * 1e4) / 1e4,
      last_build: lastBuildRes?.created_at || null
    };
    await cache.put("graph:stats", JSON.stringify(stats), { expirationTtl: CACHE_TTL_SECONDS });
    return c.json(stats);
  } catch (err) {
    return c.json({ error: "Failed to compute stats", details: String(err) }, 500);
  }
});
app.get("/graph/domains", async (c) => {
  const db = c.env.DB;
  try {
    const domainResult = await db.prepare(`
      SELECT domain, COUNT(*) as node_count
      FROM nodes
      WHERE domain IS NOT NULL
      GROUP BY domain
      ORDER BY node_count DESC
    `).all();
    const domains = [];
    for (const row of domainResult.results || []) {
      const domain2 = row.domain;
      const edgeRes = await db.prepare(`
        SELECT COUNT(*) as cnt FROM edges e
        JOIN nodes n ON (e.source_id = n.id OR e.target_id = n.id)
        WHERE n.domain = ?
      `).bind(domain2).first();
      const conceptRes = await db.prepare(`
        SELECT label FROM nodes
        WHERE domain = ? AND type IN ('concept', 'keyword')
        ORDER BY weight DESC
        LIMIT 5
      `).bind(domain2).all();
      const connRes = await db.prepare(`
        SELECT DISTINCT n2.domain FROM edges e
        JOIN nodes n1 ON e.source_id = n1.id
        JOIN nodes n2 ON e.target_id = n2.id
        WHERE n1.domain = ? AND n2.domain != ? AND n2.domain IS NOT NULL
        LIMIT 10
      `).bind(domain2, domain2).all();
      domains.push({
        domain: domain2,
        node_count: row.node_count,
        edge_count: edgeRes?.cnt || 0,
        top_concepts: (conceptRes.results || []).map((r) => r.label),
        connected_domains: (connRes.results || []).map((r) => r.domain)
      });
    }
    return c.json({ domains, total: domains.length });
  } catch (err) {
    return c.json({ error: "Failed to list domains", details: String(err) }, 500);
  }
});
app.get("/graph/node/:id", async (c) => {
  const db = c.env.DB;
  const nodeId = decodeURIComponent(c.req.param("id"));
  try {
    const nodeRow = await db.prepare("SELECT * FROM nodes WHERE id = ?").bind(nodeId).first();
    if (!nodeRow)
      return c.json({ error: "Node not found" }, 404);
    const node = dbNodeToGraphNode(nodeRow);
    const edgeResult = await db.prepare(`
      SELECT * FROM edges WHERE source_id = ? OR target_id = ? ORDER BY weight DESC LIMIT 100
    `).bind(nodeId, nodeId).all();
    const edges = (edgeResult.results || []).map((r) => dbEdgeToGraphEdge(r));
    const connectedIds = /* @__PURE__ */ new Set();
    for (const e of edges) {
      if (e.source_id !== nodeId)
        connectedIds.add(e.source_id);
      if (e.target_id !== nodeId)
        connectedIds.add(e.target_id);
    }
    let connectedNodes = [];
    if (connectedIds.size > 0) {
      const ids = Array.from(connectedIds).slice(0, 50);
      const placeholders = ids.map(() => "?").join(",");
      const connResult = await db.prepare(
        `SELECT * FROM nodes WHERE id IN (${placeholders})`
      ).bind(...ids).all();
      connectedNodes = (connResult.results || []).map((r) => dbNodeToGraphNode(r));
    }
    return c.json({
      node,
      edges,
      connected_nodes: connectedNodes,
      connection_count: edges.length
    });
  } catch (err) {
    return c.json({ error: "Failed to fetch node", details: String(err) }, 500);
  }
});
app.get("/graph/connections/:domain1/:domain2", async (c) => {
  const db = c.env.DB;
  const domain1 = decodeURIComponent(c.req.param("domain1"));
  const domain2 = decodeURIComponent(c.req.param("domain2"));
  try {
    const directEdges = await db.prepare(`
      SELECT e.*, n1.label as source_label, n1.domain as source_domain,
             n2.label as target_label, n2.domain as target_domain
      FROM edges e
      JOIN nodes n1 ON e.source_id = n1.id
      JOIN nodes n2 ON e.target_id = n2.id
      WHERE (n1.domain = ? AND n2.domain = ?) OR (n1.domain = ? AND n2.domain = ?)
      ORDER BY e.weight DESC
      LIMIT 50
    `).bind(domain1, domain2, domain2, domain1).all();
    const bridgingNodes = await db.prepare(`
      SELECT DISTINCT n.id, n.label, n.type, n.domain, n.weight, n.doctrine_ids
      FROM nodes n
      JOIN edges e1 ON (e1.source_id = n.id OR e1.target_id = n.id)
      JOIN nodes n1 ON (CASE WHEN e1.source_id = n.id THEN e1.target_id ELSE e1.source_id END) = n1.id
      JOIN edges e2 ON (e2.source_id = n.id OR e2.target_id = n.id)
      JOIN nodes n2 ON (CASE WHEN e2.source_id = n.id THEN e2.target_id ELSE e2.source_id END) = n2.id
      WHERE n1.domain = ? AND n2.domain = ? AND n.id != n1.id AND n.id != n2.id
      LIMIT 20
    `).bind(domain1, domain2).all();
    const bridgingDoctrineIds = /* @__PURE__ */ new Set();
    for (const node of bridgingNodes.results || []) {
      const docIds = jsonParse(node.doctrine_ids, []);
      for (const id of docIds)
        bridgingDoctrineIds.add(id);
    }
    const result = {
      from_domain: domain1,
      to_domain: domain2,
      shortest_path: (bridgingNodes.results || []).map((r) => dbNodeToGraphNode(r)),
      bridging_edges: (directEdges.results || []).map((r) => dbEdgeToGraphEdge(r)),
      bridging_doctrines: [],
      total_paths: (directEdges.results?.length || 0) + (bridgingNodes.results?.length || 0)
    };
    return c.json(result);
  } catch (err) {
    return c.json({ error: "Failed to find connections", details: String(err) }, 500);
  }
});
app.post("/graph/build", async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;
  const startTime = Date.now();
  let body = {};
  try {
    body = await c.req.json();
  } catch (e) {
    log3("warn", "Failed to parse graph build request body, using defaults", { error: e?.message || String(e) });
  }
  const forceRebuild = body.force_rebuild ?? false;
  const filterDomains = body.domains || null;
  const batchSize = Math.min(body.batch_size || MAX_BATCH_SIZE, MAX_BATCH_SIZE);
  const maxDoctrines = Math.min(body.max_doctrines || 3e3, 5e3);
  const startOffset = body.start_offset || 0;
  try {
    const buildLog = await db.prepare(
      `INSERT INTO build_log (action, status) VALUES (?, 'running') RETURNING id`
    ).bind(forceRebuild ? "rebuild" : "incremental").first();
    const buildId = buildLog?.id || 0;
    if (forceRebuild && startOffset === 0) {
      await db.batch([
        db.prepare("DELETE FROM edges"),
        db.prepare("DELETE FROM nodes"),
        db.prepare("DELETE FROM communities")
      ]);
    }
    let offset = startOffset;
    let totalDoctrines = 0;
    let allEntities = [];
    let allEdges = [];
    const nodeMap = /* @__PURE__ */ new Map();
    let totalFetched = 0;
    while (totalFetched < maxDoctrines) {
      const fetchLimit = Math.min(batchSize, maxDoctrines - totalFetched);
      const { doctrines, total } = await fetchDoctrines(c.env, offset, fetchLimit);
      if (totalDoctrines === 0)
        totalDoctrines = total;
      if (doctrines.length === 0)
        break;
      for (const doctrine of doctrines) {
        if (filterDomains && !filterDomains.includes(doctrine.domain))
          continue;
        const entities = extractEntitiesFromDoctrine(doctrine);
        const edges = extractEdgesFromDoctrine(doctrine, entities);
        allEntities.push(...entities);
        allEdges.push(...edges);
        for (const entity of entities) {
          if (!nodeMap.has(entity.id)) {
            nodeMap.set(entity.id, { doctrineIds: /* @__PURE__ */ new Set(), domains: /* @__PURE__ */ new Set() });
          }
          nodeMap.get(entity.id).doctrineIds.add(entity.source_doctrine_id);
          nodeMap.get(entity.id).domains.add(entity.domain);
        }
      }
      totalFetched += doctrines.length;
      offset += batchSize;
    }
    if (nodeMap.size < 1e4) {
      const crossEdges = findCrossDoctrineEdges(nodeMap);
      allEdges.push(...crossEdges);
    }
    const uniqueNodes = /* @__PURE__ */ new Map();
    const nodeDoctrineIds = /* @__PURE__ */ new Map();
    for (const entity of allEntities) {
      if (!uniqueNodes.has(entity.id)) {
        uniqueNodes.set(entity.id, entity);
        nodeDoctrineIds.set(entity.id, /* @__PURE__ */ new Set());
      }
      nodeDoctrineIds.get(entity.id).add(entity.source_doctrine_id);
    }
    const uniqueEdges = /* @__PURE__ */ new Map();
    for (const edge of allEdges) {
      const key = `${edge.source_id}|${edge.target_id}|${edge.relationship}`;
      const reverseKey = `${edge.target_id}|${edge.source_id}|${edge.relationship}`;
      if (!uniqueEdges.has(key) && !uniqueEdges.has(reverseKey)) {
        uniqueEdges.set(key, edge);
      } else {
        const existing = uniqueEdges.get(key) || uniqueEdges.get(reverseKey);
        if (existing) {
          existing.weight = Math.min(existing.weight + 0.1, 3);
        }
      }
    }
    let nodesCreated = 0;
    const nodeStmts = [];
    for (const [nodeId, entity] of uniqueNodes) {
      const docIds = Array.from(nodeDoctrineIds.get(nodeId) || []);
      const weight = docIds.length;
      nodeStmts.push(
        db.prepare(`
          INSERT OR REPLACE INTO nodes (id, label, type, domain, properties, doctrine_ids, weight, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          nodeId,
          entity.label,
          entity.type,
          entity.domain,
          JSON.stringify({ context: entity.context }),
          JSON.stringify(docIds.slice(0, 100)),
          weight
        )
      );
      nodesCreated++;
      if (nodeStmts.length >= 80) {
        await db.batch(nodeStmts.splice(0, nodeStmts.length));
      }
    }
    if (nodeStmts.length > 0) {
      await db.batch(nodeStmts);
    }
    let edgesCreated = 0;
    const edgeStmts = [];
    for (const [, edge] of uniqueEdges) {
      if (!uniqueNodes.has(edge.source_id) || !uniqueNodes.has(edge.target_id))
        continue;
      edgeStmts.push(
        db.prepare(`
          INSERT INTO edges (source_id, target_id, relationship, weight, properties)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          edge.source_id,
          edge.target_id,
          edge.relationship,
          edge.weight,
          JSON.stringify({ doctrine_id: edge.doctrine_id })
        )
      );
      edgesCreated++;
      if (edgeStmts.length >= 80) {
        await db.batch(edgeStmts.splice(0, edgeStmts.length));
      }
    }
    if (edgeStmts.length > 0) {
      await db.batch(edgeStmts);
    }
    const communitiesFound = await detectCommunities(db);
    const domainResult = await db.prepare(
      "SELECT DISTINCT domain FROM nodes WHERE domain IS NOT NULL ORDER BY domain"
    ).all();
    const domainsConnected = (domainResult.results || []).map((r) => r.domain);
    const durationMs = Date.now() - startTime;
    await db.prepare(`
      UPDATE build_log SET nodes_created = ?, edges_created = ?, communities_found = ?,
        doctrines_processed = ?, duration_ms = ?, status = 'complete'
      WHERE id = ?
    `).bind(nodesCreated, edgesCreated, communitiesFound, totalFetched, durationMs, buildId).run();
    await cache.delete("graph:stats");
    const nextOffset = startOffset + totalFetched;
    const hasMore = nextOffset < totalDoctrines;
    const response = {
      status: hasMore ? "partial" : "complete",
      build_id: buildId,
      nodes_created: nodesCreated,
      edges_created: edgesCreated,
      communities_found: communitiesFound,
      doctrines_processed: totalFetched,
      domains_connected: domainsConnected,
      duration_ms: durationMs
    };
    if (hasMore) {
      response.next_offset = nextOffset;
      response.has_more = true;
      response.total_doctrines = totalDoctrines;
    }
    return c.json(response);
  } catch (err) {
    const durationMs = Date.now() - startTime;
    try {
      await db.prepare(
        `INSERT INTO build_log (action, status, error, duration_ms) VALUES ('build', 'failed', ?, ?)`
      ).bind(String(err), durationMs).run();
    } catch (e) {
      log3("warn", "Failed to log build failure to D1", { error: e?.message || String(e) });
    }
    return c.json({ error: "Build failed", details: String(err), duration_ms: durationMs }, 500);
  }
});
app.post("/graph/query", async (c) => {
  const db = c.env.DB;
  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    log3("warn", "Invalid JSON in graph query request", { error: e?.message || String(e) });
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  if (!body.query || body.query.trim().length === 0) {
    return c.json({ error: "Query is required" }, 400);
  }
  const maxHops = Math.min(body.max_hops || 2, MAX_HOPS);
  const maxResults = Math.min(body.max_results || 20, MAX_RESULTS);
  const filterDomains = body.domains || null;
  const includeDoctrines = body.include_doctrines ?? true;
  try {
    const queryKeywords = extractKeywords(body.query);
    if (queryKeywords.length === 0) {
      return c.json({ error: "Could not extract meaningful keywords from query" }, 400);
    }
    const matchedNodes = [];
    const matchedNodeIds = /* @__PURE__ */ new Set();
    for (const term of queryKeywords.slice(0, 5)) {
      try {
        const safeTerm = term.replace(/'/g, "''").substring(0, 40);
        if (safeTerm.length < 3)
          continue;
        let sql;
        const binds = [safeTerm];
        if (filterDomains && filterDomains.length > 0) {
          const domainPlaceholders = filterDomains.map(() => "?").join(",");
          sql = `SELECT * FROM nodes WHERE INSTR(LOWER(label), LOWER(?)) > 0 AND (domain IN (${domainPlaceholders}) OR domain IS NULL) ORDER BY weight DESC LIMIT 10`;
          binds.push(...filterDomains);
        } else {
          sql = `SELECT * FROM nodes WHERE INSTR(LOWER(label), LOWER(?)) > 0 ORDER BY weight DESC LIMIT 10`;
        }
        const result = await db.prepare(sql).bind(...binds).all();
        for (const row of result.results || []) {
          const node = dbNodeToGraphNode(row);
          if (!matchedNodeIds.has(node.id)) {
            matchedNodeIds.add(node.id);
            matchedNodes.push(node);
          }
        }
      } catch (e) {
        log3("error", "node_search_failed", { term, error: String(e) });
      }
    }
    const traversedEdges = [];
    const visitedNodeIds = new Set(matchedNodeIds);
    let currentFrontier = new Set(matchedNodeIds);
    let nodesSearched = matchedNodes.length;
    let edgesTraversed = 0;
    let hopsUsed = 0;
    let timedOut = false;
    const queryStartTime = Date.now();
    const hubNodeThreshold = 500;
    const hubNodeIds = /* @__PURE__ */ new Set();
    for (const nodeId of currentFrontier) {
      const degreeCheck = await db.prepare(
        "SELECT COUNT(*) as cnt FROM edges WHERE source_id = ? OR target_id = ?"
      ).bind(nodeId, nodeId).first();
      if (degreeCheck && degreeCheck.cnt > hubNodeThreshold) {
        hubNodeIds.add(nodeId);
      }
    }
    for (let hop = 0; hop < maxHops; hop++) {
      if (currentFrontier.size === 0)
        break;
      if (Date.now() - queryStartTime > QUERY_TIME_BUDGET_MS) {
        timedOut = true;
        break;
      }
      const nextFrontier = /* @__PURE__ */ new Set();
      const frontierArray = Array.from(currentFrontier).filter((id) => !hubNodeIds.has(id)).slice(0, 10);
      for (const nodeId of frontierArray) {
        if (Date.now() - queryStartTime > QUERY_TIME_BUDGET_MS) {
          timedOut = true;
          break;
        }
        const edgeResult = await db.prepare(`
          SELECT * FROM edges WHERE source_id = ? OR target_id = ?
          ORDER BY weight DESC LIMIT 8
        `).bind(nodeId, nodeId).all();
        for (const row of edgeResult.results || []) {
          const edge = dbEdgeToGraphEdge(row);
          traversedEdges.push(edge);
          edgesTraversed++;
          const neighborId = edge.source_id === nodeId ? edge.target_id : edge.source_id;
          if (!visitedNodeIds.has(neighborId)) {
            visitedNodeIds.add(neighborId);
            nextFrontier.add(neighborId);
          }
        }
      }
      if (timedOut)
        break;
      if (nextFrontier.size > 0) {
        const newIds = Array.from(nextFrontier).slice(0, 30);
        const placeholders = newIds.map(() => "?").join(",");
        const nodeResult = await db.prepare(
          `SELECT * FROM nodes WHERE id IN (${placeholders})`
        ).bind(...newIds).all();
        for (const row of nodeResult.results || []) {
          const node = dbNodeToGraphNode(row);
          matchedNodes.push(node);
          nodesSearched++;
        }
      }
      currentFrontier = nextFrontier;
      hopsUsed = hop + 1;
    }
    const doctrineIdSet = /* @__PURE__ */ new Set();
    for (const node of matchedNodes) {
      for (const dId of node.doctrine_ids) {
        doctrineIdSet.add(dId);
      }
    }
    const connectedDoctrines = [];
    if (includeDoctrines && doctrineIdSet.size > 0) {
      const doctrineScores = /* @__PURE__ */ new Map();
      for (const node of matchedNodes) {
        const nodeRelevance = cosineSimilarity(
          extractKeywords(node.label),
          queryKeywords
        );
        for (const dId of node.doctrine_ids) {
          doctrineScores.set(dId, (doctrineScores.get(dId) || 0) + nodeRelevance + node.weight * 0.1);
        }
      }
      const doctrineLimit = Math.min(maxResults, 10);
      const sortedDoctrines = Array.from(doctrineScores.entries()).sort((a, b) => b[1] - a[1]).slice(0, doctrineLimit);
      for (const [docId, score] of sortedDoctrines) {
        if (Date.now() - queryStartTime > QUERY_TIME_BUDGET_MS)
          break;
        const referencingNodes = matchedNodes.filter((n) => n.doctrine_ids.includes(docId));
        const connectionPath = referencingNodes.map((n) => n.label).slice(0, 5);
        const domain2 = referencingNodes[0]?.domain || "unknown";
        const fullDoctrine = await fetchDoctrineById(c.env, docId);
        connectedDoctrines.push({
          doctrine_id: docId,
          engine_id: fullDoctrine?.engine_id || docId.split(":")[0] || "unknown",
          domain: domain2,
          topic: fullDoctrine?.topic || referencingNodes[0]?.label || docId,
          content: fullDoctrine?.conclusion_template || fullDoctrine?.reasoning_framework || "",
          relevance_score: Math.round(score * 100) / 100,
          connection_path: connectionPath
        });
      }
    }
    const crossDomainInsights = [];
    const domainPairs = /* @__PURE__ */ new Map();
    for (const edge of traversedEdges) {
      const sourceNode = matchedNodes.find((n) => n.id === edge.source_id);
      const targetNode = matchedNodes.find((n) => n.id === edge.target_id);
      if (sourceNode && targetNode && sourceNode.domain && targetNode.domain && sourceNode.domain !== targetNode.domain) {
        const pairKey = [sourceNode.domain, targetNode.domain].sort().join("|");
        if (!domainPairs.has(pairKey)) {
          domainPairs.set(pairKey, { concepts: /* @__PURE__ */ new Set(), doctrines: /* @__PURE__ */ new Set(), edges: 0 });
        }
        const pair = domainPairs.get(pairKey);
        pair.concepts.add(sourceNode.label);
        pair.concepts.add(targetNode.label);
        for (const d of sourceNode.doctrine_ids)
          pair.doctrines.add(d);
        for (const d of targetNode.doctrine_ids)
          pair.doctrines.add(d);
        pair.edges++;
      }
    }
    for (const [pairKey, data] of domainPairs) {
      const [fromDomain, toDomain] = pairKey.split("|");
      crossDomainInsights.push({
        from_domain: fromDomain,
        to_domain: toDomain,
        bridging_concepts: Array.from(data.concepts).slice(0, 10),
        bridging_doctrines: Array.from(data.doctrines).slice(0, 10),
        relationship_type: "cross_domain",
        strength: Math.min(data.edges * 0.2, 1)
      });
    }
    const involvedCommunities = [];
    const nodeIdList = Array.from(matchedNodeIds).slice(0, 20);
    if (nodeIdList.length > 0) {
      for (const nodeId of nodeIdList.slice(0, 5)) {
        const commResult = await db.prepare(`
          SELECT * FROM communities WHERE INSTR(node_ids, ?) > 0 LIMIT 3
        `).bind(nodeId).all();
        for (const row of commResult.results || []) {
          const comm = {
            id: row.id,
            name: row.name,
            node_ids: jsonParse(row.node_ids, []),
            summary: row.summary,
            domains: jsonParse(row.domains, []),
            size: row.size || 0,
            density: row.density || 0,
            created_at: row.created_at
          };
          if (!involvedCommunities.find((c2) => c2.id === comm.id)) {
            involvedCommunities.push(comm);
          }
        }
      }
    }
    const domainsCrossed = /* @__PURE__ */ new Set();
    for (const node of matchedNodes) {
      if (node.domain)
        domainsCrossed.add(node.domain);
    }
    const response = {
      query: body.query,
      matched_nodes: matchedNodes.slice(0, maxResults),
      traversed_edges: traversedEdges.slice(0, 100),
      connected_doctrines: connectedDoctrines,
      cross_domain_insights: crossDomainInsights,
      communities_involved: involvedCommunities.slice(0, 5),
      stats: {
        nodes_searched: nodesSearched,
        edges_traversed: edgesTraversed,
        domains_crossed: domainsCrossed.size,
        hops_used: hopsUsed
      }
    };
    if (timedOut) {
      response.partial = true;
    }
    response.time_ms = Date.now() - queryStartTime;
    return c.json(response);
  } catch (err) {
    return c.json({ error: "Query failed", details: String(err) }, 500);
  }
});
app.post("/graph/traverse", async (c) => {
  const db = c.env.DB;
  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    log3("warn", "Invalid JSON in traverse request", { error: e?.message || String(e) });
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  if (!body.start_node) {
    return c.json({ error: "start_node is required" }, 400);
  }
  const maxDepth = Math.min(body.max_depth || 2, MAX_HOPS);
  const direction = body.direction || "both";
  const filterDomain = body.filter_domain || null;
  const filterRelationship = body.filter_relationship || null;
  try {
    const startRow = await db.prepare("SELECT * FROM nodes WHERE id = ?").bind(body.start_node).first();
    if (!startRow) {
      const searchResult = await db.prepare(
        "SELECT * FROM nodes WHERE INSTR(LOWER(label), LOWER(?)) > 0 ORDER BY weight DESC LIMIT 1"
      ).bind(body.start_node).first();
      if (!searchResult) {
        return c.json({ error: "Start node not found" }, 404);
      }
      body.start_node = searchResult.id;
    }
    const startNode = dbNodeToGraphNode(
      startRow || await db.prepare("SELECT * FROM nodes WHERE id = ?").bind(body.start_node).first()
    );
    const visited = [startNode];
    const visitedIds = /* @__PURE__ */ new Set([startNode.id]);
    const collectedEdges = [];
    const paths = [[startNode.id]];
    let frontier = /* @__PURE__ */ new Set([startNode.id]);
    let depthReached = 0;
    let traverseTimedOut = false;
    const traverseStart = Date.now();
    for (let depth = 0; depth < maxDepth; depth++) {
      if (frontier.size === 0)
        break;
      if (Date.now() - traverseStart > TRAVERSE_TIME_BUDGET_MS) {
        traverseTimedOut = true;
        break;
      }
      const nextFrontier = /* @__PURE__ */ new Set();
      const newPaths = [];
      const frontierSlice = Array.from(frontier).slice(0, 15);
      for (const nodeId of frontierSlice) {
        if (Date.now() - traverseStart > TRAVERSE_TIME_BUDGET_MS) {
          traverseTimedOut = true;
          break;
        }
        let edgeQuery;
        const binds = [];
        if (direction === "outbound") {
          edgeQuery = "SELECT * FROM edges WHERE source_id = ?";
          binds.push(nodeId);
        } else if (direction === "inbound") {
          edgeQuery = "SELECT * FROM edges WHERE target_id = ?";
          binds.push(nodeId);
        } else {
          edgeQuery = "SELECT * FROM edges WHERE source_id = ? OR target_id = ?";
          binds.push(nodeId, nodeId);
        }
        if (filterRelationship) {
          edgeQuery += " AND relationship = ?";
          binds.push(filterRelationship);
        }
        edgeQuery += " ORDER BY weight DESC LIMIT 12";
        const edgeResult = await db.prepare(edgeQuery).bind(...binds).all();
        for (const row of edgeResult.results || []) {
          const edge = dbEdgeToGraphEdge(row);
          collectedEdges.push(edge);
          const neighborId = edge.source_id === nodeId ? edge.target_id : edge.source_id;
          if (!visitedIds.has(neighborId)) {
            visitedIds.add(neighborId);
            nextFrontier.add(neighborId);
            const parentPath = paths.find((p) => p[p.length - 1] === nodeId) || [nodeId];
            newPaths.push([...parentPath, neighborId]);
          }
        }
      }
      if (traverseTimedOut)
        break;
      if (nextFrontier.size > 0) {
        const newIds = Array.from(nextFrontier).slice(0, 40);
        const placeholders = newIds.map(() => "?").join(",");
        let nodeQuery = `SELECT * FROM nodes WHERE id IN (${placeholders})`;
        const nodeBinds = [...newIds];
        if (filterDomain) {
          nodeQuery += " AND domain = ?";
          nodeBinds.push(filterDomain);
        }
        const nodeResult = await db.prepare(nodeQuery).bind(...nodeBinds).all();
        const validIds = /* @__PURE__ */ new Set();
        for (const row of nodeResult.results || []) {
          const node = dbNodeToGraphNode(row);
          visited.push(node);
          validIds.add(node.id);
        }
        if (filterDomain) {
          for (const id of nextFrontier) {
            if (!validIds.has(id))
              nextFrontier.delete(id);
          }
        }
      }
      paths.push(...newPaths);
      frontier = nextFrontier;
      depthReached = depth + 1;
    }
    const response = {
      start_node: startNode,
      visited: visited.slice(0, 200),
      edges: collectedEdges.slice(0, 500),
      depth_reached: depthReached,
      paths: paths.slice(0, 100)
    };
    if (traverseTimedOut)
      response.partial = true;
    response.time_ms = Date.now() - traverseStart;
    return c.json(response);
  } catch (err) {
    return c.json({ error: "Traversal failed", details: String(err) }, 500);
  }
});
app.post("/graph/community", async (c) => {
  const db = c.env.DB;
  let body = {};
  try {
    body = await c.req.json();
  } catch (e) {
    log3("warn", "Failed to parse communities request body, using defaults", { error: e?.message || String(e) });
  }
  try {
    if (body.refresh) {
      const communitiesFound = await detectCommunities(db);
      return c.json({
        status: "complete",
        communities_found: communitiesFound,
        message: `Detected ${communitiesFound} communities via label propagation`
      });
    }
    const minSize = body.min_size || 3;
    const result = await db.prepare(`
      SELECT * FROM communities WHERE size >= ? ORDER BY size DESC LIMIT 100
    `).bind(minSize).all();
    const communities = (result.results || []).map((row) => ({
      id: row.id,
      name: row.name,
      node_ids: jsonParse(row.node_ids, []),
      summary: row.summary,
      domains: jsonParse(row.domains, []),
      size: row.size || 0,
      density: row.density || 0,
      created_at: row.created_at
    }));
    return c.json({
      communities,
      total: communities.length,
      min_size_filter: minSize
    });
  } catch (err) {
    return c.json({ error: "Community detection failed", details: String(err) }, 500);
  }
});
app.get("/graph/search", async (c) => {
  const db = c.env.DB;
  const q = c.req.query("q") || "";
  const type = c.req.query("type") || null;
  const domain2 = c.req.query("domain") || null;
  const limit = Math.min(parseInt(c.req.query("limit") || "20"), 100);
  if (!q)
    return c.json({ error: "Query parameter q is required" }, 400);
  try {
    let query = "SELECT * FROM nodes WHERE INSTR(LOWER(label), LOWER(?)) > 0";
    const binds = [q];
    if (type) {
      query += " AND type = ?";
      binds.push(type);
    }
    if (domain2) {
      query += " AND domain = ?";
      binds.push(domain2);
    }
    query += " ORDER BY weight DESC LIMIT ?";
    binds.push(limit);
    const result = await db.prepare(query).bind(...binds).all();
    const nodes = (result.results || []).map((r) => dbNodeToGraphNode(r));
    return c.json({ nodes, total: nodes.length, query: q });
  } catch (err) {
    return c.json({ error: "Search failed", details: String(err) }, 500);
  }
});
app.get("/graph/build-history", async (c) => {
  const db = c.env.DB;
  const limit = Math.min(parseInt(c.req.query("limit") || "20"), 100);
  try {
    const result = await db.prepare(
      "SELECT * FROM build_log ORDER BY id DESC LIMIT ?"
    ).bind(limit).all();
    return c.json({ builds: result.results || [], total: (result.results || []).length });
  } catch (err) {
    return c.json({ error: "Failed to fetch build history", details: String(err) }, 500);
  }
});
app.post("/graph/explain", async (c) => {
  const db = c.env.DB;
  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    log3("warn", "Invalid JSON in explain request", { error: e?.message || String(e) });
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  if (!body.concept_a || !body.concept_b) {
    return c.json({ error: "concept_a and concept_b are required" }, 400);
  }
  const maxHops = Math.min(body.max_hops || 3, MAX_HOPS);
  try {
    const nodeA = await db.prepare(
      "SELECT * FROM nodes WHERE INSTR(LOWER(label), LOWER(?)) > 0 ORDER BY weight DESC LIMIT 1"
    ).bind(body.concept_a).first();
    const nodeB = await db.prepare(
      "SELECT * FROM nodes WHERE INSTR(LOWER(label), LOWER(?)) > 0 ORDER BY weight DESC LIMIT 1"
    ).bind(body.concept_b).first();
    if (!nodeA || !nodeB) {
      return c.json({
        error: "One or both concepts not found in the graph",
        found_a: !!nodeA,
        found_b: !!nodeB
      }, 404);
    }
    const startId = nodeA.id;
    const targetId = nodeB.id;
    const queue = [
      { nodeId: startId, path: [startId], edges: [] }
    ];
    const visited = /* @__PURE__ */ new Set([startId]);
    let foundPath = null;
    const explainStart = Date.now();
    const MAX_QUEUE_SIZE = 200;
    while (queue.length > 0 && !foundPath) {
      if (Date.now() - explainStart > EXPLAIN_TIME_BUDGET_MS)
        break;
      if (queue.length > MAX_QUEUE_SIZE) {
        queue.splice(MAX_QUEUE_SIZE);
      }
      const current = queue.shift();
      if (current.path.length > maxHops + 1)
        break;
      const edgeResult = await db.prepare(`
        SELECT * FROM edges WHERE source_id = ? OR target_id = ?
        ORDER BY weight DESC LIMIT 15
      `).bind(current.nodeId, current.nodeId).all();
      for (const row of edgeResult.results || []) {
        const edge = dbEdgeToGraphEdge(row);
        const neighborId = edge.source_id === current.nodeId ? edge.target_id : edge.source_id;
        if (neighborId === targetId) {
          foundPath = {
            path: [...current.path, neighborId],
            edges: [...current.edges, edge]
          };
          break;
        }
        if (!visited.has(neighborId) && current.path.length < maxHops + 1) {
          visited.add(neighborId);
          queue.push({
            nodeId: neighborId,
            path: [...current.path, neighborId],
            edges: [...current.edges, edge]
          });
        }
      }
    }
    if (!foundPath) {
      return c.json({
        connected: false,
        concept_a: { id: nodeA.id, label: nodeA.label, domain: nodeA.domain },
        concept_b: { id: nodeB.id, label: nodeB.label, domain: nodeB.domain },
        message: `No path found within ${maxHops} hops`
      });
    }
    const pathNodes = [];
    for (const nodeId of foundPath.path) {
      const row = await db.prepare("SELECT * FROM nodes WHERE id = ?").bind(nodeId).first();
      if (row)
        pathNodes.push(dbNodeToGraphNode(row));
    }
    const pathDoctrineIds = /* @__PURE__ */ new Set();
    for (const node of pathNodes) {
      for (const dId of node.doctrine_ids)
        pathDoctrineIds.add(dId);
    }
    return c.json({
      connected: true,
      concept_a: { id: nodeA.id, label: nodeA.label, domain: nodeA.domain },
      concept_b: { id: nodeB.id, label: nodeB.label, domain: nodeB.domain },
      path_length: foundPath.path.length - 1,
      path_nodes: pathNodes,
      path_edges: foundPath.edges,
      doctrines_along_path: Array.from(pathDoctrineIds).slice(0, 20),
      explanation: pathNodes.map((n) => `[${n.domain}] ${n.label}`).join(" -> ")
    });
  } catch (err) {
    return c.json({ error: "Explanation failed", details: String(err) }, 500);
  }
});
app.post("/graph/subgraph", async (c) => {
  const db = c.env.DB;
  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    log3("warn", "Invalid JSON in knowledge map request", { error: e?.message || String(e) });
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  if (!body.topic)
    return c.json({ error: "topic is required" }, 400);
  const radius = Math.min(body.radius || 2, 4);
  const maxNodes = Math.min(body.max_nodes || 100, 500);
  try {
    const seedResult = await db.prepare(
      "SELECT * FROM nodes WHERE INSTR(LOWER(label), LOWER(?)) > 0 ORDER BY weight DESC LIMIT 5"
    ).bind(body.topic).all();
    if (!seedResult.results || seedResult.results.length === 0) {
      return c.json({ error: "No matching nodes found for topic", topic: body.topic }, 404);
    }
    const subgraphNodes = /* @__PURE__ */ new Map();
    const subgraphEdges = [];
    let frontier = /* @__PURE__ */ new Set();
    for (const row of seedResult.results) {
      const node = dbNodeToGraphNode(row);
      subgraphNodes.set(node.id, node);
      frontier.add(node.id);
    }
    const subgraphStart = Date.now();
    let subgraphTimedOut = false;
    for (let r = 0; r < radius; r++) {
      if (frontier.size === 0 || subgraphNodes.size >= maxNodes)
        break;
      if (Date.now() - subgraphStart > QUERY_TIME_BUDGET_MS) {
        subgraphTimedOut = true;
        break;
      }
      const nextFrontier = /* @__PURE__ */ new Set();
      const frontierSlice = Array.from(frontier).slice(0, 20);
      for (const nodeId of frontierSlice) {
        if (subgraphNodes.size >= maxNodes)
          break;
        if (Date.now() - subgraphStart > QUERY_TIME_BUDGET_MS) {
          subgraphTimedOut = true;
          break;
        }
        const edgeResult = await db.prepare(`
          SELECT * FROM edges WHERE source_id = ? OR target_id = ?
          ORDER BY weight DESC LIMIT 10
        `).bind(nodeId, nodeId).all();
        for (const row of edgeResult.results || []) {
          const edge = dbEdgeToGraphEdge(row);
          subgraphEdges.push(edge);
          const neighborId = edge.source_id === nodeId ? edge.target_id : edge.source_id;
          if (!subgraphNodes.has(neighborId) && subgraphNodes.size < maxNodes) {
            nextFrontier.add(neighborId);
          }
        }
      }
      if (subgraphTimedOut)
        break;
      if (nextFrontier.size > 0) {
        const newIds = Array.from(nextFrontier).slice(0, maxNodes - subgraphNodes.size);
        if (newIds.length > 0) {
          const placeholders = newIds.map(() => "?").join(",");
          const nodeResult = await db.prepare(
            `SELECT * FROM nodes WHERE id IN (${placeholders})`
          ).bind(...newIds).all();
          for (const row of nodeResult.results || []) {
            const node = dbNodeToGraphNode(row);
            subgraphNodes.set(node.id, node);
          }
        }
      }
      frontier = nextFrontier;
    }
    const domains = /* @__PURE__ */ new Set();
    for (const node of subgraphNodes.values()) {
      if (node.domain)
        domains.add(node.domain);
    }
    const edgeSet = /* @__PURE__ */ new Set();
    const uniqueEdges = [];
    for (const edge of subgraphEdges) {
      const key = `${edge.source_id}|${edge.target_id}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        if (subgraphNodes.has(edge.source_id) && subgraphNodes.has(edge.target_id)) {
          uniqueEdges.push(edge);
        }
      }
    }
    return c.json({
      topic: body.topic,
      nodes: Array.from(subgraphNodes.values()),
      edges: uniqueEdges,
      domains: Array.from(domains),
      partial: subgraphTimedOut,
      time_ms: Date.now() - subgraphStart,
      stats: {
        node_count: subgraphNodes.size,
        edge_count: uniqueEdges.length,
        domain_count: domains.size,
        radius_used: radius
      }
    });
  } catch (err) {
    return c.json({ error: "Subgraph extraction failed", details: String(err) }, 500);
  }
});
app.get("/", (c) => {
  return c.json({
    service: "echo-graph-rag",
    version: "1.0.0",
    description: "GraphRAG Knowledge Graph + RAG across 674 ECHO engines and 30,626 doctrines",
    endpoints: {
      "GET /health": "Health check",
      "GET /graph/stats": "Graph statistics",
      "GET /graph/domains": "List all domains with node/edge counts",
      "GET /graph/node/:id": "Get a specific node and its edges",
      "GET /graph/connections/:domain1/:domain2": "Find connections between two domains",
      "GET /graph/search?q=&type=&domain=&limit=": "Search nodes by label",
      "GET /graph/build-history": "Build log history",
      "POST /graph/build": "Build/rebuild the knowledge graph from engine doctrines",
      "POST /graph/query": "GraphRAG query with cross-domain traversal",
      "POST /graph/traverse": "Manual graph traversal from a start node",
      "POST /graph/community": "Community detection (label propagation)",
      "POST /graph/explain": "Explain connection between two concepts",
      "POST /graph/subgraph": "Extract a subgraph around a topic"
    }
  });
});
app.notFound((c) => {
  return c.json({ error: "Not found", path: c.req.path }, 404);
});
app.onError((err, c) => {
  log3("error", "unhandled_error", {
    error: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method
  });
  return c.json({ error: "Internal server error", message: err.message }, 500);
});
var src_default = app;
export {
  src_default as default
};
//# sourceMappingURL=index.js.map

--88e6989bdf480e66c6eeaa63a4703e5166ed977e0d69a0cb75c5b39d35ba--
