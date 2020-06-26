import * as t from "@babel/types";
import { Node } from "./types/Node";

export class EmptyLine implements Node {
  getSourceName() {
    return "EmptyBlock";
  }

  makeNode(): t.Node {
    return t.noop();
  }

  getType(): "Module" | "LineBreak" {
    return "LineBreak";
  }
}
