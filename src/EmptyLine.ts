import { Node } from "./types/Node";
import { addComment, noop, StatementNode } from "./statement.utils";

export class EmptyLine implements Node {
  getLinePositions(): [number, number] {
    return [0, 0];
  }
  getSourceName() {
    return "EmptyBlock";
  }

  makeNode(): StatementNode {
    return addComment(noop(), "leading", "TOBEDELETED");
  }
}
