const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load() {
  const context = { RewriteBetter: undefined, window: undefined, self: undefined };
  context.globalThis = context;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'panel.js'), 'utf8'), context);
  return context.RewriteBetter;
}

const RB = load();

function fakeChip(active) {
  const classes = new Set(active ? ['is-active'] : []);
  return {
    classList: {
      toggle(name, on) {
        if (on) classes.add(name);
        else classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      }
    }
  };
}

const chips = [fakeChip(true), fakeChip(false), fakeChip(false)];
const container = {
  querySelectorAll(selector) {
    assert.strictEqual(selector, '[data-variant]');
    return chips;
  }
};

assert.strictEqual(RB.selectExistingVariantChip(container, 3, 1), true);
assert.ok(!chips[0].classList.contains('is-active'));
assert.ok(chips[1].classList.contains('is-active'));
assert.ok(!chips[2].classList.contains('is-active'));
assert.strictEqual(RB.selectExistingVariantChip(container, 2, 1), false);

const popup = {
  contains(node) {
    return node === liveButton;
  }
};
const liveButton = {};
const detachedButton = {};

assert.ok(
  RB.isEventInside(popup, {
    target: liveButton,
    composedPath() {
      return [liveButton, popup];
    }
  })
);

assert.ok(
  RB.isEventInside(popup, {
    target: detachedButton,
    composedPath() {
      return [detachedButton, popup];
    }
  }),
  'clicking a variant chip that is replaced during the click must still count as inside the panel'
);

assert.ok(
  !RB.isEventInside(popup, {
    target: detachedButton,
    composedPath() {
      return [detachedButton];
    }
  })
);

function createNode() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, fn, opts) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push({ fn, opts });
    },
    removeEventListener(type, fn) {
      listeners.set(
        type,
        (listeners.get(type) || []).filter((item) => item.fn !== fn)
      );
    }
  };
}

const shell = createNode();
shell.contains = (node) => node === liveButton;
const host = createNode();
let dismissed = 0;
const unbind = RB.guardPanelInteractions(shell, () => {
  dismissed += 1;
}, { eventTarget: host });

const pointerDown = (host.listeners.get('pointerdown') || [])[0];
assert.ok(pointerDown, 'outside dismiss must listen for pointerdown');
assert.ok(pointerDown.opts === true || (pointerDown.opts && pointerDown.opts.capture));

pointerDown.fn({
  target: liveButton,
  composedPath() {
    return [liveButton, shell];
  }
});
assert.strictEqual(dismissed, 0, 'pointerdown inside the panel must not close it');

pointerDown.fn({
  target: detachedButton,
  composedPath() {
    return [detachedButton, shell];
  }
});
assert.strictEqual(dismissed, 0, 'rebuilt inside controls must not close the panel');

pointerDown.fn({
  target: detachedButton,
  composedPath() {
    return [detachedButton];
  }
});
assert.strictEqual(dismissed, 1, 'pointerdown outside the panel still closes it');

let stopped = false;
(shell.listeners.get('click') || [])[0].fn({
  stopPropagation() {
    stopped = true;
  }
});
assert.ok(stopped, 'panel clicks must not bubble to the page');

unbind();
assert.strictEqual((host.listeners.get('pointerdown') || []).length, 0);

let focused = null;
let focusOpts = null;
const fallback = {
  focus(opts) {
    focused = 'fallback';
    focusOpts = opts;
  }
};
const panelRoot = {
  contains(node) {
    return node === liveButton;
  },
  ownerDocument: { activeElement: liveButton }
};
assert.strictEqual(RB.retainFocusIn(panelRoot, fallback), false);
panelRoot.ownerDocument = { activeElement: detachedButton };
assert.strictEqual(RB.retainFocusIn(panelRoot, fallback), true);
assert.strictEqual(focused, 'fallback');
assert.strictEqual(focusOpts && focusOpts.preventScroll, true);

const clamped = RB.clampFixedPosition(
  { left: 80, top: 2400, width: 720, height: 720 },
  { width: 1280, height: 800 }
);
assert.strictEqual(clamped.left, 80);
assert.ok(clamped.top + 720 <= 800, 'tall panel must stay inside the viewport');
assert.ok(clamped.top >= 8);

const leftClamped = RB.clampFixedPosition(
  { left: 2000, top: 40, width: 720, height: 480 },
  { width: 1280, height: 800 }
);
assert.ok(leftClamped.left + 720 <= 1280);

const bottomFit = RB.fitFixedPopup({
  width: 720,
  height: 560,
  left: 200,
  anchorX: 200,
  anchorY: 740,
  viewport: { width: 1440, height: 800 }
});
assert.ok(bottomFit.top >= 8, 'panel near page bottom must move up');
assert.ok(bottomFit.top + bottomFit.height <= 792, 'panel must stay in the viewport');
assert.ok(bottomFit.maxHeight >= 400, 'enough height to show result and changes');

const tallFit = RB.fitFixedPopup({
  width: 720,
  height: 900,
  left: 80,
  anchorX: 80,
  anchorY: 760,
  viewport: { width: 1280, height: 800 }
});
assert.ok(tallFit.constrain, 'oversized content must constrain height so the panel can scroll');
assert.ok(tallFit.top + tallFit.maxHeight <= 792);
assert.ok(tallFit.top >= 8);

console.log('ok — panel interactions stay inside; only outside pointerdown dismisses');
