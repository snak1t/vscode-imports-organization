import * as vscode from "vscode";
import { Disposable } from "vscode";

export interface FoldingDelegate {
  getFoldingRange(): vscode.Range | null;
}

export class Folding implements Disposable {
  editor?: vscode.TextEditor = vscode.window.activeTextEditor;

  disposables: Disposable[] = [];

  delegate: FoldingDelegate;

  constructor({ useDelegate }: { useDelegate: FoldingDelegate }) {
    this.delegate = useDelegate;
    this.disposables.push(
      vscode.languages.registerFoldingRangeProvider(
        ["javascript", "typescript", "javascriptreact", "typescriptreact"],
        {
          provideFoldingRanges: () => {
            const range = this.delegate.getFoldingRange();
            if (range === null) {
              return [];
            }
            return [new vscode.FoldingRange(range.start.line, range.end.line, vscode.FoldingRangeKind.Imports)];
          },
        },
      ),
    );
  }

  dispose() {
    this.disposables.forEach(d => d.dispose());
  }
}
