import * as vscode from 'vscode';
import { TagDataSource } from "./TagDataSource";
import { Tag } from "./Tag";

export class TagReferenceProvider implements vscode.ReferenceProvider {
  public provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.ProviderResult<vscode.Location[]> {
    let tag = Tag.getTagAt(document, position);
    return tag ? TagDataSource.getAllTagLocations(tag) : [];
  }
}
