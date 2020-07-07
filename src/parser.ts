import { parse, ParserOptions } from "@babel/parser";
import { transformFromAstSync } from "@babel/core";

import traverse from "@babel/traverse";
import { createNode, isModuleStatement } from "./Modules";
import { Node } from "./types/Node";
import { File, StatementNode } from "./statement.utils";

export const parsingOptions = {
  plugins: ["typescript", "jsx"],
  sourceType: "module",
};

const codeToAst = (code: string): File =>
  parse(code, <ParserOptions>{
    startLine: 0,
    ...parsingOptions,
  });

export function toAst(code: string): File | null {
  try {
    return codeToAst(code);
  } catch (error) {
    return null;
  }
}

export function getAllImportNodes(ast: File): Node[] {
  try {
    return ast.program.body.reduce((importModules, statement) => {
      const node = createNode(statement);
      if (node) {
        importModules.push(node);
      }
      return importModules;
    }, [] as Node[]);
  } catch (error) {
    return [];
  }
}

export function replaceImportsWith(ast: File, nodes: Node[]): File {
  traverse(ast, {
    enter(path) {
      if (isModuleStatement(path.node)) {
        // remove all next siblings (on the same level)
        // all previous elements will remain as is
        // like comments, esling disable statement or etc.
        path.getAllNextSiblings().forEach(x => x.remove());
        const x: StatementNode[] = nodes.map(imd => imd.makeNode());
        path.replaceWithMultiple(x);
        path.stop();
      }
    },
  });
  return ast;
}

export function fromAst(ast: File, initialCode: string): string {
  const code = transformFromAstSync(ast, initialCode)?.code ?? "";
  return code
    .split("\n")
    .filter(x => x.trim() !== "")
    .map(x => (x.trim() === "/*TOBEDELETED*/" ? "" : x))
    .join("\n");
}
