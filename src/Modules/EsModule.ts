import * as t from "@babel/types";
import { Node } from "../types/Node";

export class EsModule implements Node {
  constructor(private readonly importDeclarationNode: t.ImportDeclaration) {}

  getSourceName(): string {
    return this.importDeclarationNode.source.value;
  }

  makeNode(): t.Node {
    return t.importDeclaration(this.importDeclarationNode.specifiers, this.importDeclarationNode.source);
  }

  getLinePositions(): [number, number] {
    return [this.importDeclarationNode.loc?.start.line ?? 0, this.importDeclarationNode.loc?.end.line ?? 0];
  }

  static is(inspectedStatement: t.Statement): inspectedStatement is t.ImportDeclaration {
    return t.isImportDeclaration(inspectedStatement);
  }
}
