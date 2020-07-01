import * as t from "@babel/types";
import { Node } from "../types/Node";

const isMemberOrCallExpression = (expression: t.Expression): expression is t.MemberExpression | t.CallExpression => {
  return t.isCallExpression(expression) || t.isMemberExpression(expression);
};

const findRequireCallExpression = (expression: t.Expression | null): t.CallExpression | null => {
  if (expression === null || !isMemberOrCallExpression(expression)) {
    return null;
  }

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
    if (CommonJsModule.isStatementWithRequire(this.statement)) {
      const expression = t.isExpressionStatement(this.statement)
        ? this.statement.expression
        : this.statement.declarations[0].init;
      const node = findRequireCallExpression(expression);
      return (node?.arguments[0] as any).value as string;
    }
    return "";
  }

  makeNode(): t.Node {
    if (CommonJsModule.isStatementWithRequire(this.statement)) {
      if (t.isVariableDeclaration(this.statement)) {
        return t.variableDeclaration(this.statement.kind, this.statement.declarations);
      }
      if (t.isExpressionStatement(this.statement)) {
        return t.expressionStatement(this.statement.expression);
      }
    }
    return t.noop();
  }

  getLinePositions(): [number, number] {
    return [this.statement.loc?.start.line ?? 0, this.statement.loc?.end.line ?? 0];
  }

  private static isStatementWithRequire(
    inspectedStatement: t.Statement,
  ): inspectedStatement is t.VariableDeclaration | t.ExpressionStatement {
    if (t.isVariableDeclaration(inspectedStatement)) {
      return inspectedStatement.declarations.every(declarator => {
        const expression = declarator.init;
        return findRequireCallExpression(expression) !== null;
      });
    }
    if (t.isExpressionStatement(inspectedStatement)) {
      const expression = inspectedStatement.expression;
      return findRequireCallExpression(expression) !== null;
    }
    return false;
  }

  static is(inspectedStatement: t.Statement): boolean {
    return CommonJsModule.isStatementWithRequire(inspectedStatement);
  }
}
