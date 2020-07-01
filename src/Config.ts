import * as vscode from "vscode";
import { Disposable } from "vscode";

export type ConfigEntryTestFn = (source: string) => boolean;

export type ConfigEntry = {
  order: number;
  test: ConfigEntryTestFn;
  internalOrder?: ConfigEntryTestFn[];
};

const coreModules = require("module").builtinModules as string[];

const configKeywordMap: Map<string, ConfigEntryTestFn> = new Map([
  ["core", source => coreModules.includes(source)],
  ["package", source => /^[\\@a-zA-Z]+/.test(source)],
  ["parent", source => /^(\.\.\/)/.test(source)],
  ["sibling", source => /^(\.\/)/.test(source)],
  ["all", source => /.*/.test(source)],
  [
    "style",
    source =>
      !!["css", "scss", "sass", "less", "styl"].find(styleExtension => source.toLowerCase().endsWith(styleExtension)),
  ],
  [
    "image",
    source =>
      !!["jpg", "jpeg", "png", "gif", "svg", "webp"].find(styleExtension =>
        source.toLowerCase().endsWith(styleExtension),
      ),
  ],
]);

export class Config implements Disposable {
  private _config: ConfigEntry[] = [];
  private disposable?: Disposable;
  constructor() {
    this.parseConfig();
    this.disposable = vscode.workspace.onDidChangeConfiguration(() => {
      this.parseConfig();
    });
  }

  parseConfig() {
    try {
      const config = vscode.workspace.getConfiguration("import-organizer").get("sortOrder") as any[];
      this._config = config.map(entry => {
        return {
          order: entry.order ?? config.length,
          test: this.createTestFn(entry.test),
          internalOrder: entry.internalOrder?.map((item: string) => {
            return this.createTestFn(item);
          }),
        };
      });
    } catch (error) {}
  }

  dispose() {
    this.disposable && this.disposable.dispose();
  }

  createTestFn(pattern: string): ConfigEntryTestFn {
    if (configKeywordMap.has(pattern)) {
      return configKeywordMap.get(pattern)!;
    }
    return (source: string) => new RegExp(pattern).test(source);
  }

  getConfiguration(): ConfigEntry[] {
    return this._config;
  }
}
