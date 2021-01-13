import * as vscode from 'vscode';
import { NoteParser } from './NoteParser';
import { getRefAt } from './Ref';

export class MarkdownReferenceProvider implements vscode.ReferenceProvider {
  public provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.ReferenceContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Location[]> {
    return NoteParser.search(getRefAt(document, position));
  }
}
