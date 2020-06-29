import { Node } from "./types/Node";
import { EmptyLine } from "./EmptyLine";
import { partition } from "./utils";

export class ModuleGroup {
  private _nodes: Node[] = [];
  constructor(private readonly order: number) {}

  public buildGroup(internalConfig: RegExp[]) {
    this._nodes.sort((a, b) => a.getSourceName().toLowerCase().localeCompare(b.getSourceName().toLowerCase()));
    let nodesCopy = this._nodes.slice();
    const result: Node[] = [];
    internalConfig.forEach((regexp) => {
      const [truthy, falsy] = partition<Node>(nodesCopy, (node) => regexp.test(node.getSourceName()));
      result.push(...truthy);
      nodesCopy = falsy;
    });
    result.push(...nodesCopy);
    if (result.length === 0) {
      return result;
    }
    result.push(this.getLineBreak());
    return result;
  }

  private getLineBreak() {
    return new EmptyLine();
  }

  addModule(node: Node) {
    this._nodes.push(node);
  }
}
