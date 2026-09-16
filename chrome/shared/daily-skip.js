/* Persist failed backend skip ids until the next local calendar day. */
(function (global) {
  const RB = (global.RewriteBetter = global.RewriteBetter || {});

  function todayString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  RB.createDailySkipStore = function (io) {
    const getToday = io && io.today != null ? () => io.today : todayString;
    const load = (io && io.load) || (() => ({}));
    const save = (io && io.save) || (() => {});

    return {
      activeSkipIds() {
        const today = getToday();
        const stored = load() || {};
        const active = {};
        Object.keys(stored).forEach((id) => {
          if (stored[id] === today) active[id] = today;
        });
        if (Object.keys(stored).some((id) => stored[id] !== today)) {
          save(active);
        }
        return new Set(Object.keys(active));
      },
      markSkipped(skipIds) {
        if (!skipIds || !skipIds.size) return;
        const today = getToday();
        const stored = {};
        Object.keys(load() || {}).forEach((id) => {
          if ((load() || {})[id] === today) stored[id] = today;
        });
        skipIds.forEach((id) => {
          stored[id] = today;
        });
        const cleaned = {};
        Object.keys(stored).forEach((id) => {
          if (stored[id] === today) cleaned[id] = today;
        });
        save(cleaned);
      },
      clearAll() {
        save({});
      }
    };
  };
})(typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : globalThis);
