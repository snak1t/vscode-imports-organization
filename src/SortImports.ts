import { isModuleNode } from "./Modules";
import { ModuleGroup } from "./ModuleGroup";
import { Node } from "./types/Node";
import { toAst, getAllImportNodes, replaceImportsWith, fromAst } from "./parser";

const config = [
  {
    order: 1,
    test: /^[\@a-zA-Z]+/,
    internal: [/^react$/, /^@.+/, /^react/],
  },
  {
    order: 4,
    test: /^\.[a-zA-Z]+$/,
    internal: [/\.[^css]+$/, /(css | less | styl | scss | sass)$/],
  },
  {
    order: 2,
    test: /^(\.\.\/)/,
  },
  {
    order: 3,
    test: /^\.\//,
  },
  {
    test: /.*/,
  },
];

export function sortImports(nodes: Node[]): Node[] {
  const moduleGroups = Array.from({ length: config.length }, (_v, i) => {
    return new ModuleGroup(i + 1);
  });
  nodes.forEach((node) => {
    const name = node.getSourceName();
    const configEntry = config.find(({ test }) => test.test(name));
    const order = configEntry?.order || moduleGroups.length;
    moduleGroups[order - 1].addModule(node);
  });
  let finalModules: Node[] = [];
  moduleGroups.forEach((group, index) => {
    const cfg = config.find((cfg) => cfg.order === index + 1);
    finalModules.push(...group.buildGroup(cfg?.internal ?? []));
  });
  return finalModules;
}

export function hasImportsStructureChanged(initial: Node[], current: Node[]): boolean {
  const currentImportNodes = current.filter(isModuleNode) as Node[];
  if (currentImportNodes.length !== initial.length) {
    throw new Error("Change of length in import modules");
  }
  for (let index = 0; index < initial.length; index++) {
    const initialElement = initial[index];
    const currentElement = currentImportNodes[index];
    if (initialElement.getSourceName() !== currentElement.getSourceName()) {
      return true;
    }
  }
  return false;
}

function fullProcess(code: string): string {
  let ast = toAst(code);
  const nodes = sortImports(getAllImportNodes(ast!));
  return fromAst(replaceImportsWith(ast!, nodes));
}

fullProcess(`
const React = require('react');
const {
  set,
  get,
  post
} = require('./util');
const x = 1;
import Picture from '../../images/pic.png';
const {Button} = require('./Button');
const MyC = () => {
  return <Button>hello</Button>;
};
`); // ?

// fullProcess(`
// import React from 'react';
// import {
//   set,
//   get,
//   post
// } from './util';
// const x = 1;
// import Picture from '../../images/pic.png';
// import {Button} from './Button';
// const MyC = () => {
//   return <Button>hello</Button>;
// };
// `); // ?
