import * as vscode from "vscode";
import { ExtensionController } from "./ExtensionController";
import { Folding } from "./Folding";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(new ExtensionController(), new Folding());
}
