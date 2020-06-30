import { ModuleGroup } from "./ModuleGroup";
import { Node } from "./types/Node";
import { ConfigEntry } from "./Config";
import { EmptyLine } from "./EmptyLine";

export function sortImports(nodes: Node[], config: ConfigEntry[]): Node[] {
  const moduleGroups = Array.from({ length: config.length }, (_v, i) => {
    return new ModuleGroup(i + 1);
  });
  nodes.forEach((node) => {
    const name = node.getSourceName();
    const configEntry = config.find(({ test }) => test(name));
    const order = configEntry?.order || moduleGroups.length;
    moduleGroups[order - 1].addModule(node);
  });
  let finalModules: Node[] = [];
  moduleGroups.forEach((group, index) => {
    const cfg = config.find((cfg) => cfg.order === index + 1);
    finalModules.push(...group.buildGroup(cfg?.internalOrder ?? []));
  });
  return finalModules;
}

export function hasImportsStructureChanged(initial: Node[], current: Node[]): boolean {
  const currentImportNodes = current.filter((node) => !(node instanceof EmptyLine)) as Node[];
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
