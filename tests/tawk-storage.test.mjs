import assert from "node:assert/strict";
import { test } from "node:test";
import { shouldLoadTawkWidget } from "../src/features/chat/tawk.ts";

test("a blocked localStorage means no widget, not a thrown SecurityError", () => {
  const blocked = {
    get localStorage() {
      throw new DOMException("Access is denied for this document.", "SecurityError");
    },
    sessionStorage: { setItem() {}, removeItem() {} },
  };
  globalThis.window = blocked;
  Object.defineProperty(globalThis, "navigator", {
    value: { cookieEnabled: true },
    configurable: true,
  });
  try {
    assert.equal(shouldLoadTawkWidget(), false);
  } finally {
    delete globalThis.window;
    delete globalThis.navigator;
  }
});
