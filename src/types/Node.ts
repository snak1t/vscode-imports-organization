import * as t from "../statement.utils";

export interface Node {
  getSourceName(): string;
  makeNode(): t.StatementNode;
  getLinePositions(): [number, number];
}
