import * as vscode from "vscode";
import { ExtensionController } from "./ExtensionController";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(new ExtensionController());
}
