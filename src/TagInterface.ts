import * as vscode from 'vscode';

export interface TagInterface {
  fullText: string;
  innerText: string;
  range: vscode.Range;
}