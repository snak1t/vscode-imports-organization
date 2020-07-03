import * as vscode from "vscode";
import { toAst, getAllImportNodes, replaceImportsWith, fromAst } from "./parser";
import { sortImports, hasImportsStructureChanged } from "./SortImports";
import { File } from "@babel/types";
import { Node } from "./types/Node";
import { Config } from "./Config";

const DISABLE_KEYWORD = "imports-organization: disable";

export class ExtensionController implements vscode.Disposable {
  disposables: vscode.Disposable[] = [];

  constructor(private readonly config: Config) {
    let onDidSaveDisposable = vscode.workspace.onDidSaveTextDocument((textDocument: vscode.TextDocument) => {
      if (this.isExtensionDisabledForDocument(textDocument)) {
        return;
      }
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
        textDocument.lineAt(lastImportsLineOfOriginalText).range.end,
      );

      let eol = this.getCurrentEOL(textDocument);
      if (textDocument.lineAt(lastImportsLineOfOriginalText + 1).isEmptyOrWhitespace) {
        eol = "";
      }
      wEdit.replace(textDocument.uri, range, proccessedContent + eol);
      vscode.workspace.applyEdit(wEdit).then(() => {
        textDocument.save();
      });
    });
    this.registerCommands();
    this.disposables.push(onDidSaveDisposable);
  }

  private getCurrentEOL(textDocument: vscode.TextDocument): string {
    return textDocument.eol === 1 ? "\n" : "\r\n";
  }

  private registerCommands(): void {
    this.disposables.push(
      vscode.commands.registerCommand("import-organizer.disable", this.disableActiveFile),
      vscode.commands.registerCommand("import-organizer.enable", this.enableActiveFile),
    );
  }

  private disableActiveFile = () => {
    const wEdit = new vscode.WorkspaceEdit();
    const textEditor = vscode.window.activeTextEditor;
    if (!textEditor) {
      return;
    }
    wEdit.insert(
      textEditor.document.uri,
      new vscode.Position(0, 0),
      `// ${DISABLE_KEYWORD}${this.getCurrentEOL(textEditor.document)}`,
    );
    vscode.workspace.applyEdit(wEdit).then(() => {
      textEditor.document.save();
    });
  };

  private enableActiveFile = () => {
    const wEdit = new vscode.WorkspaceEdit();
    const textEditor = vscode.window.activeTextEditor;
    if (!textEditor) {
      return;
    }
    for (let index = 0; index < textEditor.document.lineCount; index++) {
      const line = textEditor.document.lineAt(index).text;
      if (!line.includes(DISABLE_KEYWORD)) {
        continue;
      }
      wEdit.delete(textEditor.document.uri, new vscode.Range(index, 0, index + 1, 0));
      vscode.workspace.applyEdit(wEdit).then(() => {
        textEditor.document.save();
      });
      return;
    }
  };

  private processImportNodes(file: File, importNodes: Node[]): [false] | [true, string] {
    const nodes = sortImports(importNodes, this.config.getConfiguration(), this.config.getMixType());
    const hasChanged = hasImportsStructureChanged(importNodes, nodes);
    if (hasChanged) {
      return [true, fromAst(replaceImportsWith(file, nodes))]; // ?
    }
    return [false];
  }

  private isExtensionDisabledForDocument(textDocument: vscode.TextDocument): boolean {
    return textDocument.getText().includes(DISABLE_KEYWORD);
  }

  dispose() {
    this.disposables.forEach(x => x.dispose());
  }
}
