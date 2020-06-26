import * as t from "@babel/types";

export interface Node {
  getSourceName(): string;
  makeNode(): t.Node;
}
