import * as vscode from 'vscode';
import { getRefAt } from './Ref';
import {TagDataSource} from "./TagDataSource";

export class ClutterTagReferenceProvider implements vscode.ReferenceProvider {
  public provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.ProviderResult<vscode.Location[]> {
    return TagDataSource.getAllRefLocations(getRefAt(document, position));
  }
}
