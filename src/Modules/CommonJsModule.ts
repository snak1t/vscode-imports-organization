import * as t from "@babel/types";
import { Node } from "../types/Node";

const isMemberOrCallExpression = (expression: t.Expression): expression is t.MemberExpression | t.CallExpression => {
  return t.isCallExpression(expression) || t.isMemberExpression(expression);
};

const findRequireCallExpression = (declarator: t.VariableDeclarator): t.CallExpression | null => {
  if (declarator.init === null || !isMemberOrCallExpression(declarator.init)) {
    return null;
  }
  let expression = declarator.init;
  while (true) {
    if (t.isMemberExpression(expression) && isMemberOrCallExpression(expression.object)) {
      expression = expression.object;
    } else if (t.isCallExpression(expression)) {
      if (isMemberOrCallExpression(expression.callee as t.Expression)) {
        expression = expression.callee as t.MemberExpression | t.CallExpression;
      } else if (t.isIdentifier(expression.callee) && expression.callee.name === "require") {
        return expression;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }
};

export class CommonJsModule implements Node {
  constructor(private readonly statement: t.Statement) {}

  getSourceName(): string {
    if (CommonJsModule.isVariableDeclaration(this.statement)) {
      const node = findRequireCallExpression(this.statement.declarations[0]);
      return (node?.arguments[0] as any).value as string;
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
      return findRequireCallExpression(declarator) !== null;
    });
  }

  static is(inspectedStatement: t.Statement): boolean {
    return CommonJsModule.isVariableDeclaration(inspectedStatement);
  }
}
