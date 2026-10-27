import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isUnactionableClientError,
  isClientNetworkFailure,
} from "../src/lib/thirdPartyErrors.ts";

const noise = [
  ["Firefox iOS reader", { type: "TypeError", value: "undefined is not an object (evaluating 'window.__firefox__.reader')" }],
  ["Firefox iOS missing global", { type: "ReferenceError", value: "Can't find variable: __firefox__" }],
  ["Chrome offline", { type: "TypeError", value: "Failed to fetch" }],
  ["Safari offline", { type: "TypeError", value: "Load failed" }],
  ["Safari offline, naming the host", { type: "TypeError", value: "Load failed (img.dawahnigeria.com)" }],
  ["Opera offline", { type: "TypeError", value: "network error" }],
  [
    "MetaMask's in-page script",
    {
      type: "Error",
      value: "MetaMask extension not found",
      stacktrace: { frames: [{ filename: "app:///scripts/inpage.js" }] },
    },
  ],
  ["stale action", { type: "UnrecognizedActionError", value: 'Server Action "6" was not found on the server.' }],
  [
    "React $RS on a rewritten DOM",
    {
      type: "TypeError",
      value: "Cannot read properties of null (reading 'parentNode')",
      stacktrace: { frames: [{ function: "$RS" }, { function: "?" }] },
    },
  ],
];

for (const [name, exception] of noise) {
  test(`drops ${name}`, () => assert.equal(isUnactionableClientError(exception), true));
}

const real = [
  ["parentNode in app code", { type: "TypeError", value: "Cannot read properties of null (reading 'parentNode')", stacktrace: { frames: [{ function: "removeRow" }] } }],
  ["parentNode with no frames", { type: "TypeError", value: "Cannot read properties of null (reading 'parentNode')" }],
  ["other TypeError", { type: "TypeError", value: "x is not a function" }],
  ["fetch message on a non-TypeError", { type: "Error", value: "Failed to fetch" }],
  ["longer fetch message", { type: "TypeError", value: "Failed to fetch dynamically imported module" }],
  ["Load failed with more than a host", { type: "TypeError", value: "Load failed (chunk 4017 could not be parsed)" }],
];

for (const [name, exception] of real) {
  test(`keeps ${name}`, () => assert.equal(isUnactionableClientError(exception), false));
}

test("undefined exception is kept", () => {
  assert.equal(isClientNetworkFailure(undefined), false);
});
