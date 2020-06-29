import * as t from "@babel/types";
import { Node } from "./types/Node";

export class EmptyLine implements Node {
  getLinePositions(): [number, number] {
    return [0, 0];
  }
  getSourceName() {
    return "EmptyBlock";
  }

  makeNode(): t.Node {
    return t.addComment(t.noop(), "leading", "TOBEDELETED");
  }
}
