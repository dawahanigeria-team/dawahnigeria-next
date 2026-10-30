import assert from "node:assert/strict";
import { test } from "node:test";
import { makeTranslationSafe } from "../src/lib/translationSafeDom.ts";

function fakeDom() {
  const proto = {
    removeChild(child) {
      if (child.parentNode !== this) throw new Error("NotFoundError");
      this.children = this.children.filter((c) => c !== child);
      child.parentNode = null;
      return child;
    },
    insertBefore(node, reference) {
      if (reference && reference.parentNode !== this) throw new Error("NotFoundError");
      const at = reference ? this.children.indexOf(reference) : this.children.length;
      this.children.splice(at, 0, node);
      node.parentNode = this;
      return node;
    },
  };
  const el = () => Object.assign(Object.create(proto), { children: [], parentNode: null });
  return { proto, el };
}

test("unpatched DOM throws when translation moved the node", () => {
  const { el } = fakeDom();
  const parent = el();
  const text = { parentNode: el() };
  assert.throws(() => parent.removeChild(text), /NotFoundError/);
});

test("removeChild of a node under another parent is skipped", () => {
  const { proto, el } = fakeDom();
  makeTranslationSafe(proto);
  const parent = el();
  const wrapper = el();
  const text = { parentNode: wrapper };
  assert.equal(parent.removeChild(text), text);
  assert.equal(text.parentNode, wrapper);
});

test("removeChild of a real child still removes it", () => {
  const { proto, el } = fakeDom();
  makeTranslationSafe(proto);
  const parent = el();
  const child = { parentNode: null };
  parent.insertBefore(child, null);
  parent.removeChild(child);
  assert.deepEqual(parent.children, []);
});

test("insertBefore with a moved reference appends instead of throwing", () => {
  const { proto, el } = fakeDom();
  makeTranslationSafe(proto);
  const parent = el();
  const first = { parentNode: null };
  parent.insertBefore(first, null);
  const moved = { parentNode: el() };
  const added = { parentNode: null };
  parent.insertBefore(added, moved);
  assert.deepEqual(parent.children, [first, added]);
});

test("insertBefore with a real reference keeps order", () => {
  const { proto, el } = fakeDom();
  makeTranslationSafe(proto);
  const parent = el();
  const a = { parentNode: null };
  const b = { parentNode: null };
  parent.insertBefore(a, null);
  parent.insertBefore(b, a);
  assert.deepEqual(parent.children, [b, a]);
});
