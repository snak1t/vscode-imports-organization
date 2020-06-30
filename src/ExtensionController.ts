import * as vscode from "vscode";
import { toAst, getAllImportNodes, replaceImportsWith, fromAst } from "./parser";
import { sortImports, hasImportsStructureChanged } from "./SortImports";
import { File } from "@babel/types";
import { Node } from "./types/Node";
import { Config } from "./Config";

export class ExtensionController implements vscode.Disposable {
  disposable?: vscode.Disposable;

  constructor(private readonly config: Config) {
    this.disposable = vscode.workspace.onDidSaveTextDocument((textDocument: vscode.TextDocument) => {
      const textContent = textDocument.getText();
      const file = toAst(textContent);
      if (file === null) {
        return;
      }
      const importNodes = getAllImportNodes(file);
      const [shouldChangeContent, proccessedContent] = this.processImportNodes(file, importNodes);
      if (!shouldChangeContent || !proccessedContent) {
        return;
      }
      const wEdit = new vscode.WorkspaceEdit();
      const lastImportsLineOfOriginalText = importNodes[importNodes.length - 1].getLinePositions()[1];
      const range = new vscode.Range(
        new vscode.Position(0, 0),
        textDocument.lineAt(lastImportsLineOfOriginalText).range.end
      );

      let eol = textDocument.eol === 1 ? "\n" : "\r\n";
      if (textDocument.lineAt(lastImportsLineOfOriginalText + 1).isEmptyOrWhitespace) {
        eol = "";
      }
      wEdit.replace(textDocument.uri, range, proccessedContent + eol);
      vscode.workspace.applyEdit(wEdit).then(() => {
        textDocument.save();
      });
    });
  }
  processImportNodes(file: File, importNodes: Node[]): [false] | [true, string] {
    const nodes = sortImports(importNodes, this.config.getConfiguration());
    const hasChanged = hasImportsStructureChanged(importNodes, nodes);
    if (hasChanged) {
      return [true, fromAst(replaceImportsWith(file, nodes))]; // ?
    }
    return [false];
  }

  dispose() {
    this.disposable && this.disposable.dispose();
  }
}
