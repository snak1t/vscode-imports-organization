import { ImportModule } from "./ImportModule";
import { ModuleGroup } from "./ModuleGroup";
import { Node } from "./types/Node";

const config = [
  {
    order: 1,
    test: /^[\@a-zA-Z]+/,
    internal: [/^react$/, /^@.+/, /^react/],
  },
  {
    order: 4,
    test: /\.[a-zA-Z]+$/,
    internal: [/\.[^css]+$/, /(css | less | styl | scss | sass)$/],
  },
  {
    order: 3,
    test: /^\.\//,
  },
  {
    order: 2,
    test: /^\.\.\//,
  },
  {
    test: /.*/,
  },
];

export function sortImports(nodes: ImportModule[]): Node[] {
  const moduleGroups = Array.from({ length: config.length }, (_v, i) => {
    return new ModuleGroup(i + 1);
  });
  nodes.forEach((node) => {
    const configEntry = config.find(({ test }) => test.test(node.getSourceName()));
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

export function hasImportsStructureChanged(initial: ImportModule[], current: Node[]): boolean {
  const currentImportNodes = current.filter((node) => node instanceof ImportModule) as ImportModule[];
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
