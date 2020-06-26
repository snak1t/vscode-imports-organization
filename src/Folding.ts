import * as vscode from "vscode";
import { Disposable } from "vscode";

export class Folding implements Disposable {
  editor?: vscode.TextEditor = vscode.window.activeTextEditor;

  disposables: Disposable[] = [];

  constructor() {
    if (this.editor) {
      this.foldImports();
    }

    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        this.editor = editor;
        this.foldImports();
      })
    );
  }

  foldImports() {
    vscode.commands.executeCommand("editor.fold", {
      levels: 1,
      direction: "up",
      selectionLines: [0],
    });
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}
