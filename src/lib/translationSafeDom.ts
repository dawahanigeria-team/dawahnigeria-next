/**
 * Browser translation (Google Translate, Edge) wraps every text node in a
 * `<font>` element. React still holds the original text node, so its next
 * `removeChild` or `insertBefore` names a node whose parent is now the `<font>`
 * and the DOM throws NotFoundError. React has no recovery, the route crashes,
 * and the page is left blank for the reader who translated it.
 * https://github.com/facebook/react/issues/11538
 *
 * A removeChild on a node that is not ours is skipped, since there is nothing
 * of React's to remove. An insertBefore whose reference moved is appended
 * instead, so new content still renders.
 */
type DomMethods = {
  removeChild: (child: Node) => Node;
  insertBefore: (node: Node, reference: Node | null) => Node;
};

export function makeTranslationSafe(proto: DomMethods): void {
  const { removeChild, insertBefore } = proto;

  proto.removeChild = function (this: Node, child: Node) {
    if (child.parentNode !== this) return child;
    return removeChild.call(this, child);
  };

  proto.insertBefore = function (
    this: Node,
    node: Node,
    reference: Node | null,
  ) {
    if (reference && reference.parentNode !== this) {
      return insertBefore.call(this, node, null);
    }
    return insertBefore.call(this, node, reference);
  };
}
