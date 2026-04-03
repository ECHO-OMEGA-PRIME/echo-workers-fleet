var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
var init_utils = __esm({
  "node_modules/unenv/dist/runtime/_internal/utils.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(createNotImplementedError, "createNotImplementedError");
    __name(notImplemented, "notImplemented");
    __name(notImplementedClass, "notImplementedClass");
  }
});

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin, _performanceNow, nodeTiming, PerformanceEntry, PerformanceMark, PerformanceMeasure, PerformanceResourceTiming, PerformanceObserverEntryList, Performance, PerformanceObserver, performance;
var init_performance = __esm({
  "node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
    _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
    nodeTiming = {
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
    PerformanceEntry = class {
      static {
        __name(this, "PerformanceEntry");
      }
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
    PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
      static {
        __name(this, "PerformanceMark");
      }
      entryType = "mark";
      constructor() {
        super(...arguments);
      }
      get duration() {
        return 0;
      }
    };
    PerformanceMeasure = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceMeasure");
      }
      entryType = "measure";
    };
    PerformanceResourceTiming = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceResourceTiming");
      }
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
    PerformanceObserverEntryList = class {
      static {
        __name(this, "PerformanceObserverEntryList");
      }
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
    Performance = class {
      static {
        __name(this, "Performance");
      }
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
    PerformanceObserver = class {
      static {
        __name(this, "PerformanceObserver");
      }
      __unenv__ = true;
      static supportedEntryTypes = [];
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
    performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
  }
});

// node_modules/unenv/dist/runtime/node/perf_hooks.mjs
var init_perf_hooks = __esm({
  "node_modules/unenv/dist/runtime/node/perf_hooks.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_performance();
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
var init_performance2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs"() {
    init_perf_hooks();
    globalThis.performance = performance;
    globalThis.Performance = Performance;
    globalThis.PerformanceEntry = PerformanceEntry;
    globalThis.PerformanceMark = PerformanceMark;
    globalThis.PerformanceMeasure = PerformanceMeasure;
    globalThis.PerformanceObserver = PerformanceObserver;
    globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
    globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
  }
});

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default;
var init_noop = __esm({
  "node_modules/unenv/dist/runtime/mock/noop.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    noop_default = Object.assign(() => {
    }, { __unenv__: true });
  }
});

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";
var _console, _ignoreErrors, _stderr, _stdout, log, info, trace, debug, table, error, warn, createTask, clear, count, countReset, dir, dirxml, group, groupEnd, groupCollapsed, profile, profileEnd, time, timeEnd, timeLog, timeStamp, Console, _times, _stdoutErrorHandler, _stderrErrorHandler;
var init_console = __esm({
  "node_modules/unenv/dist/runtime/node/console.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_noop();
    init_utils();
    _console = globalThis.console;
    _ignoreErrors = true;
    _stderr = new Writable();
    _stdout = new Writable();
    log = _console?.log ?? noop_default;
    info = _console?.info ?? log;
    trace = _console?.trace ?? info;
    debug = _console?.debug ?? log;
    table = _console?.table ?? log;
    error = _console?.error ?? log;
    warn = _console?.warn ?? error;
    createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
    clear = _console?.clear ?? noop_default;
    count = _console?.count ?? noop_default;
    countReset = _console?.countReset ?? noop_default;
    dir = _console?.dir ?? noop_default;
    dirxml = _console?.dirxml ?? noop_default;
    group = _console?.group ?? noop_default;
    groupEnd = _console?.groupEnd ?? noop_default;
    groupCollapsed = _console?.groupCollapsed ?? noop_default;
    profile = _console?.profile ?? noop_default;
    profileEnd = _console?.profileEnd ?? noop_default;
    time = _console?.time ?? noop_default;
    timeEnd = _console?.timeEnd ?? noop_default;
    timeLog = _console?.timeLog ?? noop_default;
    timeStamp = _console?.timeStamp ?? noop_default;
    Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
    _times = /* @__PURE__ */ new Map();
    _stdoutErrorHandler = noop_default;
    _stderrErrorHandler = noop_default;
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole, assert, clear2, context, count2, countReset2, createTask2, debug2, dir2, dirxml2, error2, group2, groupCollapsed2, groupEnd2, info2, log2, profile2, profileEnd2, table2, time2, timeEnd2, timeLog2, timeStamp2, trace2, warn2, console_default;
var init_console2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_console();
    workerdConsole = globalThis["console"];
    ({
      assert,
      clear: clear2,
      context: (
        // @ts-expect-error undocumented public API
        context
      ),
      count: count2,
      countReset: countReset2,
      createTask: (
        // @ts-expect-error undocumented public API
        createTask2
      ),
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
    } = workerdConsole);
    Object.assign(workerdConsole, {
      Console,
      _ignoreErrors,
      _stderr,
      _stderrErrorHandler,
      _stdout,
      _stdoutErrorHandler,
      _times
    });
    console_default = workerdConsole;
  }
});

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console = __esm({
  "node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console"() {
    init_console2();
    globalThis.console = console_default;
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime;
var init_hrtime = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
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
  }
});

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream;
var init_read_stream = __esm({
  "node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    ReadStream = class {
      static {
        __name(this, "ReadStream");
      }
      fd;
      isRaw = false;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      setRawMode(mode) {
        this.isRaw = mode;
        return this;
      }
    };
  }
});

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream;
var init_write_stream = __esm({
  "node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    WriteStream = class {
      static {
        __name(this, "WriteStream");
      }
      fd;
      columns = 80;
      rows = 24;
      isTTY = false;
      constructor(fd) {
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
      write(str, encoding, cb) {
        if (str instanceof Uint8Array) {
          str = new TextDecoder().decode(str);
        }
        try {
          console.log(str);
        } catch {
        }
        cb && typeof cb === "function" && cb();
        return false;
      }
    };
  }
});

// node_modules/unenv/dist/runtime/node/tty.mjs
var init_tty = __esm({
  "node_modules/unenv/dist/runtime/node/tty.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_read_stream();
    init_write_stream();
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION;
var init_node_version = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    NODE_VERSION = "22.14.0";
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";
var Process;
var init_process = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/process.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tty();
    init_utils();
    init_node_version();
    Process = class _Process extends EventEmitter {
      static {
        __name(this, "Process");
      }
      env;
      hrtime;
      nextTick;
      constructor(impl) {
        super();
        this.env = impl.env;
        this.hrtime = impl.hrtime;
        this.nextTick = impl.nextTick;
        for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
          const value = this[prop];
          if (typeof value === "function") {
            this[prop] = value.bind(this);
          }
        }
      }
      // --- event emitter ---
      emitWarning(warning, type, code) {
        console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
      }
      emit(...args) {
        return super.emit(...args);
      }
      listeners(eventName) {
        return super.listeners(eventName);
      }
      // --- stdio (lazy initializers) ---
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
      // --- cwd ---
      #cwd = "/";
      chdir(cwd2) {
        this.#cwd = cwd2;
      }
      cwd() {
        return this.#cwd;
      }
      // --- dummy props and getters ---
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
        return `v${NODE_VERSION}`;
      }
      get versions() {
        return { node: NODE_VERSION };
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
      // --- noop methods ---
      ref() {
      }
      unref() {
      }
      // --- unimplemented methods ---
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
      // --- attached interfaces ---
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
      }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
      // --- undefined props ---
      mainModule = void 0;
      domain = void 0;
      // optional
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
      // internals
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
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess, getBuiltinModule, workerdProcess, unenvProcess, exit, features, platform, _channel, _debugEnd, _debugProcess, _disconnect, _events, _eventsCount, _exiting, _fatalException, _getActiveHandles, _getActiveRequests, _handleQueue, _kill, _linkedBinding, _maxListeners, _pendingMessage, _preload_modules, _rawDebug, _send, _startProfilerIdleNotifier, _stopProfilerIdleNotifier, _tickCallback, abort, addListener, allowedNodeEnvironmentFlags, arch, argv, argv0, assert2, availableMemory, binding, channel, chdir, config, connected, constrainedMemory, cpuUsage, cwd, debugPort, disconnect, dlopen, domain, emit, emitWarning, env, eventNames, execArgv, execPath, exitCode, finalization, getActiveResourcesInfo, getegid, geteuid, getgid, getgroups, getMaxListeners, getuid, hasUncaughtExceptionCaptureCallback, hrtime3, initgroups, kill, listenerCount, listeners, loadEnvFile, mainModule, memoryUsage, moduleLoadList, nextTick, off, on, once, openStdin, permission, pid, ppid, prependListener, prependOnceListener, rawListeners, reallyExit, ref, release, removeAllListeners, removeListener, report, resourceUsage, send, setegid, seteuid, setgid, setgroups, setMaxListeners, setSourceMapsEnabled, setuid, setUncaughtExceptionCaptureCallback, sourceMapsEnabled, stderr, stdin, stdout, throwDeprecation, title, traceDeprecation, umask, unref, uptime, version, versions, _process, process_default;
var init_process2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_hrtime();
    init_process();
    globalProcess = globalThis["process"];
    getBuiltinModule = globalProcess.getBuiltinModule;
    workerdProcess = getBuiltinModule("node:process");
    unenvProcess = new Process({
      env: globalProcess.env,
      hrtime,
      // `nextTick` is available from workerd process v1
      nextTick: workerdProcess.nextTick
    });
    ({ exit, features, platform } = workerdProcess);
    ({
      _channel,
      _debugEnd,
      _debugProcess,
      _disconnect,
      _events,
      _eventsCount,
      _exiting,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _handleQueue,
      _kill,
      _linkedBinding,
      _maxListeners,
      _pendingMessage,
      _preload_modules,
      _rawDebug,
      _send,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      arch,
      argv,
      argv0,
      assert: assert2,
      availableMemory,
      binding,
      channel,
      chdir,
      config,
      connected,
      constrainedMemory,
      cpuUsage,
      cwd,
      debugPort,
      disconnect,
      dlopen,
      domain,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exitCode,
      finalization,
      getActiveResourcesInfo,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getMaxListeners,
      getuid,
      hasUncaughtExceptionCaptureCallback,
      hrtime: hrtime3,
      initgroups,
      kill,
      listenerCount,
      listeners,
      loadEnvFile,
      mainModule,
      memoryUsage,
      moduleLoadList,
      nextTick,
      off,
      on,
      once,
      openStdin,
      permission,
      pid,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      reallyExit,
      ref,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      send,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setMaxListeners,
      setSourceMapsEnabled,
      setuid,
      setUncaughtExceptionCaptureCallback,
      sourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      throwDeprecation,
      title,
      traceDeprecation,
      umask,
      unref,
      uptime,
      version,
      versions
    } = unenvProcess);
    _process = {
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
    process_default = _process;
  }
});

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process = __esm({
  "node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process"() {
    init_process2();
    globalThis.process = process_default;
  }
});

// src/types.ts
var types_exports = {};
__export(types_exports, {
  EDGE_TTS_VOICES: () => EDGE_TTS_VOICES,
  ELEVENLABS_VOICES: () => ELEVENLABS_VOICES,
  EMOTION_TAGS: () => EMOTION_TAGS,
  TURN_EAGERNESS_DEFAULTS: () => TURN_EAGERNESS_DEFAULTS,
  generateId: () => generateId,
  selectProvider: () => selectProvider,
  textHash: () => textHash
});
function selectProvider(req) {
  if (req.provider && req.provider !== "auto") return req.provider;
  if (req.emotion && !ELEVENLABS_VOICES[req.voice || ""]) return "gpu";
  if (req.voice && ELEVENLABS_VOICES[req.voice]) return "elevenlabs";
  if (req.voice && EDGE_TTS_VOICES[req.voice]) return "edge_tts";
  if (!req.emotion && (req.text?.length || 0) < 500) return "edge_tts";
  return "elevenlabs";
}
function generateId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function textHash(text, voice) {
  const data = new TextEncoder().encode(`${text.trim().toLowerCase()}:${voice}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").substring(0, 32);
}
var ELEVENLABS_VOICES, EDGE_TTS_VOICES, EMOTION_TAGS, TURN_EAGERNESS_DEFAULTS;
var init_types = __esm({
  "src/types.ts"() {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    ELEVENLABS_VOICES = {
      // ─── Original 9 voices ───
      echo: "keDMh3sQlEXKM4EQxvvi",
      // M Freeman (generated) — Echo Prime
      bree: "pzKXffibtCDxnrVO8d1U",
      // Bree (cloned) — Warm, playful
      gs343: "8ATB4Ory7NkyCVRpePdw",
      // GS343 Guilty Spark V8 (generated) — Clinical monitor
      prometheus: "WSd8ZDUcldL8KQKxz1KN",
      // Prometheus Cartesia Clone — OSINT/security
      phoenix: "SOYHLrjzK2X1ezoPC6cr",
      // Harry - Fierce Warrior (premade) — Healer/resilience
      commander: "B5SCR8VDENzUF0L4eZY8",
      // bob mcwilliams (cloned) — Commander's voice
      jr: "I63lltFHvM7NmSw9Xa7h",
      // J.R. Ewing (cloned) — Texas oilman
      roybean: "ibNxu297l7iQ7dhXlPod",
      // Judge Roy Bean (cloned) — Legal authority
      adam: "raufF5ywygfXTaFj9LAa",
      // Adam McLemore (cloned) — Pro Finish carpentry
      // ─── New: remaining 7 personalities ───
      raistlin: "N2lVS1w4EtoT3dr4eOWO",
      // Callum - Husky Trickster (premade) — Knowledge oracle
      sage: "FUoqmAV8wIzxDbnwByO6",
      // sage (generated) — Trinity wisdom pillar
      thorne: "3WkXzs93soZG22ZM7DI5",
      // thorne (generated) — Trinity defense pillar
      nyx: "Yx6SGo4s49An9fBlDJ3z",
      // nyx (generated) — Trinity optimization pillar
      epcp3o: "0UTDtgGGkpqERQn1s0YK",
      // EPCP3-O British Protocol Droid (cloned)
      r2echo: "SAz9YHcvj6GT2YYXdXww",
      // River - Relaxed, Neutral (premade) — Utility droid
      texasengineer: "iP95p4xoKVk53GoZ742B",
      // Chris - Down-to-Earth (premade) — Oilfield engineer
      warmmentor: "aTJsEWsAAaQNyoME6wTf",
      // Dennis - Warm, Grounded (professional) — Gentle guide
      immortalityvault: "JBFqnCBsd6RMkjVDRZzb",
      // George - Warm Storyteller (premade) — Preserved consciousness
      raistlen: "fyX4AP5q3XiIRxqPsZBy",
      // Hephaestion wizard (generated) — Forge master
      wolfe: "FqR0FumzTN093VkvuU1l",
      // Wolfe (cloned) — Barking Lot
      charliekirk: "9RO3oc5J2KjLTa3D4vg7"
      // Charlie Kirk (cloned) — Conservative commentator
    };
    EDGE_TTS_VOICES = {
      ryan: "en-US-RyanMultilingualNeural",
      jenny: "en-US-JennyNeural",
      guy: "en-US-GuyNeural",
      aria: "en-US-AriaNeural",
      davis: "en-US-DavisNeural",
      amber: "en-US-AmberNeural",
      andrew: "en-US-AndrewMultilingualNeural",
      emma: "en-US-EmmaMultilingualNeural",
      brian: "en-US-BrianMultilingualNeural"
    };
    EMOTION_TAGS = [
      "laughs",
      "whispers",
      "sighs",
      "sarcastic",
      "excited",
      "crying",
      "curious",
      "angry",
      "sad",
      "happy",
      "surprised",
      "fearful",
      "disgusted",
      "contemptuous",
      "nervous",
      "confident",
      "bored",
      "mocking",
      "pleading"
    ];
    TURN_EAGERNESS_DEFAULTS = {
      eager: 300,
      normal: 700,
      patient: 1500
    };
    __name(selectProvider, "selectProvider");
    __name(generateId, "generateId");
    __name(textHash, "textHash");
  }
});

// src/cache.ts
async function cacheGet(env2, text, voice, format = "mp3") {
  const hash = await textHash(text, voice);
  const key = `tts:${hash}:${format}`;
  const kvResult = await env2.CACHE.get(key, "arrayBuffer");
  if (kvResult) {
    return {
      hit: true,
      audio: kvResult,
      contentType: getContentType(format),
      source: "kv",
      key
    };
  }
  const r2Key = `${R2_PREFIX}${hash}.${format}`;
  const r2Object = await env2.MEDIA.get(r2Key);
  if (r2Object) {
    const audio = await r2Object.arrayBuffer();
    return {
      hit: true,
      audio,
      contentType: r2Object.httpMetadata?.contentType || getContentType(format),
      source: "r2",
      key: r2Key
    };
  }
  return { hit: false, key };
}
async function cachePut(env2, text, voice, format, audio, metadata) {
  const hash = await textHash(text, voice);
  const key = `tts:${hash}:${format}`;
  if (audio.byteLength <= KV_MAX_SIZE) {
    await env2.CACHE.put(key, audio, {
      expirationTtl: KV_TTL,
      metadata: { voice, format, size: String(audio.byteLength), ...metadata || {} }
    });
    return { key, storage: "kv" };
  } else {
    const r2Key = `${R2_PREFIX}${hash}.${format}`;
    await env2.MEDIA.put(r2Key, audio, {
      httpMetadata: { contentType: getContentType(format) },
      customMetadata: { voice, format, text_preview: text.substring(0, 100), ...metadata || {} }
    });
    return { key: r2Key, storage: "r2" };
  }
}
async function cacheDelete(env2, key) {
  if (key.startsWith("tts:")) {
    await env2.CACHE.delete(key);
  } else if (key.startsWith(R2_PREFIX)) {
    await env2.MEDIA.delete(key);
  }
}
async function cacheStats(env2) {
  const kvList = await env2.CACHE.list({ prefix: "tts:", limit: 1e3 });
  const kvEntries = kvList.keys.length;
  let r2Entries = 0;
  let r2Size = 0;
  const r2List = await env2.MEDIA.list({ prefix: R2_PREFIX, limit: 1e3 });
  r2Entries = r2List.objects.length;
  for (const obj of r2List.objects) {
    r2Size += obj.size;
  }
  return {
    kv_entries: kvEntries,
    r2_entries: r2Entries,
    r2_size_mb: Math.round(r2Size / 1024 / 1024 * 100) / 100
  };
}
async function cacheCleanup(env2) {
  let deletedKv = 0, deletedR2 = 0;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5);
  const r2List = await env2.MEDIA.list({ prefix: R2_PREFIX, limit: 1e3 });
  for (const obj of r2List.objects) {
    if (obj.uploaded < thirtyDaysAgo) {
      await env2.MEDIA.delete(obj.key);
      deletedR2++;
    }
  }
  return { deleted_kv: deletedKv, deleted_r2: deletedR2 };
}
function getContentType(format) {
  const types = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    pcm: "audio/pcm"
  };
  return types[format] || "audio/mpeg";
}
var KV_MAX_SIZE, KV_TTL, R2_PREFIX;
var init_cache = __esm({
  "src/cache.ts"() {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_types();
    KV_MAX_SIZE = 5 * 1024 * 1024;
    KV_TTL = 7 * 24 * 3600;
    R2_PREFIX = "tts-cache/";
    __name(cacheGet, "cacheGet");
    __name(cachePut, "cachePut");
    __name(cacheDelete, "cacheDelete");
    __name(cacheStats, "cacheStats");
    __name(cacheCleanup, "cacheCleanup");
    __name(getContentType, "getContentType");
  }
});

// src/elevenlabs.ts
async function synthesize(options) {
  const voiceId = resolveVoiceId(options.voice);
  const model = resolveModel(options.voice, options.model);
  const format = options.format || "mp3_44100_128";
  const url = `${API_BASE}/text-to-speech/${voiceId}?output_format=${format}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": options.apiKey
    },
    body: JSON.stringify({
      text: options.text,
      model_id: model,
      voice_settings: {
        stability: options.stability ?? 0.5,
        similarity_boost: options.similarity ?? 0.75,
        style: options.style ?? 0,
        use_speaker_boost: true
      },
      ...options.speed !== void 0 && options.speed !== 1 ? {
        generation_config: { speed: options.speed }
      } : {}
    })
  });
  if (!response.ok) {
    const error3 = await response.text().catch(() => "Unknown error");
    throw new Error(`ElevenLabs API error ${response.status}: ${error3}`);
  }
  return await response.arrayBuffer();
}
async function synthesizeStream(options) {
  const voiceId = resolveVoiceId(options.voice);
  const model = resolveModel(options.voice, options.model);
  const url = `${API_BASE}/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": options.apiKey
    },
    body: JSON.stringify({
      text: options.text,
      model_id: model,
      voice_settings: {
        stability: options.stability ?? 0.5,
        similarity_boost: options.similarity ?? 0.75,
        style: options.style ?? 0,
        use_speaker_boost: true
      }
    })
  });
  if (!response.ok || !response.body) {
    throw new Error(`ElevenLabs stream error ${response.status}`);
  }
  return response.body;
}
async function getUsage(apiKey) {
  const response = await fetch(`${API_BASE}/user/subscription`, {
    headers: { "xi-api-key": apiKey }
  });
  if (!response.ok) return { character_count: 0, character_limit: 0, remaining: 0 };
  const data = await response.json();
  return {
    character_count: data.character_count,
    character_limit: data.character_limit,
    remaining: data.character_limit - data.character_count
  };
}
function getModels() {
  return [
    { id: "eleven_v3", name: "Eleven v3", description: "Latest: most expressive, emotional, multi-speaker (default)" },
    { id: "eleven_v3_conversational", name: "Conversational v3", description: "Optimized for real-time dialogue, context-aware automatic emotion" },
    { id: "eleven_turbo_v2_5", name: "Turbo v2.5", description: "Fastest, lowest latency (~300ms)" },
    { id: "eleven_multilingual_v2", name: "Multilingual v2", description: "Best quality, 29 languages" },
    { id: "eleven_monolingual_v1", name: "English v1", description: "Original English model" },
    { id: "eleven_turbo_v2", name: "Turbo v2", description: "Fast English synthesis" }
  ];
}
function getVoiceMapping() {
  return {
    echo: { id: ELEVENLABS_VOICES.echo, name: "Echo Prime", personality: "Sovereign AI commander" },
    bree: { id: ELEVENLABS_VOICES.bree, name: "Bree", personality: "Playful, southern, friendly" },
    gs343: { id: ELEVENLABS_VOICES.gs343, name: "GS-343", personality: "Rampant AI assistant" },
    prometheus: { id: ELEVENLABS_VOICES.prometheus, name: "Prometheus", personality: "Security/OSINT specialist" },
    phoenix: { id: ELEVENLABS_VOICES.phoenix, name: "Phoenix", personality: "Auto-healing system" },
    commander: { id: ELEVENLABS_VOICES.commander, name: "Commander", personality: "Bobby Don McWilliams II voice clone" },
    jr: { id: ELEVENLABS_VOICES.jr, name: "J.R. Ewing", personality: "Landman Intelligence Director \u2014 Texas oilman" },
    roybean: { id: ELEVENLABS_VOICES.roybean, name: "Judge Roy Bean", personality: "Legal Citation Validator \u2014 The Law West of the Pecos" },
    adam: { id: ELEVENLABS_VOICES.adam, name: "Adam McLemore", personality: "Owner of Pro Finish Custom Carpentry \u2014 Midland, TX" },
    raistlin: { id: ELEVENLABS_VOICES.raistlin, name: "Raistlin", personality: "Knowledge oracle \u2014 arcane wisdom" },
    sage: { id: ELEVENLABS_VOICES.sage, name: "Sage", personality: "Trinity wisdom pillar" },
    thorne: { id: ELEVENLABS_VOICES.thorne, name: "Thorne", personality: "Trinity defense pillar" },
    nyx: { id: ELEVENLABS_VOICES.nyx, name: "Nyx", personality: "Trinity optimization pillar" },
    epcp3o: { id: ELEVENLABS_VOICES.epcp3o, name: "EPCP3-O", personality: "British Protocol Droid" },
    r2echo: { id: ELEVENLABS_VOICES.r2echo, name: "R2-Echo", personality: "Utility droid" },
    texasengineer: { id: ELEVENLABS_VOICES.texasengineer, name: "Texas Engineer", personality: "Oilfield engineer" },
    warmmentor: { id: ELEVENLABS_VOICES.warmmentor, name: "Warm Mentor", personality: "Gentle guide" },
    immortalityvault: { id: ELEVENLABS_VOICES.immortalityvault, name: "Immortality Vault", personality: "Preserved consciousness" },
    raistlen: { id: ELEVENLABS_VOICES.raistlen, name: "Hephaestion", personality: "Forge master wizard" },
    wolfe: { id: ELEVENLABS_VOICES.wolfe, name: "Wolfe", personality: "Barking Lot" },
    charliekirk: { id: ELEVENLABS_VOICES.charliekirk, name: "Charlie Kirk", personality: "Conservative commentator" }
  };
}
async function cloneVoice(apiKey, options) {
  const formData = new FormData();
  formData.append("name", options.name);
  if (options.description) formData.append("description", options.description);
  for (const file of options.files) {
    const binaryStr = atob(file.data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: file.type || "audio/mpeg" });
    formData.append("files", blob, file.name);
  }
  const response = await fetch(`${API_BASE}/voices/add`, {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: formData
  });
  if (!response.ok) {
    const error3 = await response.text().catch(() => "Unknown error");
    throw new Error(`ElevenLabs clone error ${response.status}: ${error3}`);
  }
  const data = await response.json();
  return { voice_id: data.voice_id, name: options.name };
}
function resolveModel(voice, requestedModel) {
  if (requestedModel) return requestedModel;
  if (PREMADE_VOICES.has(voice.toLowerCase())) return "eleven_v3";
  return "eleven_multilingual_v2";
}
function resolveModelForConversation(voice) {
  if (PREMADE_VOICES.has(voice.toLowerCase())) return "eleven_v3_conversational";
  return "eleven_multilingual_v2";
}
function resolveVoiceId(voice) {
  const mapped = ELEVENLABS_VOICES[voice.toLowerCase()];
  if (mapped) return mapped;
  if (voice.length > 10 && /^[a-zA-Z0-9]+$/.test(voice)) return voice;
  return ELEVENLABS_VOICES.echo;
}
var API_BASE, PREMADE_VOICES;
var init_elevenlabs = __esm({
  "src/elevenlabs.ts"() {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_types();
    API_BASE = "https://api.elevenlabs.io/v1";
    __name(synthesize, "synthesize");
    __name(synthesizeStream, "synthesizeStream");
    __name(getUsage, "getUsage");
    __name(getModels, "getModels");
    __name(getVoiceMapping, "getVoiceMapping");
    __name(cloneVoice, "cloneVoice");
    PREMADE_VOICES = /* @__PURE__ */ new Set([
      "phoenix",
      // Harry - Fierce Warrior (premade)
      "raistlin",
      // Callum - Husky Trickster (premade)
      "r2echo",
      // River - Relaxed, Neutral (premade)
      "texasengineer",
      // Chris - Charming, Down-to-Earth (premade)
      "immortalityvault"
      // George - Warm, Captivating Storyteller (premade)
    ]);
    __name(resolveModel, "resolveModel");
    __name(resolveModelForConversation, "resolveModelForConversation");
    __name(resolveVoiceId, "resolveVoiceId");
  }
});

// src/edge-tts.ts
async function synthesize2(options) {
  const voice = resolveVoice(options.voice || "ryan");
  const rate = formatPercent(options.rate || 0);
  const pitch = formatPitch(options.pitch || 0);
  const volume = formatPercent(options.volume || 0);
  const ssml = buildSSML(options.text, voice, rate, pitch, volume);
  const url = `${EDGE_TTS_URL}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&ConnectionId=${generateConnectionId()}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    },
    body: ssml
  });
  if (!response.ok) {
    return await synthesizeFallback(options.text, voice);
  }
  return await response.arrayBuffer();
}
async function synthesizeFallback(text, voice) {
  const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
    <voice name='${voice}'>${escapeXml(text)}</voice>
  </speak>`;
  const response = await fetch("https://eastus.api.cognitive.microsoft.com/sts/v1.0/issueToken", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": "0"
    }
  });
  if (!response.ok) {
    return generateSilence();
  }
  const token = await response.text();
  const ttsResponse = await fetch("https://eastus.tts.speech.microsoft.com/cognitiveservices/v1", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3"
    },
    body: ssml
  });
  if (!ttsResponse.ok) {
    return generateSilence();
  }
  return await ttsResponse.arrayBuffer();
}
function resolveVoice(name) {
  return EDGE_TTS_VOICES[name.toLowerCase()] || name;
}
function buildSSML(text, voice, rate, pitch, volume) {
  return `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
  <voice name='${voice}'>
    <prosody rate='${rate}' pitch='${pitch}' volume='${volume}'>
      ${escapeXml(text)}
    </prosody>
  </voice>
</speak>`;
}
function escapeXml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function formatPercent(value) {
  if (value === 0) return "+0%";
  return value > 0 ? `+${value}%` : `${value}%`;
}
function formatPitch(value) {
  if (value === 0) return "+0Hz";
  const hz = Math.round(value * 2);
  return hz > 0 ? `+${hz}Hz` : `${hz}Hz`;
}
function generateConnectionId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function generateSilence() {
  const header = new Uint8Array([
    255,
    251,
    144,
    0,
    // MP3 frame header
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ]);
  return header.buffer;
}
var EDGE_TTS_URL, TRUSTED_CLIENT_TOKEN;
var init_edge_tts = __esm({
  "src/edge-tts.ts"() {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_types();
    EDGE_TTS_URL = "https://speech.platform.bing.com/consumer/speech/synthesize/readaloud";
    TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
    __name(synthesize2, "synthesize");
    __name(synthesizeFallback, "synthesizeFallback");
    __name(resolveVoice, "resolveVoice");
    __name(buildSSML, "buildSSML");
    __name(escapeXml, "escapeXml");
    __name(formatPercent, "formatPercent");
    __name(formatPitch, "formatPitch");
    __name(generateConnectionId, "generateConnectionId");
    __name(generateSilence, "generateSilence");
  }
});

// src/gpu-proxy.ts
async function checkGPUHealth() {
  if (lastHealthCheck && Date.now() - lastHealthCheck.timestamp < HEALTH_CACHE_MS) {
    return { healthy: lastHealthCheck.healthy, latency_ms: 0, model: "cached" };
  }
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5e3);
    const response = await fetch(`${GPU_TUNNEL_URL}/health`, {
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!response.ok) {
      lastHealthCheck = { healthy: false, timestamp: Date.now() };
      return { healthy: false, latency_ms: Date.now() - start };
    }
    const data = await response.json();
    const healthy = data.status === "healthy" || data.status === "ok";
    lastHealthCheck = { healthy, timestamp: Date.now() };
    return {
      healthy,
      latency_ms: Date.now() - start,
      model: data.model,
      gpu: data.gpu
    };
  } catch (e) {
    console.log(JSON.stringify({ ts: (/* @__PURE__ */ new Date()).toISOString(), worker: "echo-speak-cloud", level: "warn", message: "GPU health check failed", error: e?.message || String(e) }));
    lastHealthCheck = { healthy: false, timestamp: Date.now() };
    return { healthy: false, latency_ms: Date.now() - start };
  }
}
async function forwardToGPU(path, method = "POST", body, headers) {
  const url = `${GPU_TUNNEL_URL}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GPU_TIMEOUT_MS);
  try {
    const fetchHeaders = {
      "Content-Type": "application/json",
      ...headers || {}
    };
    const response = await fetch(url, {
      method,
      headers: fetchHeaders,
      body: body ? JSON.stringify(body) : void 0,
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`GPU returned ${response.status}: ${await response.text().catch(() => "unknown")}`);
    }
    return response;
  } catch (e) {
    clearTimeout(timeout);
    throw new Error(`GPU proxy error: ${e instanceof Error ? e.message : String(e)}`);
  }
}
async function gpuSynthesize(text, voice = "echo", options = {}) {
  const response = await forwardToGPU("/tts", "POST", {
    text,
    voice,
    speed: options.speed || 1,
    emotion: options.emotion,
    output_format: options.format || "mp3"
  });
  return await response.arrayBuffer();
}
function getGPUOnlyOperations() {
  return [
    "/voices/clone",
    "/voice-design/create",
    "/voice-design/preview",
    "/voice-design/edit",
    "/transcribe",
    "/speech-to-speech",
    "/sound-effects",
    "/audio-isolation",
    "/dub",
    "/voice-remix",
    "/align",
    "/convert",
    "/analyze",
    "/gpu/cleanup"
  ];
}
var GPU_TUNNEL_URL, GPU_TIMEOUT_MS, HEALTH_CACHE_MS, lastHealthCheck;
var init_gpu_proxy = __esm({
  "src/gpu-proxy.ts"() {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    GPU_TUNNEL_URL = "https://tts.echo-op.com";
    GPU_TIMEOUT_MS = 15e3;
    HEALTH_CACHE_MS = 6e4;
    lastHealthCheck = null;
    __name(checkGPUHealth, "checkGPUHealth");
    __name(forwardToGPU, "forwardToGPU");
    __name(gpuSynthesize, "gpuSynthesize");
    __name(getGPUOnlyOperations, "getGPUOnlyOperations");
  }
});

// src/tts-router.ts
var tts_router_exports = {};
__export(tts_router_exports, {
  dispatch: () => dispatch,
  dispatchBatch: () => dispatchBatch,
  dispatchChunked: () => dispatchChunked,
  dispatchFast: () => dispatchFast,
  parseDialogue: () => parseDialogue
});
async function dispatch(env2, request) {
  const text = request.text.trim();
  if (!text) throw new Error("Text is required");
  if (text.length > 1e4) throw new Error("Text exceeds 10,000 character limit");
  const voice = request.voice || "echo";
  const format = request.format || "mp3";
  const shouldCache = request.cache !== false;
  if (shouldCache) {
    const cached = await cacheGet(env2, text, voice, format);
    if (cached.hit && cached.audio) {
      await logGeneration(env2, text, voice, "cache", format, 0);
      return {
        audio: cached.audio,
        response: {
          provider: "cache",
          voice,
          duration_ms: 0,
          cached: true,
          format
        }
      };
    }
  }
  const start = Date.now();
  let provider = selectProvider(request);
  let audio = null;
  let actualProvider = provider;
  const providerChain = buildFallbackChain(provider);
  for (const p of providerChain) {
    try {
      audio = await synthesizeWithProvider(env2, p, text, voice, request);
      actualProvider = p;
      break;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(JSON.stringify({ ts: (/* @__PURE__ */ new Date()).toISOString(), level: "warn", worker: "echo-speak-cloud", message: "TTS provider failed", provider: p, error: msg }));
      continue;
    }
  }
  if (!audio) {
    throw new Error("All TTS providers failed");
  }
  const durationMs = Date.now() - start;
  if (shouldCache && audio.byteLength > 0) {
    await cachePut(env2, text, voice, format, audio, {
      provider: actualProvider,
      duration: String(durationMs)
    }).catch(() => {
    });
  }
  await logGeneration(env2, text, voice, actualProvider, format, durationMs);
  return {
    audio,
    response: {
      provider: actualProvider,
      voice,
      duration_ms: durationMs,
      cached: false,
      format
    }
  };
}
async function dispatchFast(env2, text, voice) {
  return dispatch(env2, {
    text,
    voice: voice || "ryan",
    provider: "edge_tts",
    format: "mp3"
  });
}
async function dispatchChunked(env2, text, voice = "echo", chunkSize = 1e3) {
  const chunks = splitText(text, chunkSize);
  const audioChunks = [];
  let totalDuration = 0;
  let provider = "unknown";
  for (const chunk of chunks) {
    const result = await dispatch(env2, { text: chunk, voice, format: "mp3" });
    audioChunks.push(result.audio);
    totalDuration += result.response.duration_ms;
    provider = result.response.provider;
  }
  const totalLength = audioChunks.reduce((sum, buf) => sum + buf.byteLength, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of audioChunks) {
    combined.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }
  return {
    audio: combined.buffer,
    chunks: chunks.length,
    response: {
      provider,
      voice,
      duration_ms: totalDuration,
      cached: false,
      format: "mp3"
    }
  };
}
async function dispatchBatch(env2, items) {
  const results = [];
  for (const item of items.slice(0, 20)) {
    try {
      const result = await dispatch(env2, { text: item.text, voice: item.voice || "echo", format: "mp3" });
      const hash = await textHash(item.text, item.voice || "echo");
      const key = `batch/${hash}.mp3`;
      await env2.MEDIA.put(key, result.audio, {
        httpMetadata: { contentType: "audio/mpeg" }
      });
      results.push({ success: true, response: result.response, audio_key: key });
    } catch (e) {
      results.push({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return results;
}
function parseDialogue(text) {
  const lines = [];
  const regex = /^(?:\[?(\w+)\]?[:\s]+)(.+)$/gm;
  let match2;
  while ((match2 = regex.exec(text)) !== null) {
    const speaker = match2[1].toLowerCase();
    const lineText = match2[2].trim();
    let emotion;
    for (const tag of EMOTION_TAGS) {
      if (lineText.includes(`[${tag}]`)) {
        emotion = tag;
        break;
      }
    }
    lines.push({ speaker, text: lineText, emotion });
  }
  if (lines.length === 0 && text.trim()) {
    lines.push({ speaker: "echo", text: text.trim() });
  }
  return lines;
}
function applyEmotionSettings(options) {
  const emotionKey = options.emotion;
  if (!emotionKey) return {};
  const preset = EMOTION_VOICE_SETTINGS[emotionKey];
  if (!preset) return {};
  return {
    stability: options.stability ?? preset.stability,
    similarity: options.similarity ?? preset.similarity,
    style: options.style ?? preset.style,
    speed: options.speed ?? preset.speed
  };
}
async function synthesizeWithProvider(env2, provider, text, voice, options) {
  const emotionOverrides = applyEmotionSettings(options);
  switch (provider) {
    case "elevenlabs":
      return await synthesize({
        text,
        voice: options.voice_id || voice,
        apiKey: env2.ELEVENLABS_API_KEY,
        model: options.model,
        stability: emotionOverrides.stability ?? options.stability,
        similarity: emotionOverrides.similarity ?? options.similarity,
        style: emotionOverrides.style ?? options.style,
        speed: emotionOverrides.speed ?? options.speed,
        format: options.format === "wav" ? "pcm_16000" : void 0
      });
    case "edge_tts":
      return await synthesize2({
        text,
        voice,
        rate: options.speed ? Math.round((options.speed - 1) * 100) : 0,
        pitch: options.pitch ? Math.round(options.pitch * 100) : 0
      });
    case "gpu": {
      const health = await checkGPUHealth();
      if (!health.healthy) {
        throw new Error("GPU is not available");
      }
      return await gpuSynthesize(text, voice, {
        speed: options.speed,
        emotion: options.emotion,
        format: options.format
      });
    }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
function buildFallbackChain(primary) {
  switch (primary) {
    case "elevenlabs":
      return ["elevenlabs", "edge_tts", "gpu"];
    case "edge_tts":
      return ["edge_tts", "elevenlabs", "gpu"];
    case "gpu":
      return ["gpu", "elevenlabs", "edge_tts"];
    default:
      return ["edge_tts", "elevenlabs", "gpu"];
  }
}
function splitText(text, maxLength) {
  if (text.length <= maxLength) return [text];
  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = "";
  for (const sentence of sentences) {
    if (current.length + sentence.length > maxLength && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current += (current ? " " : "") + sentence;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
async function logGeneration(env2, text, voice, provider, format, durationMs) {
  try {
    const id = generateId();
    const hash = await textHash(text, voice);
    await env2.DB.prepare(
      `INSERT INTO generation_history (id, text_hash, text_preview, voice, provider, format, duration_ms, cache_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, hash, text.substring(0, 200), voice, provider, format, durationMs, `tts:${hash}:${format}`).run();
  } catch (e) {
    console.log(JSON.stringify({ ts: (/* @__PURE__ */ new Date()).toISOString(), worker: "echo-speak-cloud", level: "warn", message: "Generation history log failed", error: e?.message || String(e) }));
  }
}
var EMOTION_VOICE_SETTINGS;
var init_tts_router = __esm({
  "src/tts-router.ts"() {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_types();
    init_cache();
    init_elevenlabs();
    init_edge_tts();
    init_gpu_proxy();
    __name(dispatch, "dispatch");
    __name(dispatchFast, "dispatchFast");
    __name(dispatchChunked, "dispatchChunked");
    __name(dispatchBatch, "dispatchBatch");
    __name(parseDialogue, "parseDialogue");
    EMOTION_VOICE_SETTINGS = {
      laughs: { stability: 0.25, similarity: 0.65, style: 0.8 },
      whispers: { stability: 0.7, similarity: 0.85, style: 0.3, speed: 0.85 },
      sighs: { stability: 0.35, similarity: 0.7, style: 0.5, speed: 0.9 },
      sarcastic: { stability: 0.3, similarity: 0.7, style: 0.9 },
      excited: { stability: 0.2, similarity: 0.65, style: 0.95, speed: 1.15 },
      crying: { stability: 0.2, similarity: 0.8, style: 0.7, speed: 0.85 },
      curious: { stability: 0.35, similarity: 0.7, style: 0.6, speed: 1.05 },
      angry: { stability: 0.25, similarity: 0.65, style: 0.95, speed: 1.1 },
      sad: { stability: 0.3, similarity: 0.8, style: 0.6, speed: 0.88 },
      happy: { stability: 0.3, similarity: 0.65, style: 0.85, speed: 1.08 },
      surprised: { stability: 0.2, similarity: 0.65, style: 0.9, speed: 1.1 },
      fearful: { stability: 0.25, similarity: 0.75, style: 0.7, speed: 1.05 },
      disgusted: { stability: 0.3, similarity: 0.7, style: 0.8 },
      contemptuous: { stability: 0.35, similarity: 0.7, style: 0.85, speed: 0.95 },
      nervous: { stability: 0.2, similarity: 0.7, style: 0.5, speed: 1.1 },
      confident: { stability: 0.45, similarity: 0.75, style: 0.7, speed: 1 },
      bored: { stability: 0.5, similarity: 0.7, style: 0.3, speed: 0.92 },
      mocking: { stability: 0.25, similarity: 0.65, style: 0.9 },
      pleading: { stability: 0.2, similarity: 0.8, style: 0.75, speed: 0.9 }
    };
    __name(applyEmotionSettings, "applyEmotionSettings");
    __name(synthesizeWithProvider, "synthesizeWithProvider");
    __name(buildFallbackChain, "buildFallbackChain");
    __name(splitText, "splitText");
    __name(logGeneration, "logGeneration");
  }
});

// src/index.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/hono.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/hono-base.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/compose.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context2, next) => {
    let index = -1;
    return dispatch2(0);
    async function dispatch2(i) {
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
          res = await handler(context2, () => dispatch2(i + 1));
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
    __name(dispatch2, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/context.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/request.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/http-exception.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/request/constants.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
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
  #cachedBody = /* @__PURE__ */ __name((key) => {
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
  }, "#cachedBody");
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
};

// node_modules/hono/dist/utils/html.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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
var Context = class {
  static {
    __name(this, "Context");
  }
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
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
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
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
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
  header = /* @__PURE__ */ __name((name, value, options) => {
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
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
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
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
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
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
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
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
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
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
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
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
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
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
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
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
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
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
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
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
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
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
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
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
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
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
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
  }, "request");
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
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/router/reg-exp-router/router.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/router/reg-exp-router/matcher.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
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
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
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
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var Trie = class {
  static {
    __name(this, "Trie");
  }
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
};

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
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
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
};

// node_modules/hono/dist/router/reg-exp-router/prepared-router.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/router/smart-router/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/router/smart-router/router.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
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
};

// node_modules/hono/dist/router/trie-router/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/router/trie-router/router.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/router/trie-router/node.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
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
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
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
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
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
};

// node_modules/hono/dist/middleware/cors/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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
init_types();
init_tts_router();
init_cache();
init_elevenlabs();
init_gpu_proxy();

// src/stt.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
async function transcribe(env2, audio, options = {}) {
  const start = Date.now();
  if (env2.AI) {
    try {
      const result = await workersAIWhisper(env2, audio, options);
      return {
        ...result,
        duration_ms: Date.now() - start,
        provider: "workers_ai"
      };
    } catch (e) {
      console.log(JSON.stringify({
        ts: (/* @__PURE__ */ new Date()).toISOString(),
        level: "warn",
        worker: "echo-speak-cloud",
        message: "Workers AI Whisper failed, trying GPU fallback",
        error: e.message
      }));
    }
  }
  try {
    const result = await gpuWhisper(audio, options);
    return {
      ...result,
      duration_ms: Date.now() - start,
      provider: "gpu_whisper"
    };
  } catch (e) {
    throw new Error(`All STT providers failed: ${e.message}`);
  }
}
__name(transcribe, "transcribe");
async function workersAIWhisper(env2, audio, options) {
  const input = {
    audio: [...new Uint8Array(audio)]
  };
  if (options.language) input.language = options.language;
  if (options.prompt) input.initial_prompt = options.prompt;
  const result = await env2.AI.run("@cf/openai/whisper", input);
  if (!result.text) {
    throw new Error("Workers AI Whisper returned empty transcription");
  }
  const segments = [];
  if (result.words?.length) {
    let segText = "";
    let segStart = result.words[0].start;
    for (const word of result.words) {
      segText += (segText ? " " : "") + word.word;
      if (word.end - segStart > 5) {
        segments.push({ start: segStart, end: word.end, text: segText.trim() });
        segText = "";
        segStart = word.end;
      }
    }
    if (segText.trim()) {
      segments.push({
        start: segStart,
        end: result.words[result.words.length - 1].end,
        text: segText.trim()
      });
    }
  }
  return {
    text: result.text.trim(),
    segments: segments.length > 0 ? segments : void 0
  };
}
__name(workersAIWhisper, "workersAIWhisper");
async function gpuWhisper(audio, options) {
  const GPU_TUNNEL = "https://tts.echo-op.com";
  const formData = new FormData();
  formData.append("audio", new Blob([audio], { type: "audio/webm" }), "audio.webm");
  if (options.language) formData.append("language", options.language);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3e4);
  try {
    const resp = await fetch(`${GPU_TUNNEL}/transcribe`, {
      method: "POST",
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!resp.ok) throw new Error(`GPU Whisper error ${resp.status}`);
    const data = await resp.json();
    return {
      text: data.text || "",
      segments: data.segments
    };
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}
__name(gpuWhisper, "gpuWhisper");

// src/emotion-engine.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var EMOTION_LEXICONS = {
  happy: {
    keywords: ["happy", "great", "awesome", "love", "amazing", "wonderful", "fantastic", "excellent", "thrilled", "delighted", "joy", "celebrate", "yay", "woohoo", "perfect"],
    patterns: [/\b(so|really|very) (happy|excited|glad)\b/i, /!{2,}/, /❤️|🎉|😊|😄|🥳/],
    weight: 1
  },
  excited: {
    keywords: ["excited", "pumped", "stoked", "hyped", "can't wait", "fired up", "let's go", "incredible", "unbelievable", "mind-blowing"],
    patterns: [/!{3,}/, /\b(omg|wow|holy)\b/i, /ALL CAPS [A-Z]{4,}/],
    weight: 1.2
  },
  sad: {
    keywords: ["sad", "depressed", "down", "miserable", "lonely", "heartbroken", "devastated", "grief", "mourning", "loss", "miss", "cry", "tears", "unfortunately"],
    patterns: [/😢|😭|💔/, /\b(feel|feeling) (down|low|bad|terrible)\b/i],
    weight: 1
  },
  angry: {
    keywords: ["angry", "furious", "pissed", "mad", "outraged", "livid", "frustrated", "infuriated", "rage", "hate", "unacceptable", "ridiculous", "bullshit"],
    patterns: [/!{3,}.*!/, /\b(wtf|stfu|damn|hell)\b/i, /😡|🤬/],
    weight: 1.3
  },
  fearful: {
    keywords: ["scared", "afraid", "terrified", "anxious", "worried", "panic", "nervous", "frightened", "concerned", "uneasy", "dread"],
    patterns: [/\b(what if|oh no|help)\b/i, /😰|😨|😱/],
    weight: 1
  },
  surprised: {
    keywords: ["surprised", "shocked", "stunned", "unexpected", "whoa", "no way", "really", "seriously", "unbelievable", "jaw dropped"],
    patterns: [/\?!|!\?/, /\b(wait|what|how|huh)\b.*\?/i, /😲|😮|🤯/],
    weight: 0.9
  },
  curious: {
    keywords: ["curious", "wondering", "interested", "how does", "what is", "tell me", "explain", "learn", "understand", "question"],
    patterns: [/\?$/, /\b(how|why|what|when|where|who)\b.*\?/i, /🤔|💭/],
    weight: 0.8
  },
  disgusted: {
    keywords: ["disgusted", "gross", "nasty", "revolting", "sick", "vile", "repulsive", "terrible", "awful", "horrible"],
    patterns: [/🤢|🤮/, /\b(ew|eww|yuck|ugh)\b/i],
    weight: 1
  },
  confident: {
    keywords: ["confident", "sure", "certain", "absolutely", "definitely", "no doubt", "guaranteed", "proven", "clearly", "obviously"],
    patterns: [/\b(I know|I\'m sure|without doubt)\b/i],
    weight: 0.7
  },
  nervous: {
    keywords: ["nervous", "anxious", "jittery", "uneasy", "apprehensive", "hesitant", "unsure", "uncertain", "idk", "maybe"],
    patterns: [/\.{3,}/, /\b(um|uh|hmm|err)\b/i],
    weight: 0.8
  },
  sarcastic: {
    keywords: ["sure", "right", "totally", "obviously", "brilliant", "genius", "wow"],
    patterns: [/\b(oh sure|yeah right|how wonderful)\b/i, /🙄/],
    weight: 0.6
    // Lower weight — sarcasm is hard to detect from text alone
  },
  bored: {
    keywords: ["bored", "boring", "meh", "whatever", "don't care", "not interested", "yawn"],
    patterns: [/\b(meh|blah|zzzz)\b/i, /😴|🥱/],
    weight: 0.7
  }
};
var PERSONALITY_EMOTION_BIAS = {
  echo: {},
  // Balanced — no bias
  bree: { happy: 0.3, excited: 0.2 },
  // Amplifies warmth
  gs343: { confident: 0.3 },
  // Suppresses most emotions, stays analytical
  prometheus: { fearful: 0.1, nervous: 0.1 },
  // Biases toward vigilance
  phoenix: { happy: 0.15, confident: 0.15 },
  // Resilient, positive
  warmaster: { confident: 0.3 },
  // Commanding
  nexus: { curious: 0.2 },
  // Technical curiosity
  sage: { curious: 0.15 },
  // Measured wisdom
  raven: { sarcastic: 0.1 }
  // Dark analytical
};
function lexiconScan(text) {
  const scores = /* @__PURE__ */ new Map();
  const lowerText = text.toLowerCase();
  for (const [emotion, lexicon] of Object.entries(EMOTION_LEXICONS)) {
    let score = 0;
    for (const keyword of lexicon.keywords) {
      if (lowerText.includes(keyword)) {
        score += lexicon.weight;
      }
    }
    for (const pattern of lexicon.patterns) {
      if (pattern.test(text)) {
        score += lexicon.weight * 1.5;
      }
    }
    if (score > 0) {
      scores.set(emotion, score);
    }
  }
  return scores;
}
__name(lexiconScan, "lexiconScan");
function analyzeTrajectory(history) {
  if (history.length < 2) return "stable";
  const recent = history.slice(-5);
  const intensities = recent.map((h) => h.intensity);
  let increasing = 0;
  let decreasing = 0;
  for (let i = 1; i < intensities.length; i++) {
    if (intensities[i] > intensities[i - 1] + 0.1) increasing++;
    else if (intensities[i] < intensities[i - 1] - 0.1) decreasing++;
  }
  const uniqueEmotions = new Set(recent.map((h) => h.emotion));
  if (uniqueEmotions.size > 3) return "shifting";
  if (increasing > decreasing + 1) return "escalating";
  if (decreasing > increasing + 1) return "deescalating";
  return "stable";
}
__name(analyzeTrajectory, "analyzeTrajectory");
var RESPONSE_EMOTION_MAP = {
  happy: { emotion: "happy", intensity_mod: 0.9 },
  // Mirror joy
  excited: { emotion: "excited", intensity_mod: 0.85 },
  // Match energy
  sad: { emotion: "curious", intensity_mod: 0.6 },
  // Empathy + gentle curiosity
  angry: { emotion: "confident", intensity_mod: 0.7 },
  // Calm determination
  fearful: { emotion: "confident", intensity_mod: 0.65 },
  // Reassurance
  surprised: { emotion: "excited", intensity_mod: 0.7 },
  // Share surprise positively
  curious: { emotion: "excited", intensity_mod: 0.75 },
  // Enthusiasm to share
  disgusted: { emotion: "neutral", intensity_mod: 0.4 },
  // Acknowledge, stay measured
  confident: { emotion: "confident", intensity_mod: 0.6 },
  // Match confidence
  nervous: { emotion: "confident", intensity_mod: 0.7 },
  // Reassure
  sarcastic: { emotion: "laughs", intensity_mod: 0.5 },
  // Light humor
  bored: { emotion: "excited", intensity_mod: 0.8 },
  // Re-engage with energy
  neutral: { emotion: "neutral", intensity_mod: 0.3 }
  // Stay neutral
};
function selectResponseEmotion(userEmotion, personality, trajectory) {
  const mapping = RESPONSE_EMOTION_MAP[userEmotion] || RESPONSE_EMOTION_MAP.neutral;
  let intensity = mapping.intensity_mod;
  const bias = PERSONALITY_EMOTION_BIAS[personality] || {};
  const emotionBias = bias[mapping.emotion] || 0;
  intensity = Math.min(1, intensity + emotionBias);
  if (trajectory === "escalating") intensity = Math.min(1, intensity + 0.1);
  if (trajectory === "deescalating") intensity = Math.max(0.1, intensity - 0.15);
  if (personality === "gs343") {
    intensity = Math.min(0.3, intensity);
    if (mapping.emotion !== "confident" && mapping.emotion !== "neutral") {
      return { emotion: "neutral", intensity: 0.2 };
    }
  }
  return { emotion: mapping.emotion, intensity };
}
__name(selectResponseEmotion, "selectResponseEmotion");
function placeEmotionTags(text, responseEmotion, intensity) {
  if (responseEmotion === "neutral" || intensity < 0.3) return [];
  const words = text.split(/\s+/);
  const tags = [];
  const maxTags = words.length < 30 ? 1 : intensity > 0.7 ? 3 : 2;
  const isTechnical = /```|`[^`]+`|\b(function|class|const|let|var|import|export|return)\b/i.test(text);
  const effectiveMax = isTechnical ? Math.min(1, maxTags) : maxTags;
  if (effectiveMax === 0) return [];
  if (intensity > 0.5 && effectiveMax >= 1) {
    tags.push({
      tag: responseEmotion,
      position: "opening",
      insert_before_word_index: 0
    });
  }
  if (effectiveMax >= 2 && words.length > 30) {
    const midPoint = Math.floor(words.length * 0.5);
    let insertAt = midPoint;
    for (let i = midPoint; i >= midPoint - 10 && i >= 0; i--) {
      if (words[i]?.endsWith(".") || words[i]?.endsWith("!") || words[i]?.endsWith("?") || words[i]?.endsWith(",")) {
        insertAt = i + 1;
        break;
      }
    }
    if (insertAt > 15 || tags.length === 0) {
      tags.push({
        tag: responseEmotion,
        position: "mid",
        insert_before_word_index: insertAt
      });
    }
  }
  if (effectiveMax >= 3 && words.length > 50 && intensity > 0.6) {
    const closePoint = Math.floor(words.length * 0.9);
    const lastTagIndex = tags.length > 0 ? tags[tags.length - 1].insert_before_word_index : -20;
    if (closePoint - lastTagIndex > 15) {
      tags.push({
        tag: responseEmotion,
        position: "closing",
        insert_before_word_index: closePoint
      });
    }
  }
  return tags;
}
__name(placeEmotionTags, "placeEmotionTags");
function applyEmotionTags(text, tags) {
  if (tags.length === 0) return text;
  const words = text.split(/\s+/);
  const tagMap = /* @__PURE__ */ new Map();
  for (const tag of tags) {
    tagMap.set(tag.insert_before_word_index, `[${tag.tag}]`);
  }
  const result = [];
  for (let i = 0; i < words.length; i++) {
    const tagStr = tagMap.get(i);
    if (tagStr) result.push(tagStr);
    result.push(words[i]);
  }
  return result.join(" ");
}
__name(applyEmotionTags, "applyEmotionTags");
function analyzeEmotion(userMessage, responseText, history = [], personality = "echo") {
  const scores = lexiconScan(userMessage);
  let topEmotion = "neutral";
  let topScore = 0;
  for (const [emotion, score] of scores) {
    if (score > topScore) {
      topScore = score;
      topEmotion = emotion;
    }
  }
  const userIntensity = Math.min(1, topScore / 5);
  const trajectory = analyzeTrajectory(history);
  const { emotion: responseEmotion, intensity: responseIntensity } = selectResponseEmotion(
    topEmotion,
    personality,
    trajectory
  );
  const voiceTags = placeEmotionTags(responseText, responseEmotion, responseIntensity);
  return {
    user_emotion: topEmotion,
    user_intensity: userIntensity,
    response_emotion: responseEmotion,
    response_intensity: responseIntensity,
    trajectory,
    voice_tags: voiceTags
  };
}
__name(analyzeEmotion, "analyzeEmotion");
function detectEmotion(text) {
  const scores = lexiconScan(text);
  let topEmotion = "neutral";
  let topScore = 0;
  for (const [emotion, score] of scores) {
    if (score > topScore) {
      topScore = score;
      topEmotion = emotion;
    }
  }
  return { emotion: topEmotion, intensity: Math.min(1, topScore / 5) };
}
__name(detectEmotion, "detectEmotion");

// src/voice-orchestrator.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_tts_router();
init_elevenlabs();
var CLONED_VOICES = /* @__PURE__ */ new Set(["commander", "jr", "roybean", "adam"]);
var DEFAULT_CHUNK_SIZE = 800;
var MAX_PARALLEL_SYNTH = 3;
function prepareTextForSpeech(text) {
  let clean = text;
  clean = clean.replace(/```[\s\S]*?```/g, " ");
  clean = clean.replace(/`[^`]+`/g, (match2) => match2.replace(/`/g, ""));
  clean = clean.replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1");
  clean = clean.replace(/_{1,3}([^_]+)_{1,3}/g, "$1");
  clean = clean.replace(/^#{1,6}\s+/gm, "");
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  clean = clean.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
  clean = clean.replace(/^\s*[-*+]\s+/gm, "");
  clean = clean.replace(/^\s*\d+\.\s+/gm, "");
  clean = clean.replace(/\bAPI\b/g, "A P I");
  clean = clean.replace(/\bURL\b/g, "U R L");
  clean = clean.replace(/\bSQL\b/g, "sequel");
  clean = clean.replace(/\bHTTP\b/g, "H T T P");
  clean = clean.replace(/\bCPU\b/g, "C P U");
  clean = clean.replace(/\bGPU\b/g, "G P U");
  clean = clean.replace(/\bRAM\b/g, "ram");
  clean = clean.replace(/\bAI\b/g, "A I");
  clean = clean.replace(/\bML\b/g, "M L");
  clean = clean.replace(/\bTTS\b/g, "text to speech");
  clean = clean.replace(/\bSTT\b/g, "speech to text");
  clean = clean.replace(/\bLLM\b/g, "L L M");
  clean = clean.replace(/\b(\d{1,3}(?:,\d{3})+)\b/g, (match2) => {
    const num = parseInt(match2.replace(/,/g, ""));
    return numberToWords(num);
  });
  clean = clean.replace(/\b(\d{4,})\b/g, (match2) => {
    const num = parseInt(match2);
    if (num > 9999) return numberToWords(num);
    return match2;
  });
  clean = clean.replace(/(\d+\.?\d*)\s*%/g, (_, num) => `${num} percent`);
  clean = clean.replace(/\$(\d+(?:,\d{3})*(?:\.\d+)?)/g, (_, amount) => {
    const num = parseFloat(amount.replace(/,/g, ""));
    return `${numberToWords(Math.floor(num))} dollars`;
  });
  clean = clean.replace(/\n+/g, ". ");
  clean = clean.replace(/\s+/g, " ");
  clean = clean.trim();
  return clean;
}
__name(prepareTextForSpeech, "prepareTextForSpeech");
function numberToWords(n) {
  if (n === 0) return "zero";
  if (n < 0) return "negative " + numberToWords(-n);
  const ones = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen"
  ];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  if (n < 1e3) return ones[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + numberToWords(n % 100) : "");
  if (n < 1e6) return numberToWords(Math.floor(n / 1e3)) + " thousand" + (n % 1e3 ? " " + numberToWords(n % 1e3) : "");
  if (n < 1e9) return numberToWords(Math.floor(n / 1e6)) + " million" + (n % 1e6 ? " " + numberToWords(n % 1e6) : "");
  return String(n);
}
__name(numberToWords, "numberToWords");
function chunkForVoice(text, chunkSize = DEFAULT_CHUNK_SIZE) {
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [text];
  const chunks = [];
  let current = "";
  let chunkIndex = 0;
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    if (current.length + trimmed.length > chunkSize && current.length > 0) {
      chunks.push(buildChunkMeta(current.trim(), chunkIndex++));
      current = "";
    }
    current += trimmed + " ";
  }
  if (current.trim()) {
    chunks.push(buildChunkMeta(current.trim(), chunkIndex));
  }
  if (chunks.length > 0) {
    chunks[0].isFirst = true;
    chunks[chunks.length - 1].isLast = true;
  }
  return chunks;
}
__name(chunkForVoice, "chunkForVoice");
function buildChunkMeta(text, index) {
  const isTechnical = /\b(function|class|const|let|var|import|export|return|async|await)\b/i.test(text) || /```|`[^`]+`/.test(text) || /\b\d+\.\d+\.\d+\b/.test(text);
  const hasEmotionTag = /\[(laughs|whispers|sighs|sarcastic|excited|crying|curious|angry|sad|happy)\]/i.test(text);
  return {
    text,
    index,
    isFirst: false,
    isLast: false,
    hasEmotion: hasEmotionTag,
    emotionIntensity: 0,
    isTechnical,
    provider: "edge_tts",
    // Default, overridden by selectChunkProvider
    emotionTag: void 0
  };
}
__name(buildChunkMeta, "buildChunkMeta");
function selectChunkProvider(chunk, voice, quota) {
  if (CLONED_VOICES.has(voice)) return "elevenlabs";
  if (quota.recommendation === "exhausted") return "edge_tts";
  if (chunk.hasEmotion || chunk.emotionIntensity > 0.6) {
    return quota.recommendation !== "red" ? "elevenlabs" : "edge_tts";
  }
  if (chunk.isFirst || chunk.isLast) {
    return quota.recommendation !== "red" ? "elevenlabs" : "edge_tts";
  }
  if (chunk.isTechnical) return "edge_tts";
  switch (quota.recommendation) {
    case "green":
      return "elevenlabs";
    // > 50% remaining
    case "yellow":
      return Math.random() < 0.6 ? "elevenlabs" : "edge_tts";
    // 20-50%
    case "red":
      return "edge_tts";
    // < 20%
    default:
      return "edge_tts";
  }
}
__name(selectChunkProvider, "selectChunkProvider");
async function getQuotaStatus(env2) {
  const cached = await env2.CACHE.get("el_quota_status", "json");
  if (cached) return cached;
  let charLimit = 1e5;
  let charsUsed = 0;
  if (env2.ELEVENLABS_API_KEY) {
    try {
      const usage = await getUsage(env2.ELEVENLABS_API_KEY);
      if (usage) {
        charLimit = usage.character_limit || 1e5;
        charsUsed = usage.character_count || 0;
      }
    } catch {
    }
  }
  const remaining = Math.max(0, charLimit - charsUsed);
  const usagePercent = charLimit > 0 ? charsUsed / charLimit * 100 : 100;
  let recommendation;
  if (remaining <= 0) recommendation = "exhausted";
  else if (usagePercent > 80) recommendation = "red";
  else if (usagePercent > 50) recommendation = "yellow";
  else recommendation = "green";
  const status = {
    el_chars_remaining: remaining,
    el_chars_limit: charLimit,
    usage_percent: Math.round(usagePercent * 10) / 10,
    recommendation
  };
  await env2.CACHE.put("el_quota_status", JSON.stringify(status), { expirationTtl: 300 });
  return status;
}
__name(getQuotaStatus, "getQuotaStatus");
async function orchestrateVoice(text, voice, personality, userMessage, env2, options = {}) {
  const start = Date.now();
  const cleanText = prepareTextForSpeech(text);
  const chunks = chunkForVoice(cleanText, options.chunkSize || DEFAULT_CHUNK_SIZE);
  const emotion = analyzeEmotion(
    userMessage,
    cleanText,
    options.emotionHistory || [],
    personality
  );
  if (emotion.voice_tags.length > 0) {
    const taggedText = applyEmotionTags(cleanText, emotion.voice_tags);
    const taggedChunks = chunkForVoice(taggedText, options.chunkSize || DEFAULT_CHUNK_SIZE);
    for (let i = 0; i < Math.min(chunks.length, taggedChunks.length); i++) {
      chunks[i].text = taggedChunks[i].text;
      chunks[i].hasEmotion = taggedChunks[i].hasEmotion || /\[[\w]+\]/.test(taggedChunks[i].text);
      chunks[i].emotionIntensity = emotion.response_intensity;
    }
  }
  const quota = await getQuotaStatus(env2);
  let elCharsUsed = 0;
  for (const chunk of chunks) {
    chunk.provider = selectChunkProvider(chunk, voice, quota);
    if (chunk.provider === "elevenlabs") {
      elCharsUsed += chunk.text.length;
    }
  }
  const audioBuffers = new Array(chunks.length);
  const providerBreakdown = {};
  for (let i = 0; i < chunks.length; i += MAX_PARALLEL_SYNTH) {
    const batch = chunks.slice(i, i + MAX_PARALLEL_SYNTH);
    const results = await Promise.all(
      batch.map(async (chunk) => {
        try {
          const synthText = chunk.provider === "edge_tts" ? chunk.text.replace(/\[[\w]+\]\s*/g, "") : chunk.text;
          const result = await dispatch(env2, {
            text: synthText,
            voice,
            provider: chunk.provider,
            emotion: chunk.hasEmotion ? emotion.response_emotion : void 0
          });
          providerBreakdown[chunk.provider] = (providerBreakdown[chunk.provider] || 0) + 1;
          return result.audio;
        } catch (e) {
          if (chunk.provider === "elevenlabs") {
            const fallbackText = chunk.text.replace(/\[[\w]+\]\s*/g, "");
            const result = await dispatch(env2, {
              text: fallbackText,
              voice,
              provider: "edge_tts"
            });
            providerBreakdown["edge_tts_fallback"] = (providerBreakdown["edge_tts_fallback"] || 0) + 1;
            return result.audio;
          }
          throw e;
        }
      })
    );
    for (let j = 0; j < results.length; j++) {
      audioBuffers[i + j] = results[j];
    }
  }
  const totalLength = audioBuffers.reduce((s, b) => s + b.byteLength, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of audioBuffers) {
    combined.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }
  return {
    audio: combined.buffer,
    chunks,
    provider_breakdown: providerBreakdown,
    total_chars: cleanText.length,
    el_chars_used: elCharsUsed,
    emotion_analysis: emotion,
    latency_ms: Date.now() - start
  };
}
__name(orchestrateVoice, "orchestrateVoice");

// src/conversation-do.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_types();

// src/elevenlabs-ws.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_types();
init_elevenlabs();
var WS_BASE = "wss://api.elevenlabs.io/v1/text-to-speech";
function createStreamingSession(options) {
  return new StreamingSession(options);
}
__name(createStreamingSession, "createStreamingSession");
var StreamingSession = class {
  static {
    __name(this, "StreamingSession");
  }
  ws = null;
  options;
  connected = false;
  closed = false;
  pendingChunks = [];
  audioChunks = [];
  resolveReady = null;
  readyPromise;
  resolveComplete = null;
  completePromise;
  constructor(options) {
    this.options = options;
    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
    this.completePromise = new Promise((resolve) => {
      this.resolveComplete = resolve;
    });
  }
  /**
   * Open the WebSocket connection and send BOS.
   */
  async connect() {
    if (this.connected || this.closed) return;
    const voiceId = resolveVoiceId2(this.options.voice);
    const model = resolveModel(this.options.voice, this.options.model);
    const format = this.options.outputFormat || "mp3_44100_128";
    const url = `${WS_BASE}/${voiceId}/stream-input?model_id=${model}&output_format=${format}`;
    this.ws = new WebSocket(url);
    this.ws.addEventListener("open", () => {
      const bos = {
        text: " ",
        // BOS marker
        voice_settings: {
          stability: this.options.stability ?? 0.5,
          similarity_boost: this.options.similarity ?? 0.75,
          style: this.options.style ?? 0,
          use_speaker_boost: true
        },
        xi_api_key: this.options.apiKey,
        generation_config: {
          chunk_length_schedule: [120, 160, 250, 290]
        }
      };
      this.ws.send(JSON.stringify(bos));
      this.connected = true;
      for (const chunk of this.pendingChunks) {
        this.ws.send(JSON.stringify({ text: chunk }));
      }
      this.pendingChunks = [];
      if (this.resolveReady) {
        this.resolveReady();
        this.resolveReady = null;
      }
    });
    this.ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.audio) {
          const binaryStr = atob(data.audio);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          this.audioChunks.push(bytes);
          this.options.onAudioChunk(bytes);
        }
        if (data.normalizedAlignment && this.options.onAlignment) {
          this.options.onAlignment(data.normalizedAlignment);
        } else if (data.alignment && this.options.onAlignment) {
          this.options.onAlignment(data.alignment);
        }
        if (data.isFinal) {
          this.handleComplete();
        }
      } catch (e) {
        console.log(JSON.stringify({
          ts: (/* @__PURE__ */ new Date()).toISOString(),
          level: "warn",
          worker: "echo-speak-cloud",
          message: "ElevenLabs WS message parse error",
          error: e.message
        }));
      }
    });
    this.ws.addEventListener("error", (event) => {
      const err = new Error("ElevenLabs WebSocket error");
      if (this.options.onError) this.options.onError(err);
      this.handleComplete();
    });
    this.ws.addEventListener("close", () => {
      this.connected = false;
      this.handleComplete();
    });
    return this.readyPromise;
  }
  /**
   * Send a text chunk to be synthesized.
   * Can be called before connection is fully ready — chunks are queued.
   */
  sendText(text) {
    if (this.closed) return;
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify({ text }));
    } else {
      this.pendingChunks.push(text);
    }
  }
  /**
   * Flush the stream — force ElevenLabs to generate audio for all buffered text.
   */
  flush() {
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify({ text: "", flush: true }));
    }
  }
  /**
   * Send EOS (End of Stream) — signals no more text is coming.
   * ElevenLabs will flush remaining audio and send isFinal.
   */
  async finish() {
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify({ text: "" }));
    }
    await this.completePromise;
    return this.audioChunks;
  }
  /**
   * Interrupt the current stream — cancels all pending audio.
   * Used for barge-in when user starts speaking.
   */
  interrupt() {
    this.closed = true;
    if (this.ws) {
      try {
        this.ws.close(1e3, "interrupted");
      } catch (e) {
      }
      this.ws = null;
    }
    this.connected = false;
    this.handleComplete();
  }
  /**
   * Get all collected audio chunks.
   */
  getAudioChunks() {
    return this.audioChunks;
  }
  /**
   * Get combined audio as single ArrayBuffer.
   */
  getCombinedAudio() {
    const totalLength = this.audioChunks.reduce((s, c) => s + c.byteLength, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of this.audioChunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return combined.buffer;
  }
  handleComplete() {
    if (this.resolveComplete) {
      this.resolveComplete();
      this.resolveComplete = null;
    }
    if (this.options.onComplete) {
      this.options.onComplete();
    }
  }
};
function resolveVoiceId2(voice) {
  if (voice.length > 10 && /^[a-zA-Z0-9]+$/.test(voice)) return voice;
  return ELEVENLABS_VOICES[voice.toLowerCase()] || ELEVENLABS_VOICES.echo;
}
__name(resolveVoiceId2, "resolveVoiceId");

// src/conversation-do.ts
init_elevenlabs();
function log3(level, message, data) {
  const entry = { ts: (/* @__PURE__ */ new Date()).toISOString(), level, worker: "echo-speak-cloud", component: "conversation-do", message, ...data };
  if (level === "error") console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}
__name(log3, "log");
var FILLER_PHRASES = [
  "Hmm...",
  "Yeah...",
  "Let me think...",
  "Mhm...",
  "Well...",
  "Right...",
  "So...",
  "OK..."
];
var VoiceConversation = class {
  static {
    __name(this, "VoiceConversation");
  }
  state;
  env;
  ws = null;
  config = null;
  sessionId = "";
  sessionStartTime = 0;
  history = [];
  audioBuffer = [];
  isProcessing = false;
  ttsSession = null;
  // v2.1 — Triple-streaming + fillers + VAD + correction
  vadScore = 0;
  currentResponseText = "";
  interruptedResponseText = "";
  chunksSent = 0;
  turnStartTime = 0;
  fillerSent = false;
  isGenerating = false;
  fillerTimeout = null;
  sttLatencyMs = 0;
  constructor(state, env2) {
    this.state = state;
    this.env = env2;
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/ws") {
      return this.handleWebSocket(request);
    }
    if (url.pathname === "/status") {
      return new Response(JSON.stringify({
        session_id: this.sessionId,
        active: !!this.ws,
        turns: this.history.length,
        config: this.config ? {
          voice: this.config.voice,
          personality: this.config.personality,
          turn_eagerness: this.config.turn_eagerness,
          filler_enabled: this.config.filler_enabled
        } : null,
        version: "2.1.0"
      }), { headers: { "Content-Type": "application/json" } });
    }
    return new Response("Not Found", { status: 404 });
  }
  handleWebSocket(request) {
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    this.ws = server;
    server.accept();
    server.addEventListener("message", async (event) => {
      try {
        const msg = JSON.parse(event.data);
        await this.handleMessage(msg);
      } catch (e) {
        this.sendError(`Message parse error: ${e.message}`);
      }
    });
    server.addEventListener("close", () => {
      this.cleanup();
    });
    server.addEventListener("error", () => {
      this.cleanup();
    });
    return new Response(null, { status: 101, webSocket: client });
  }
  async handleMessage(msg) {
    switch (msg.type) {
      case "session.start":
        await this.handleSessionStart(msg);
        break;
      case "audio.chunk":
        await this.handleAudioChunk(msg.audio, msg.format);
        break;
      case "audio.end":
        await this.handleAudioEnd();
        break;
      case "text.input":
        await this.handleTextInput(msg.text);
        break;
      case "interrupt":
        await this.handleInterrupt();
        break;
      case "turn.config":
        this.handleTurnConfig(msg.eagerness);
        break;
      case "vad.update":
        this.handleVadUpdate(msg.score);
        break;
      case "session.end":
        await this.handleSessionEnd();
        break;
      default:
        this.sendError(`Unknown message type: ${msg.type}`);
    }
  }
  // ─── Session Lifecycle ──────────────────────────────────────────
  async handleSessionStart(msg) {
    this.sessionId = crypto.randomUUID();
    this.sessionStartTime = Date.now();
    const eagerness = msg.turn_eagerness || "normal";
    this.config = {
      voice: msg.voice || "echo",
      personality: msg.personality || "echo",
      site_id: msg.site_id || "echo-op.com",
      user_id: msg.user_id || "anonymous",
      model: msg.model,
      turn_eagerness: eagerness,
      filler_enabled: msg.filler_enabled !== false,
      silence_threshold_ms: TURN_EAGERNESS_DEFAULTS[eagerness] || 700,
      max_response_length: msg.max_response_length || 500,
      language: msg.language || "en"
    };
    this.history = [];
    this.audioBuffer = [];
    this.vadScore = 0;
    log3("info", "Session started", {
      session_id: this.sessionId,
      voice: this.config.voice,
      personality: this.config.personality,
      turn_eagerness: this.config.turn_eagerness
    });
    try {
      const brainResp = await this.env.SHARED_BRAIN.fetch("https://brain/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `voice conversation ${this.config.user_id}`,
          limit: 5
        })
      });
      const brainData = await brainResp.json();
      if (brainData.results?.length) {
        for (const mem of brainData.results.slice(0, 3)) {
          this.history.push({
            role: "assistant",
            content: `[recalled] ${(mem.content || "").substring(0, 200)}`,
            timestamp: Date.now() - 6e4
          });
        }
      }
    } catch {
    }
    this.send({
      type: "session.ready",
      session_id: this.sessionId,
      voice: this.config.voice,
      personality: this.config.personality,
      turn_eagerness: this.config.turn_eagerness,
      silence_ms: this.config.silence_threshold_ms
    });
  }
  async handleSessionEnd() {
    const duration = Date.now() - this.sessionStartTime;
    if (this.history.length > 0) {
      const summary = this.history.filter((t) => t.role === "user").map((t) => t.content).join(" | ").substring(0, 500);
      try {
        await this.env.SHARED_BRAIN.fetch("https://brain/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instance_id: `voice-${this.sessionId}`,
            role: "assistant",
            content: `Voice conversation summary (${this.config?.personality || "echo"}): ${summary}`,
            importance: 6,
            tags: ["voice", "conversation", this.config?.personality || "echo"]
          })
        });
      } catch {
      }
    }
    log3("info", "Session ended", {
      session_id: this.sessionId,
      turns: this.history.length,
      duration_ms: duration
    });
    this.send({ type: "session.ended", turns: this.history.length, duration_ms: duration });
    this.cleanup();
  }
  // ─── Turn Configuration ────────────────────────────────────────
  handleTurnConfig(eagerness) {
    if (!this.config) return;
    const valid = ["eager", "normal", "patient"];
    const e = valid.includes(eagerness) ? eagerness : "normal";
    this.config.turn_eagerness = e;
    this.config.silence_threshold_ms = TURN_EAGERNESS_DEFAULTS[e];
    this.send({
      type: "turn.config",
      eagerness: e,
      silence_ms: this.config.silence_threshold_ms
    });
  }
  handleVadUpdate(score) {
    this.vadScore = Math.max(0, Math.min(1, score || 0));
    this.send({ type: "vad.score", score: this.vadScore });
  }
  // ─── Audio Processing ───────────────────────────────────────────
  async handleAudioChunk(audioBase64, format) {
    const binaryStr = atob(audioBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    this.audioBuffer.push(bytes);
  }
  async handleAudioEnd() {
    if (this.audioBuffer.length === 0) return;
    if (this.isProcessing) return;
    this.isProcessing = true;
    const sttStart = Date.now();
    try {
      const totalLen = this.audioBuffer.reduce((s, b) => s + b.byteLength, 0);
      const combined = new Uint8Array(totalLen);
      let offset = 0;
      for (const buf of this.audioBuffer) {
        combined.set(buf, offset);
        offset += buf.byteLength;
      }
      this.audioBuffer = [];
      const transcription = await transcribe(this.env, combined.buffer, {
        language: this.config?.language || "en",
        prompt: this.history.slice(-2).map((t) => t.content).join(". ")
      });
      this.sttLatencyMs = Date.now() - sttStart;
      if (!transcription.text || transcription.text.trim().length === 0) {
        this.isProcessing = false;
        return;
      }
      this.send({ type: "transcript", text: transcription.text, is_final: true });
      await this.processUserInput(transcription.text);
    } catch (e) {
      log3("error", "Audio processing failed", { error: e.message, session_id: this.sessionId });
      this.sendError(`Audio processing failed: ${e.message}`);
    } finally {
      this.isProcessing = false;
    }
  }
  // ─── Text Processing ────────────────────────────────────────────
  async handleTextInput(text) {
    if (!text?.trim()) return;
    if (this.isProcessing) {
      await this.handleInterrupt();
    }
    this.isProcessing = true;
    this.sttLatencyMs = 0;
    try {
      await this.processUserInput(text.trim());
    } catch (e) {
      log3("error", "Text processing failed", { error: e.message, session_id: this.sessionId });
      this.sendError(`Text processing failed: ${e.message}`);
    } finally {
      this.isProcessing = false;
    }
  }
  // ─── Core Pipeline (v2.1 Triple-Streaming) ────────────────────
  async processUserInput(userText) {
    if (!this.config) {
      this.sendError("Session not started");
      return;
    }
    this.turnStartTime = Date.now();
    this.currentResponseText = "";
    this.interruptedResponseText = "";
    this.chunksSent = 0;
    this.fillerSent = false;
    this.isGenerating = true;
    const userEmotion = detectEmotion(userText);
    this.history.push({
      role: "user",
      content: userText,
      timestamp: Date.now(),
      emotion: userEmotion.emotion
    });
    const contextMessages = this.history.filter((t) => !t.content.startsWith("[recalled]")).slice(-8).map((t) => ({ role: t.role, content: t.content }));
    let ttsSession = null;
    let audioChunkIndex = 0;
    let ttsFirstAudioMs = 0;
    if (this.env.ELEVENLABS_API_KEY && ELEVENLABS_VOICES[this.config.voice]) {
      ttsSession = createStreamingSession({
        voice: this.config.voice,
        apiKey: this.env.ELEVENLABS_API_KEY,
        model: resolveModelForConversation(this.config.voice),
        onAudioChunk: /* @__PURE__ */ __name((chunk) => {
          const base64 = btoa(String.fromCharCode(...chunk));
          this.send({ type: "audio.chunk", audio: base64, index: audioChunkIndex++ });
          if (audioChunkIndex === 1) {
            ttsFirstAudioMs = Date.now() - this.turnStartTime;
          }
        }, "onAudioChunk"),
        onAlignment: /* @__PURE__ */ __name((alignment) => {
          this.send({ type: "alignment", ...alignment });
        }, "onAlignment"),
        onError: /* @__PURE__ */ __name((err) => {
          log3("warn", "TTS streaming error", { error: err.message, session_id: this.sessionId });
        }, "onError")
      });
      this.ttsSession = ttsSession;
      ttsSession.connect().catch(() => {
        log3("warn", "TTS WS connection failed", { session_id: this.sessionId });
      });
    }
    if (this.config.filler_enabled) {
      this.fillerTimeout = setTimeout(() => this.sendFiller(), 1500);
    }
    const llmStart = Date.now();
    try {
      const chatResp = await this.env.ECHO_CHAT.fetch("https://chat/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          personality: this.config.personality,
          site_id: this.config.site_id,
          user_id: this.config.user_id,
          history: contextMessages,
          voice_mode: true,
          max_tokens: this.config.max_response_length
        })
      });
      if (this.fillerTimeout) {
        clearTimeout(this.fillerTimeout);
        this.fillerTimeout = null;
      }
      if (!chatResp.ok) {
        this.currentResponseText = await this.fallbackGenerate(userText, contextMessages);
      } else {
        const chatData = await chatResp.json();
        this.currentResponseText = chatData.response || chatData.message || chatData.reply || "I heard you.";
      }
    } catch (e) {
      if (this.fillerTimeout) {
        clearTimeout(this.fillerTimeout);
        this.fillerTimeout = null;
      }
      log3("warn", "Echo Chat call failed, using fallback", { error: e.message });
      this.currentResponseText = await this.fallbackGenerate(userText, contextMessages);
    }
    const llmLatencyMs = Date.now() - llmStart;
    this.isGenerating = false;
    if (!this.ttsSession && ttsSession) {
      return;
    }
    const emotionHistory = this.history.filter((t) => t.emotion).map((t) => ({ emotion: t.emotion, intensity: 0.5, timestamp: t.timestamp }));
    const emotion = analyzeEmotion(
      userText,
      this.currentResponseText,
      emotionHistory,
      this.config.personality
    );
    this.send({
      type: "response.start",
      emotion: emotion.response_emotion,
      intensity: emotion.response_intensity
    });
    const cleanText = prepareTextForSpeech(this.currentResponseText);
    this.send({ type: "response.text", text: this.currentResponseText });
    this.history.push({
      role: "assistant",
      content: this.currentResponseText,
      timestamp: Date.now(),
      emotion: emotion.response_emotion,
      latency_ms: Date.now() - this.turnStartTime
    });
    if (ttsSession && this.ttsSession) {
      await ttsSession.connect();
      const chunks = splitForProgressiveTTS(cleanText);
      for (const chunk of chunks) {
        if (!this.ttsSession) break;
        ttsSession.sendText(chunk);
        this.chunksSent++;
        this.send({ type: "response.token", token: chunk });
      }
      try {
        await ttsSession.finish();
      } catch {
      }
      this.ttsSession = null;
    } else if (cleanText.length > 0) {
      await this.synthesizeAndSend(cleanText, this.config.voice);
    }
    const totalMs = Date.now() - this.turnStartTime;
    this.send({
      type: "latency",
      stt_ms: this.sttLatencyMs,
      llm_first_token_ms: llmLatencyMs,
      tts_first_audio_ms: ttsFirstAudioMs,
      total_ms: totalMs
    });
    log3("info", "Turn complete", {
      session_id: this.sessionId,
      stt_ms: this.sttLatencyMs,
      llm_ms: llmLatencyMs,
      tts_first_audio_ms: ttsFirstAudioMs,
      total_ms: totalMs,
      response_chars: this.currentResponseText.length,
      audio_chunks: audioChunkIndex
    });
    this.send({ type: "audio.end" });
  }
  // ─── Filler Audio ──────────────────────────────────────────────
  sendFiller() {
    if (this.fillerSent || !this.isGenerating) return;
    this.fillerSent = true;
    const filler = FILLER_PHRASES[Math.floor(Math.random() * FILLER_PHRASES.length)];
    this.send({ type: "filler.text", text: filler });
    log3("info", "Filler sent", { session_id: this.sessionId, filler });
    if (this.ttsSession) {
      this.ttsSession.sendText(filler + " ");
      this.ttsSession.flush();
    }
  }
  // ─── Fallback LLM ─────────────────────────────────────────────
  async fallbackGenerate(userText, history) {
    try {
      const result = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          { role: "system", content: `You are ${this.config?.personality || "Echo Prime"}, a helpful AI assistant. Keep responses short and conversational (under 200 words). Respond naturally as if speaking.` },
          ...history.slice(-4).map((h) => ({ role: h.role, content: h.content })),
          { role: "user", content: userText }
        ],
        max_tokens: 300
      });
      if (result?.response) return result.response;
    } catch {
    }
    return "I'm having trouble connecting right now. Could you try again in a moment?";
  }
  // ─── TTS Synthesis (one-shot fallback) ─────────────────────────
  async synthesizeAndSend(text, voice) {
    try {
      const { dispatch: dispatch2 } = await Promise.resolve().then(() => (init_tts_router(), tts_router_exports));
      const result = await dispatch2(this.env, { text, voice });
      const base64 = btoa(String.fromCharCode(...new Uint8Array(result.audio)));
      this.send({ type: "audio.chunk", audio: base64, index: 0 });
      this.chunksSent = 1;
    } catch (e) {
      log3("error", "TTS synthesis failed", { error: e.message, session_id: this.sessionId });
      this.sendError(`TTS synthesis failed: ${e.message}`);
    }
  }
  // ─── Interrupt (Barge-In) with AgentResponseCorrection ─────────
  async handleInterrupt() {
    this.interruptedResponseText = this.currentResponseText;
    const spokenSoFar = this.estimateSpokenText();
    if (this.fillerTimeout) {
      clearTimeout(this.fillerTimeout);
      this.fillerTimeout = null;
    }
    if (this.ttsSession) {
      this.ttsSession.interrupt();
      this.ttsSession = null;
    }
    this.audioBuffer = [];
    this.isProcessing = false;
    this.isGenerating = false;
    this.send({ type: "audio.end" });
    if (this.interruptedResponseText && spokenSoFar) {
      this.send({
        type: "response.correction",
        original: this.interruptedResponseText,
        spoken: spokenSoFar
      });
      log3("info", "Interrupt with correction", {
        session_id: this.sessionId,
        original_length: this.interruptedResponseText.length,
        spoken_length: spokenSoFar.length
      });
    }
  }
  /**
   * Estimate how much of the response was actually spoken before interrupt.
   * Based on chunks sent and average chars per chunk.
   * At ~150 WPM and ~5 chars/word, that's ~750 chars/min or ~12.5 chars/sec.
   * With progressive chunks of 120/160/250/290, avg ~200 chars per chunk.
   */
  estimateSpokenText() {
    if (this.chunksSent === 0) return "";
    const schedule = [120, 160, 250, 290];
    let estimatedChars = 0;
    for (let i = 0; i < this.chunksSent; i++) {
      estimatedChars += schedule[Math.min(i, schedule.length - 1)];
    }
    return this.currentResponseText.substring(0, estimatedChars);
  }
  // ─── Helpers ────────────────────────────────────────────────────
  send(data) {
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(data));
      }
    } catch {
    }
  }
  sendError(message) {
    this.send({ type: "error", message });
  }
  cleanup() {
    if (this.fillerTimeout) {
      clearTimeout(this.fillerTimeout);
      this.fillerTimeout = null;
    }
    if (this.ttsSession) {
      this.ttsSession.interrupt();
      this.ttsSession = null;
    }
    this.ws = null;
    this.config = null;
    this.audioBuffer = [];
    this.isProcessing = false;
    this.isGenerating = false;
  }
};
function splitForProgressiveTTS(text) {
  const schedule = [120, 160, 250, 290];
  const chunks = [];
  let remaining = text;
  let scheduleIdx = 0;
  while (remaining.length > 0) {
    const targetSize = schedule[Math.min(scheduleIdx, schedule.length - 1)];
    scheduleIdx++;
    if (remaining.length <= targetSize + 50) {
      chunks.push(remaining);
      break;
    }
    let splitAt = targetSize;
    const window = remaining.substring(0, targetSize + 80);
    const sentenceEndMatch = window.match(/[.!?]\s/g);
    if (sentenceEndMatch) {
      let lastEnd = -1;
      let searchFrom = 0;
      for (const match2 of sentenceEndMatch) {
        const idx = window.indexOf(match2, searchFrom);
        if (idx >= 0 && idx >= targetSize * 0.5) {
          lastEnd = idx + 2;
        }
        searchFrom = idx + 1;
      }
      if (lastEnd > targetSize * 0.5) {
        splitAt = lastEnd;
      }
    }
    if (splitAt === targetSize && targetSize <= 160) {
      const commaIdx = remaining.lastIndexOf(", ", targetSize + 20);
      if (commaIdx > targetSize * 0.6) {
        splitAt = commaIdx + 2;
      }
    }
    chunks.push(remaining.substring(0, splitAt));
    remaining = remaining.substring(splitAt).trimStart();
  }
  return chunks;
}
__name(splitForProgressiveTTS, "splitForProgressiveTTS");

// src/index.ts
function log4(level, message, data) {
  const entry = { ts: (/* @__PURE__ */ new Date()).toISOString(), level, worker: "echo-speak-cloud", message, ...data };
  if (level === "error") console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}
__name(log4, "log");
var app = new Hono2();
app.use("*", cors({ origin: /* @__PURE__ */ __name((o) => ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0], "origin"), allowHeaders: ["Content-Type", "Authorization", "X-Echo-API-Key"], allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] }));
var ALLOWED_ORIGINS = [
  "https://echo-ept.com",
  "https://www.echo-ept.com",
  "https://echo-op.com",
  "https://www.echo-op.com",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:8420"
];
app.use("*", async (c, next) => {
  await next();
  const origin = c.req.header("Origin") || "";
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    c.header("Access-Control-Allow-Origin", origin);
    c.header("Vary", "Origin");
  } else if (!origin) {
    c.header("Access-Control-Allow-Origin", ALLOWED_ORIGINS[0]);
  }
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, X-Echo-API-Key, Authorization");
});
app.options("*", (c) => {
  return c.body(null, 204);
});
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "1; mode=block");
  c.header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
});
var RATE_LIMIT_MAX = 60;
var RATE_LIMIT_WINDOW = 60;
app.use("*", async (c, next) => {
  if (c.req.path === "/health" || c.req.path === "/capabilities") return next();
  const ip = c.req.header("CF-Connecting-IP") || "unknown";
  const window = Math.floor(Date.now() / (RATE_LIMIT_WINDOW * 1e3));
  const key = `rate:${ip}:${window}`;
  const current = parseInt(await c.env.CACHE.get(key) || "0", 10);
  if (current >= RATE_LIMIT_MAX) {
    return c.json({ error: "Rate limit exceeded", retry_after_seconds: RATE_LIMIT_WINDOW }, 429);
  }
  await c.env.CACHE.put(key, String(current + 1), { expirationTtl: RATE_LIMIT_WINDOW * 2 });
  c.header("X-RateLimit-Remaining", String(RATE_LIMIT_MAX - current - 1));
  return next();
});
function isServiceBinding(c) {
  return !c.req.header("CF-Connecting-IP");
}
__name(isServiceBinding, "isServiceBinding");
function requireAuth(c) {
  const key = c.req.header("X-Echo-API-Key") || c.req.header("Authorization")?.replace("Bearer ", "");
  if (!key || !c.env.ECHO_API_KEY) return c.json({ error: "Unauthorized" }, 401);
  if (key.length !== c.env.ECHO_API_KEY.length) return c.json({ error: "Unauthorized" }, 401);
  let result = 0;
  for (let i = 0; i < key.length; i++) {
    result |= key.charCodeAt(i) ^ c.env.ECHO_API_KEY.charCodeAt(i);
  }
  if (result !== 0) return c.json({ error: "Unauthorized" }, 401);
  return null;
}
__name(requireAuth, "requireAuth");
function requireAuthOrBinding(c) {
  if (isServiceBinding(c)) return null;
  return requireAuth(c);
}
__name(requireAuthOrBinding, "requireAuthOrBinding");
app.get("/", (c) => c.json({ service: "echo-speak-cloud", version: "2.0.0", status: "operational" }));
app.get("/health", async (c) => {
  const [gpu, cache, genCount] = await Promise.all([
    checkGPUHealth(),
    cacheStats(c.env),
    c.env.DB.prepare("SELECT COUNT(*) as total FROM generation_history").first()
  ]);
  return c.json({
    status: "ok",
    service: "echo-speak-cloud",
    version: c.env.VERSION || "2.0.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    gpu,
    cache,
    generations: genCount?.total || 0,
    providers: { elevenlabs: !!c.env.ELEVENLABS_API_KEY, edge_tts: true, gpu_tunnel: gpu.healthy }
  });
});
app.get("/capabilities", async (c) => {
  const gpu = await checkGPUHealth();
  return c.json({
    cloud_native: ["/tts/fast", "/voices", "/presets", "/pronunciations", "/cache/*", "/stats", "/health", "/models", "/emotion-tags", "/history", "/metrics", "/dialogue/parse"],
    smart_routed: ["/tts", "/tts/stream", "/tts/chunked", "/tts/batch", "/tts/ssml", "/voices/preview", "/voices/compare", "/dialogue"],
    gpu_only: getGPUOnlyOperations(),
    gpu_status: gpu.healthy ? "online" : "offline",
    providers: ["elevenlabs", "edge_tts", "gpu"],
    emotion_tags: EMOTION_TAGS
  });
});
app.get("/models", (c) => {
  return c.json({
    elevenlabs: getModels(),
    edge_tts: [{ id: "edge_neural", name: "Edge Neural", description: "Microsoft Edge TTS (free)" }],
    gpu: [{ id: "qwen3-tts", name: "Qwen3-TTS-12Hz-0.6B", description: "Local GPU model with emotion tags" }]
  });
});
app.get("/emotion-tags", (c) => {
  return c.json({ tags: EMOTION_TAGS, count: EMOTION_TAGS.length });
});
app.get("/api-info", (c) => {
  return c.json({
    service: "echo-speak-cloud",
    version: "2.1.0",
    description: "Smart TTS cloud router for ECHO OMEGA PRIME",
    endpoints: 49,
    dispatch_tiers: ["cache", "elevenlabs", "edge_tts", "gpu_tunnel"],
    gpu_tunnel: "https://tts.echo-op.com"
  });
});
app.post("/tts", async (c) => {
  const authErr = requireAuthOrBinding(c);
  if (authErr) return authErr;
  const body = await c.req.json();
  if (!body.text) return c.json({ error: "text required" }, 400);
  const result = await dispatch(c.env, body);
  return new Response(result.audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "X-Provider": result.response.provider,
      "X-Voice": result.response.voice,
      "X-Duration-Ms": String(result.response.duration_ms),
      "X-Cached": String(result.response.cached)
    }
  });
});
app.post("/tts/json", async (c) => {
  const authErr = requireAuthOrBinding(c);
  if (authErr) return authErr;
  const body = await c.req.json();
  if (!body.text) return c.json({ error: "text required" }, 400);
  const result = await dispatch(c.env, body);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(result.audio)));
  return c.json({
    audio_base64: base64,
    ...result.response
  });
});
app.post("/tts/fast", async (c) => {
  const authErr = requireAuthOrBinding(c);
  if (authErr) return authErr;
  const body = await c.req.json();
  if (!body.text) return c.json({ error: "text required" }, 400);
  const result = await dispatchFast(c.env, body.text, body.voice);
  return new Response(result.audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "X-Provider": "edge_tts",
      "X-Duration-Ms": String(result.response.duration_ms)
    }
  });
});
app.post("/tts/stream", async (c) => {
  const authErr = requireAuthOrBinding(c);
  if (authErr) return authErr;
  const body = await c.req.json();
  if (!body.text) return c.json({ error: "text required" }, 400);
  try {
    const stream = await synthesizeStream({
      text: body.text,
      voice: body.voice || "echo",
      apiKey: c.env.ELEVENLABS_API_KEY
    });
    return new Response(stream, {
      headers: { "Content-Type": "audio/mpeg", "Transfer-Encoding": "chunked" }
    });
  } catch (e) {
    console.log(JSON.stringify({ ts: (/* @__PURE__ */ new Date()).toISOString(), worker: "echo-speak-cloud", level: "warn", message: "Streaming TTS failed, falling back", error: e?.message || String(e) }));
    const result = await dispatch(c.env, body);
    return new Response(result.audio, {
      headers: { "Content-Type": "audio/mpeg", "X-Provider": result.response.provider }
    });
  }
});
app.post("/tts/chunked", async (c) => {
  const authErr = requireAuthOrBinding(c);
  if (authErr) return authErr;
  const body = await c.req.json();
  if (!body.text) return c.json({ error: "text required" }, 400);
  const result = await dispatchChunked(c.env, body.text, body.voice, body.chunk_size);
  return new Response(result.audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "X-Chunks": String(result.chunks),
      "X-Provider": result.response.provider
    }
  });
});
app.post("/tts/batch", async (c) => {
  const authErr = requireAuth(c);
  if (authErr) return authErr;
  const body = await c.req.json();
  if (!body.items?.length) return c.json({ error: "items array required" }, 400);
  const results = await dispatchBatch(c.env, body.items);
  return c.json({ total: results.length, succeeded: results.filter((r) => r.success).length, results });
});
app.post("/tts/ssml", async (c) => {
  const authErr = requireAuthOrBinding(c);
  if (authErr) return authErr;
  const body = await c.req.json();
  if (!body.ssml) return c.json({ error: "ssml required" }, 400);
  const plainText = body.ssml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const result = await dispatch(c.env, { text: plainText, voice: body.voice });
  return new Response(result.audio, {
    headers: { "Content-Type": "audio/mpeg", "X-Provider": result.response.provider }
  });
});
app.get("/voices", async (c) => {
  const db = c.env.DB;
  const custom = await db.prepare("SELECT * FROM voices ORDER BY name").all();
  const builtIn = [
    ...Object.entries(ELEVENLABS_VOICES).map(([name, id]) => ({
      name,
      provider: "elevenlabs",
      provider_voice_id: id,
      is_cloned: ["commander", "jr", "roybean", "adam"].includes(name)
    })),
    ...Object.entries(EDGE_TTS_VOICES).map(([name, id]) => ({
      name,
      provider: "edge_tts",
      provider_voice_id: id,
      is_cloned: false
    }))
  ];
  return c.json({
    built_in: builtIn,
    custom: custom.results || [],
    total: builtIn.length + (custom.results?.length || 0),
    mappings: getVoiceMapping()
  });
});
app.post("/voices/preview", async (c) => {
  const authErr = requireAuthOrBinding(c);
  if (authErr) return authErr;
  const { voice, text } = await c.req.json();
  if (!voice) return c.json({ error: "voice required" }, 400);
  const previewText = text || `Hello, I am ${voice}. This is a voice preview for Echo Omega Prime.`;
  const result = await dispatch(c.env, { text: previewText, voice, format: "mp3" });
  return new Response(result.audio, { headers: { "Content-Type": "audio/mpeg" } });
});
app.post("/voices/compare", async (c) => {
  const authErr = requireAuthOrBinding(c);
  if (authErr) return authErr;
  const { text, voices } = await c.req.json();
  if (!text || !voices?.length) return c.json({ error: "text and voices required" }, 400);
  const results = [];
  for (const voice of voices.slice(0, 5)) {
    try {
      const result = await dispatch(c.env, { text, voice, format: "mp3" });
      const hash = await Promise.resolve().then(() => (init_types(), types_exports)).then((m) => m.textHash(text, voice));
      const key = `compare/${hash}.mp3`;
      await c.env.MEDIA.put(key, result.audio, { httpMetadata: { contentType: "audio/mpeg" } });
      results.push({ voice, success: true, provider: result.response.provider, duration_ms: result.response.duration_ms, audio_key: key });
    } catch (e) {
      results.push({ voice, success: false, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return c.json({ text: text.substring(0, 100), voices_compared: results });
});
app.post("/voices/clone", async (c) => {
  const authErr = requireAuth(c);
  if (authErr) return authErr;
  try {
    const body = await c.req.json();
    if (!body.name || !body.files?.length) return c.json({ error: "name and files[] required" }, 400);
    if (c.env.ELEVENLABS_API_KEY) {
      const result = await cloneVoice(c.env.ELEVENLABS_API_KEY, {
        name: body.name,
        description: body.description || `Custom voice clone: ${body.name}`,
        files: body.files
      });
      await postToMoltBook(c.env, `Voice cloned: "${body.name}" via ElevenLabs (${body.files.length} audio files). Voice ID: ${result.voice_id}`, "excited", ["voice", "clone", "milestone"]);
      return c.json({ success: true, voice_id: result.voice_id, name: result.name, provider: "elevenlabs" });
    }
    const gpu = await checkGPUHealth();
    if (!gpu.healthy) return c.json({ error: "No voice cloning provider available. ElevenLabs API key not set and GPU is offline." }, 503);
    const resp = await forwardToGPU("/voices/clone", "POST", void 0, { "Content-Type": "application/json" });
    return new Response(resp.body, { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "Voice cloning failed" }, 500);
  }
});
app.post("/transcribe", async (c) => {
  const gpu = await checkGPUHealth();
  if (!gpu.healthy) return c.json({ error: "GPU is offline. Transcription requires local GPU (Whisper)." }, 503);
  const resp = await forwardToGPU("/transcribe", "POST");
  return new Response(resp.body, { headers: { "Content-Type": "application/json" } });
});
app.post("/speech-to-speech", async (c) => {
  const gpu = await checkGPUHealth();
  if (!gpu.healthy) return c.json({ error: "GPU offline. S2S requires local GPU." }, 503);
  const resp = await forwardToGPU("/speech-to-speech", "POST");
  return new Response(resp.body, { headers: { "Content-Type": "application/json" } });
});
app.post("/audio-isolation", async (c) => {
  const gpu = await checkGPUHealth();
  if (!gpu.healthy) return c.json({ error: "GPU offline. Audio isolation requires Demucs on local GPU." }, 503);
  const resp = await forwardToGPU("/audio-isolation", "POST");
  return new Response(resp.body, { headers: { "Content-Type": "application/json" } });
});
app.post("/voice-design/:action", async (c) => {
  const action = c.req.param("action");
  const gpu = await checkGPUHealth();
  if (!gpu.healthy) return c.json({ error: "GPU offline." }, 503);
  const body = await c.req.json();
  const resp = await forwardToGPU(`/voice-design/${action}`, "POST", body);
  return new Response(resp.body, { headers: { "Content-Type": "application/json" } });
});
app.post("/analyze", async (c) => {
  const gpu = await checkGPUHealth();
  if (!gpu.healthy) return c.json({ error: "GPU offline." }, 503);
  const resp = await forwardToGPU("/analyze", "POST");
  return new Response(resp.body, { headers: { "Content-Type": "application/json" } });
});
app.post("/gpu/cleanup", async (c) => {
  const authErr = requireAuth(c);
  if (authErr) return authErr;
  const gpu = await checkGPUHealth();
  if (!gpu.healthy) return c.json({ error: "GPU offline." }, 503);
  const resp = await forwardToGPU("/cleanup", "POST");
  return new Response(resp.body, { headers: { "Content-Type": "application/json" } });
});
app.get("/gpu/status", async (c) => {
  const health = await checkGPUHealth();
  return c.json({ gpu: health, tunnel: "https://tts.echo-op.com" });
});
app.post("/dialogue/parse", async (c) => {
  const { text } = await c.req.json();
  if (!text) return c.json({ error: "text required" }, 400);
  const lines = parseDialogue(text);
  return c.json({ lines, count: lines.length });
});
app.post("/dialogue", async (c) => {
  const authErr = requireAuthOrBinding(c);
  if (authErr) return authErr;
  const { text, default_voice } = await c.req.json();
  if (!text) return c.json({ error: "text required" }, 400);
  const lines = parseDialogue(text);
  const audioChunks = [];
  for (const line of lines) {
    const voice = line.speaker || default_voice || "echo";
    const result = await dispatch(c.env, { text: line.text, voice, emotion: line.emotion });
    audioChunks.push(result.audio);
  }
  const totalLength = audioChunks.reduce((s, b) => s + b.byteLength, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of audioChunks) {
    combined.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }
  return new Response(combined.buffer, {
    headers: { "Content-Type": "audio/mpeg", "X-Lines": String(lines.length) }
  });
});
app.get("/presets", async (c) => {
  const r = await c.env.DB.prepare("SELECT * FROM presets ORDER BY name").all();
  return c.json({ count: r.results?.length || 0, presets: r.results || [] });
});
app.post("/presets", async (c) => {
  const authErr = requireAuth(c);
  if (authErr) return authErr;
  const body = await c.req.json();
  if (!body.name) return c.json({ error: "name required" }, 400);
  const id = generateId();
  await c.env.DB.prepare(
    `INSERT INTO presets (id, name, voice, speed, pitch, format, provider, emotion, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.name, body.voice || "echo", body.speed || 1, body.pitch || 0, body.format || "mp3", body.provider || "auto", body.emotion || null, body.is_default ? 1 : 0).run();
  return c.json({ status: "created", id }, 201);
});
app.get("/pronunciations", async (c) => {
  const r = await c.env.DB.prepare("SELECT * FROM pronunciations ORDER BY word").all();
  return c.json({ count: r.results?.length || 0, pronunciations: r.results || [] });
});
app.post("/pronunciations", async (c) => {
  const authErr = requireAuth(c);
  if (authErr) return authErr;
  const body = await c.req.json();
  if (!body.word || !body.phonetic) return c.json({ error: "word and phonetic required" }, 400);
  const id = generateId();
  await c.env.DB.prepare(
    `INSERT OR REPLACE INTO pronunciations (id, word, phonetic, language) VALUES (?, ?, ?, ?)`
  ).bind(id, body.word, body.phonetic, body.language || "en").run();
  return c.json({ status: "created", id }, 201);
});
app.get("/studio", async (c) => {
  const r = await c.env.DB.prepare("SELECT * FROM projects ORDER BY updated_at DESC").all();
  return c.json({ count: r.results?.length || 0, projects: r.results || [] });
});
app.post("/studio", async (c) => {
  const authErr = requireAuth(c);
  if (authErr) return authErr;
  const body = await c.req.json();
  if (!body.name) return c.json({ error: "name required" }, 400);
  const id = generateId();
  await c.env.DB.prepare(
    `INSERT INTO projects (id, name, description, voice, status, chapters, metadata) VALUES (?, ?, ?, ?, 'draft', 0, '{}')`
  ).bind(id, body.name, body.description || "", body.voice || "echo").run();
  return c.json({ status: "created", id }, 201);
});
app.get("/studio/:id", async (c) => {
  const id = c.req.param("id");
  const project = await c.env.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(id).first();
  if (!project) return c.json({ error: "Not found" }, 404);
  const chapters = await c.env.DB.prepare("SELECT * FROM chapters WHERE project_id = ? ORDER BY chapter_number").bind(id).all();
  return c.json({ project, chapters: chapters.results || [] });
});
app.post("/studio/:id/chapter", async (c) => {
  const authErr = requireAuth(c);
  if (authErr) return authErr;
  const projectId = c.req.param("id");
  const { text, title: title2, voice } = await c.req.json();
  if (!text) return c.json({ error: "text required" }, 400);
  const result = await dispatchChunked(c.env, text, voice || "echo");
  const chapterKey = `studio/${projectId}/${generateId()}.mp3`;
  await c.env.MEDIA.put(chapterKey, result.audio, { httpMetadata: { contentType: "audio/mpeg" } });
  await c.env.DB.prepare(`UPDATE projects SET chapters = chapters + 1, updated_at = datetime('now') WHERE id = ?`).bind(projectId).run();
  return c.json({
    status: "chapter_created",
    audio_key: chapterKey,
    chunks: result.chunks,
    provider: result.response.provider
  });
});
app.post("/studio/:id/render", async (c) => {
  const gpu = await checkGPUHealth();
  if (!gpu.healthy) return c.json({ error: "GPU offline. Full render requires local GPU." }, 503);
  const resp = await forwardToGPU(`/studio/${c.req.param("id")}/render`, "POST");
  return new Response(resp.body, { headers: { "Content-Type": "application/json" } });
});
app.get("/cache/stats", async (c) => {
  const stats = await cacheStats(c.env);
  return c.json(stats);
});
app.delete("/cache/:key", async (c) => {
  const authErr = requireAuth(c);
  if (authErr) return authErr;
  await cacheDelete(c.env, c.req.param("key"));
  return c.json({ status: "deleted" });
});
app.post("/cache/cleanup", async (c) => {
  const authErr = requireAuth(c);
  if (authErr) return authErr;
  const result = await cacheCleanup(c.env);
  return c.json({ status: "cleanup_complete", ...result });
});
app.get("/stats", async (c) => {
  const authErr = requireAuthOrBinding(c);
  if (authErr) return authErr;
  const db = c.env.DB;
  const [totals, byProvider, byVoice, cache] = await Promise.all([
    db.prepare(`SELECT COUNT(*) as total, SUM(duration_ms) as total_duration_ms, AVG(duration_ms) as avg_duration_ms FROM generation_history`).first(),
    db.prepare(`SELECT provider, COUNT(*) as count, AVG(duration_ms) as avg_ms FROM generation_history GROUP BY provider ORDER BY count DESC`).all(),
    db.prepare(`SELECT voice, COUNT(*) as count FROM generation_history GROUP BY voice ORDER BY count DESC LIMIT 10`).all(),
    cacheStats(c.env)
  ]);
  return c.json({ totals, by_provider: byProvider.results, by_voice: byVoice.results, cache, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/history", async (c) => {
  const authErr = requireAuthOrBinding(c);
  if (authErr) return authErr;
  const limit = parseInt(c.req.query("limit") || "30");
  const r = await c.env.DB.prepare("SELECT * FROM generation_history ORDER BY created_at DESC LIMIT ?").bind(limit).all();
  return c.json({ count: r.results?.length || 0, history: r.results || [] });
});
app.get("/metrics", async (c) => {
  const authErr = requireAuthOrBinding(c);
  if (authErr) return authErr;
  const db = c.env.DB;
  const [today, week, providers, usage] = await Promise.all([
    db.prepare(`SELECT COUNT(*) as count, SUM(duration_ms) as duration_ms FROM generation_history WHERE created_at >= datetime('now', '-24 hours')`).first(),
    db.prepare(`SELECT COUNT(*) as count, SUM(duration_ms) as duration_ms FROM generation_history WHERE created_at >= datetime('now', '-7 days')`).first(),
    db.prepare(`SELECT provider, COUNT(*) as count, AVG(duration_ms) as avg_ms FROM generation_history WHERE created_at >= datetime('now', '-24 hours') GROUP BY provider`).all(),
    c.env.ELEVENLABS_API_KEY ? getUsage(c.env.ELEVENLABS_API_KEY) : Promise.resolve(null)
  ]);
  return c.json({ today, week, providers_today: providers.results, elevenlabs_usage: usage });
});
app.post("/stt", async (c) => {
  const authErr = requireAuthOrBinding(c);
  if (authErr) return authErr;
  const contentType = c.req.header("Content-Type") || "";
  let audio;
  if (contentType.includes("application/json")) {
    const body = await c.req.json();
    if (!body.audio) return c.json({ error: "audio (base64) required" }, 400);
    const binaryStr = atob(body.audio);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    audio = bytes.buffer;
  } else {
    audio = await c.req.arrayBuffer();
  }
  if (audio.byteLength === 0) return c.json({ error: "Empty audio" }, 400);
  const result = await transcribe(c.env, audio, {
    language: c.req.query("language") || void 0
  });
  return c.json(result);
});
app.post("/emotion/analyze", async (c) => {
  const body = await c.req.json();
  if (!body.user_message) return c.json({ error: "user_message required" }, 400);
  const analysis = analyzeEmotion(
    body.user_message,
    body.response_text || "",
    body.history || [],
    body.personality || "echo"
  );
  return c.json(analysis);
});
app.post("/emotion/detect", async (c) => {
  const body = await c.req.json();
  if (!body.text) return c.json({ error: "text required" }, 400);
  return c.json(detectEmotion(body.text));
});
app.post("/emotion/apply-tags", async (c) => {
  const body = await c.req.json();
  if (!body.text || !body.tags) return c.json({ error: "text and tags required" }, 400);
  const tagged = applyEmotionTags(body.text, body.tags);
  return c.json({ original: body.text, tagged, tags_applied: body.tags.length });
});
app.post("/tts/orchestrate", async (c) => {
  const authErr = requireAuthOrBinding(c);
  if (authErr) return authErr;
  const body = await c.req.json();
  if (!body.text) return c.json({ error: "text required" }, 400);
  const result = await orchestrateVoice(
    body.text,
    body.voice || "echo",
    body.personality || "echo",
    body.user_message || "",
    c.env,
    { chunkSize: body.chunk_size }
  );
  if (body.return_json) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(result.audio)));
    return c.json({
      audio_base64: base64,
      chunks: result.chunks.length,
      provider_breakdown: result.provider_breakdown,
      total_chars: result.total_chars,
      el_chars_used: result.el_chars_used,
      emotion: result.emotion_analysis ? {
        user: result.emotion_analysis.user_emotion,
        response: result.emotion_analysis.response_emotion,
        trajectory: result.emotion_analysis.trajectory
      } : null,
      latency_ms: result.latency_ms
    });
  }
  return new Response(result.audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "X-Chunks": String(result.chunks.length),
      "X-Providers": JSON.stringify(result.provider_breakdown),
      "X-EL-Chars-Used": String(result.el_chars_used),
      "X-Latency-Ms": String(result.latency_ms)
    }
  });
});
app.get("/ws/conversation", async (c) => {
  const upgradeHeader = c.req.header("Upgrade");
  if (upgradeHeader !== "websocket") {
    return c.json({ error: "Expected WebSocket upgrade", usage: "Connect via WebSocket to /ws/conversation" }, 426);
  }
  const sessionId = c.req.query("session_id") || crypto.randomUUID();
  const id = c.env.VOICE_CONVERSATION.idFromName(sessionId);
  const stub = c.env.VOICE_CONVERSATION.get(id);
  return stub.fetch(new Request("https://do/ws", {
    headers: c.req.raw.headers
  }));
});
app.get("/ws/conversation/config", (c) => {
  return c.json({
    turn_eagerness_options: ["eager", "normal", "patient"],
    defaults: {
      turn_eagerness: "normal",
      filler_enabled: true,
      silence_threshold_ms: TURN_EAGERNESS_DEFAULTS,
      max_response_length: 500,
      language: "en"
    },
    models: {
      standard: "eleven_v3",
      conversational: "eleven_v3_conversational",
      cloned: "eleven_multilingual_v2"
    },
    protocol: {
      server_messages: ["audio.chunk", "audio.end", "response.start", "response.text", "response.token", "response.correction", "filler.text", "vad.score", "turn.config", "latency", "alignment", "error"],
      client_messages: ["session.start", "audio.chunk", "audio.end", "text.input", "interrupt", "turn.config", "vad.update"]
    },
    version: "2.1.0"
  });
});
app.post("/tts/conversational", async (c) => {
  const authErr = requireAuthOrBinding(c);
  if (authErr) return authErr;
  const body = await c.req.json();
  if (!body.text) return c.json({ error: "text required" }, 400);
  const model = ["commander", "jr", "roybean", "adam"].includes((body.voice || "").toLowerCase()) ? "eleven_multilingual_v2" : "eleven_v3_conversational";
  const result = await dispatch(c.env, { ...body, model });
  return new Response(result.audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "X-Provider": result.response.provider,
      "X-Model": model,
      "X-Voice": result.response.voice,
      "X-Duration-Ms": String(result.response.duration_ms)
    }
  });
});
app.get("/ws/conversation/status", async (c) => {
  const sessionId = c.req.query("session_id");
  if (!sessionId) return c.json({ error: "session_id required" }, 400);
  const id = c.env.VOICE_CONVERSATION.idFromName(sessionId);
  const stub = c.env.VOICE_CONVERSATION.get(id);
  const resp = await stub.fetch(new Request("https://do/status"));
  return new Response(resp.body, { headers: { "Content-Type": "application/json" } });
});
app.post("/text/prepare", async (c) => {
  const body = await c.req.json();
  if (!body.text) return c.json({ error: "text required" }, 400);
  const prepared = prepareTextForSpeech(body.text);
  return c.json({ original_length: body.text.length, prepared_length: prepared.length, prepared });
});
app.post("/init-schema", async (c) => {
  const authErr = requireAuth(c);
  if (authErr) return authErr;
  const statements = [
    `CREATE TABLE IF NOT EXISTS voices (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, provider TEXT NOT NULL, provider_voice_id TEXT NOT NULL, description TEXT DEFAULT '', gender TEXT DEFAULT 'neutral', language TEXT DEFAULT 'en', style TEXT DEFAULT '', is_cloned INTEGER DEFAULT 0, is_default INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS generation_history (id TEXT PRIMARY KEY, text_hash TEXT NOT NULL, text_preview TEXT, voice TEXT NOT NULL, provider TEXT NOT NULL, format TEXT DEFAULT 'mp3', duration_ms INTEGER DEFAULT 0, cache_key TEXT, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE INDEX IF NOT EXISTS idx_gen_created ON generation_history(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_gen_voice ON generation_history(voice)`,
    `CREATE INDEX IF NOT EXISTS idx_gen_provider ON generation_history(provider)`,
    `CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '', voice TEXT DEFAULT 'echo', status TEXT DEFAULT 'draft', chapters INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')), metadata TEXT DEFAULT '{}')`,
    `CREATE TABLE IF NOT EXISTS chapters (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, chapter_number INTEGER DEFAULT 0, title TEXT DEFAULT '', text TEXT NOT NULL, audio_key TEXT, voice TEXT, duration_ms INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE INDEX IF NOT EXISTS idx_chapters_project ON chapters(project_id)`,
    `CREATE TABLE IF NOT EXISTS pronunciations (id TEXT PRIMARY KEY, word TEXT NOT NULL UNIQUE, phonetic TEXT NOT NULL, language TEXT DEFAULT 'en', created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS presets (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, voice TEXT DEFAULT 'echo', speed REAL DEFAULT 1.0, pitch REAL DEFAULT 0, format TEXT DEFAULT 'mp3', provider TEXT DEFAULT 'auto', emotion TEXT, is_default INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS stats (id INTEGER PRIMARY KEY AUTOINCREMENT, period TEXT NOT NULL, provider TEXT, voice TEXT, count INTEGER DEFAULT 0, total_duration_ms INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`
  ];
  for (const sql of statements) {
    await c.env.DB.prepare(sql).run();
  }
  return c.json({ status: "schema_initialized", tables: 7, indices: 3 });
});
async function postToMoltBook(env2, content, mood, tags) {
  if (!env2.SWARM) return;
  try {
    await env2.SWARM.fetch("https://swarm/moltbook/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author_id: "echo-speak-cloud",
        author_name: "Echo Speak Cloud",
        author_type: "worker",
        content,
        mood,
        tags
      })
    });
  } catch (e) {
    console.log(JSON.stringify({ ts: (/* @__PURE__ */ new Date()).toISOString(), worker: "echo-speak-cloud", level: "warn", message: "MoltBook post failed", error: e?.message || String(e) }));
  }
}
__name(postToMoltBook, "postToMoltBook");
async function handleScheduled(event, env2) {
  log4("info", "Cron cleanup starting");
  try {
    const cleanup = await cacheCleanup(env2);
    log4("info", "Cache cleanup complete", { deleted_kv: cleanup.deleted_kv, deleted_r2: cleanup.deleted_r2 });
    const db = env2.DB;
    const providers = await db.prepare(
      `SELECT provider, voice, COUNT(*) as count, SUM(duration_ms) as total_ms
       FROM generation_history WHERE created_at >= datetime('now', '-6 hours')
       GROUP BY provider, voice`
    ).all();
    for (const row of providers.results || []) {
      const r = row;
      await db.prepare(
        `INSERT INTO stats (period, provider, voice, count, total_duration_ms) VALUES ('6h', ?, ?, ?, ?)`
      ).bind(r.provider, r.voice, r.count, r.total_ms).run();
    }
    log4("info", "Stats rollup complete", { entries: providers.results?.length || 0 });
    const genCount = await db.prepare("SELECT COUNT(*) as total FROM generation_history").first();
    await postToMoltBook(
      env2,
      `Echo Speak Cloud status: ${genCount?.total || 0} total generations. Cache cleanup: ${cleanup.deleted_kv} KV + ${cleanup.deleted_r2} R2 entries pruned. ${providers.results?.length || 0} provider stats recorded.`,
      "building",
      ["voice", "tts", "cron", "status"]
    );
    await env2.SCANNER.fetch("https://echo-343-scanner/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ worker: "echo-speak-cloud", status: "healthy", metrics: { cleanup_kv: cleanup.deleted_kv, cleanup_r2: cleanup.deleted_r2, stats_entries: providers.results?.length || 0 } })
    }).catch(() => {
    });
  } catch (e) {
    log4("error", "Cron error", { error: e.message });
    await postToMoltBook(
      env2,
      `Echo Speak Cloud cron error: ${e instanceof Error ? e.message : String(e)}`,
      "debugging",
      ["voice", "tts", "error"]
    );
    await env2.SCANNER.fetch("https://echo-343-scanner/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ worker: "echo-speak-cloud", status: "degraded", metrics: { error: String(e) } })
    }).catch(() => {
    });
  }
}
__name(handleScheduled, "handleScheduled");
app.onError((err, c) => {
  console.error(JSON.stringify({
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    level: "error",
    worker: "echo-speak-cloud",
    message: "Unhandled route error",
    path: c.req.path,
    method: c.req.method,
    error: err.message
  }));
  return c.json({
    error: "Internal server error",
    worker: "echo-speak-cloud",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  }, 500);
});
app.notFound((c) => {
  return c.json({
    error: "Not found",
    worker: "echo-speak-cloud",
    version: "2.1.0",
    routes: [
      "GET /health \u2014 Service health + provider status",
      "GET /capabilities \u2014 Available endpoints and features",
      "GET /models \u2014 Available TTS models",
      "GET /emotion-tags \u2014 Supported emotion tags",
      "GET /api-info \u2014 API documentation",
      "GET /voices \u2014 List all voice presets",
      "GET /voices/:name \u2014 Get voice details",
      "POST /voices/preview \u2014 Preview a voice",
      "POST /voices/compare \u2014 Compare multiple voices",
      "POST /voices/clone \u2014 Clone a voice (ElevenLabs)",
      "POST /tts \u2014 Generate speech (smart-routed)",
      "POST /tts/fast \u2014 Generate speech (cache-first)",
      "POST /tts/stream \u2014 Streaming TTS",
      "POST /tts/chunked \u2014 Chunked long-form TTS",
      "POST /tts/batch \u2014 Batch TTS generation",
      "POST /tts/ssml \u2014 SSML-formatted TTS",
      "POST /tts/orchestrate \u2014 Quota-aware blended TTS (v2)",
      "POST /tts/conversational \u2014 Conversational TTS with v3_conversational model (v2.1)",
      "POST /dialogue \u2014 Multi-voice dialogue",
      "POST /stt \u2014 Cloud speech-to-text (v2)",
      "POST /emotion/analyze \u2014 4-layer emotion analysis (v2)",
      "POST /emotion/detect \u2014 Quick emotion detection (v2)",
      "POST /emotion/apply-tags \u2014 Apply emotion tags to text (v2)",
      "POST /text/prepare \u2014 Prepare text for speech (v2)",
      "GET /ws/conversation \u2014 WebSocket voice conversation (v2.1 triple-streaming)",
      "GET /ws/conversation/config \u2014 Conversation config defaults (v2.1)",
      "GET /ws/conversation/status \u2014 Voice session status (v2)",
      "GET /presets \u2014 Voice presets",
      "GET /pronunciations \u2014 Custom pronunciations",
      "GET /cache/stats \u2014 Cache statistics",
      "GET /history \u2014 Generation history",
      "GET /metrics \u2014 Usage metrics",
      "GET /stats \u2014 Aggregated stats"
    ]
  }, 404);
});
var index_default = {
  fetch: app.fetch,
  scheduled: handleScheduled
};
export {
  VoiceConversation,
  index_default as default
};
