import { parse, ParserOptions } from "@babel/parser";
import * as t from "@babel/types";
import { transformFromAstSync } from "@babel/core";

import traverse from "@babel/traverse";
import { ImportModule } from "./ImportModule";
import { Node } from "./types/Node";

export const parsingOptions = {
  plugins: ["typescript", "jsx"],
  sourceType: "module",
};

const codeToAst = (code: string): t.File =>
  parse(code, <ParserOptions>{
    startLine: 0,
    ...parsingOptions,
  });

export function toAst(code: string): t.File | null {
  try {
    return codeToAst(code);
  } catch (error) {
    console.error(error.message);
    return null;
  }
}

export function getAllImportNodes(ast: t.File): ImportModule[] {
  try {
    const importNodes = ast.program.body.filter((imp) => t.isImportDeclaration(imp)) as t.ImportDeclaration[];
    return importNodes.map((node) => new ImportModule(node));
  } catch (error) {
    return [];
  }
}

export function replaceImportsWith(ast: t.File, nodes: Node[]): t.File {
  traverse(ast, {
    ImportDeclaration(path) {
      path.getAllNextSiblings().forEach((x) => x.remove());
      const x: t.Node[] = nodes.map((imd) => imd.makeNode());
      path.replaceWithMultiple(x);

      path.stop();
    },
  });
  return ast;
}

export function fromAst(ast: t.File): string {
  return transformFromAstSync(ast)?.code ?? "";
}
