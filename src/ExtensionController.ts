import * as vscode from "vscode";
import { toAst, getAllImportNodes, replaceImportsWith, fromAst } from "./parser";
import { sortImports as groupNodes, hasImportsStructureChanged } from "./SortImports";
import { ImportModule } from "./ImportModule";
import { File } from "@babel/types";

export class ExtensionController implements vscode.Disposable {
  disposable?: vscode.Disposable;

  constructor() {
    this.disposable = vscode.workspace.onDidSaveTextDocument((textDocument: vscode.TextDocument) => {
      const textContent = textDocument.getText();
      const file = this.prepareCodeSource(textContent);
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

  prepareCodeSource(code: string): File | null {
    return toAst(code);
  }

  processImportNodes(file: File, importNodes: ImportModule[]): [false] | [true, string] {
    const nodes = groupNodes(importNodes);
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
