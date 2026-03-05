;"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

  // src/lib/fragments/collector.ts
  function defaultGlobalKey(name, targetFunction) {
    const base = targetFunction ?? name;
    const cap = base.charAt(0).toUpperCase() + base.slice(1);
    return `__ref${cap}Collector`;
  }
  __name(defaultGlobalKey, "defaultGlobalKey");
  function createFragmentCollector(config) {
    const {
      name,
      targetFunction,
      globalKey = defaultGlobalKey(name, targetFunction),
      logLabel = `fragments:${name}`,
      transform
    } = config;
    function collect(fragment) {
      const collector = globalThis[globalKey];
      if (Array.isArray(collector)) {
        collector.push(fragment);
      }
    }
    __name(collect, "collect");
    function init() {
      ;
      globalThis[globalKey] = [];
    }
    __name(init, "init");
    function getFragments() {
      const collector = globalThis[globalKey];
      if (!Array.isArray(collector)) {
        return [];
      }
      const fragments = [...collector];
      if (transform) {
        return fragments.map(transform);
      }
      return fragments;
    }
    __name(getFragments, "getFragments");
    function cleanup() {
      delete globalThis[globalKey];
    }
    __name(cleanup, "cleanup");
    function toScript() {
      return `globalThis['${globalKey}'] = []`;
    }
    __name(toScript, "toScript");
    function toGetter() {
      const transformCode = transform ? `fragments.map(${transform.toString()})` : "fragments";
      return `(function() { const fragments = globalThis['${globalKey}'] ?? []; return ${transformCode}; })()`;
    }
    __name(toGetter, "toGetter");
    const configObj = { name, globalKey, logLabel, targetFunction, transform };
    const collectorFn = Object.assign(collect, {
      config: configObj,
      collect,
      init,
      getFragments,
      cleanup,
      toScript,
      toGetter
    });
    return collectorFn;
  }
  __name(createFragmentCollector, "createFragmentCollector");

  // src/system/api/tokens.ts
  var tokensCollector = createFragmentCollector({
    name: "tokens",
    targetFunction: "tokens",
    transform: /* @__PURE__ */ __name((tokenConfig) => ({
      theme: {
        tokens: tokenConfig
      }
    }), "transform")
  });
  var tokens = tokensCollector.collect;

  // src/system/internal/tokens.ts
  tokens({
    colors: {
      mySpecialToken: { value: "red" },
      brand: {
        primary: { value: "#0066cc" },
        secondary: { value: "#ff6600" }
      }
    },
    spacing: {
      r: { value: "1rem" },
      sm: { value: "0.5rem" },
      md: { value: "1rem" },
      lg: { value: "1.5rem" }
    }
  });
})();
