import * as t from "@babel/types";
import { Node } from "../types/Node";

export class CommonJsModule implements Node {
  constructor(private readonly statement: t.Statement) {}

  getSourceName(): string {
    if (CommonJsModule.isVariableDeclaration(this.statement)) {
      return ((this.statement.declarations[0].init as t.CallExpression).arguments[0] as any).value as string;
    }
    return "";
  }

  makeNode(): t.Node {
    if (CommonJsModule.isVariableDeclaration(this.statement)) {
      return t.variableDeclaration(this.statement.kind, this.statement.declarations);
    }
    return t.noop();
  }

  getLinePositions(): [number, number] {
    return [this.statement.loc?.start.line ?? 0, this.statement.loc?.end.line ?? 0];
  }

  private static isVariableDeclaration(inspectedStatement: t.Statement): inspectedStatement is t.VariableDeclaration {
    if (!t.isVariableDeclaration(inspectedStatement)) {
      return false;
    }
    return inspectedStatement.declarations.every((declarator) => {
      if (!t.isCallExpression(declarator.init)) {
        return false;
      }
      const name = (declarator.init.callee as any).name as string;
      return name === "require";
    });
  }

  static is(inspectedStatement: t.Statement): boolean {
    return CommonJsModule.isVariableDeclaration(inspectedStatement);
  }
}
