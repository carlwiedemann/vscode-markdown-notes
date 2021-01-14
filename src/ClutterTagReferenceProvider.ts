import * as vscode from 'vscode';
import { Note } from './Note';
import { getRefAt } from './Ref';

export class ClutterTagReferenceProvider implements vscode.ReferenceProvider {
  public provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.ProviderResult<vscode.Location[]> {
    return Note.getLocationsForRef(getRefAt(document, position));
  }
}
