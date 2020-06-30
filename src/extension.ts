import * as vscode from "vscode";
import { ExtensionController } from "./ExtensionController";
import { Config } from "./Config";

export function activate(context: vscode.ExtensionContext) {
  const config = new Config();
  context.subscriptions.push(config, new ExtensionController(config));
}
