import * as vscode from "vscode";

export type ConfigEntryTestFn = (source: string) => boolean;

export type ConfigEntry = {
  order: number;
  test: ConfigEntryTestFn;
  internalOrder?: ConfigEntryTestFn[];
};

export type ModulesMixType = "mixed" | "es_to_top";

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

export class Config implements vscode.Disposable {
  private _config: ConfigEntry[] = [];
  private disposable?: vscode.Disposable;
  private _mixType: ModulesMixType = "mixed";
  public isFormatOnSaveEnabled: boolean = false;

  constructor() {
    this.parseConfig();
    this.disposable = vscode.workspace.onDidChangeConfiguration(() => {
      this.parseConfig();
    });
  }

  parseConfig() {
    try {
      const configModule = vscode.workspace.getConfiguration("import-organizer");
      const config = configModule.get("sortOrder") as any[];
      this._mixType = configModule.get("mixType") as ModulesMixType;
      this.isFormatOnSaveEnabled = vscode.workspace.getConfiguration("editor").get("formatOnSave") as boolean;
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

  public getMixType(): ModulesMixType {
    return this._mixType;
  }
}
