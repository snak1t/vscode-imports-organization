import * as vscode from "vscode";

import { Config } from "./Config";
import { ExtensionController } from "./ExtensionController";

export function activate(context: vscode.ExtensionContext) {
  const config = new Config();
  context.subscriptions.push(config, new ExtensionController(config));
}
