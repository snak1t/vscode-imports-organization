import * as vscode from "vscode";
import { Disposable } from "vscode";

export type ConfigEntry = {
  order: number;
  test: RegExp;
  internalOrder?: RegExp[];
};

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
      this._config = config.map((entry) => {
        return {
          order: entry.order ?? config.length,
          test: new RegExp(entry.test),
          internalOrder: entry.internalOrder?.map((item: string) => {
            return new RegExp(item);
          }),
        };
      });
    } catch (error) {}
  }

  dispose() {
    this.disposable && this.disposable.dispose();
  }

  getConfiguration(): ConfigEntry[] {
    return this._config;
  }
}
