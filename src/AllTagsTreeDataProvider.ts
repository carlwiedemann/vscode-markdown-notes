import * as vscode from "vscode";
import { TagTreeItem } from './TagTreeItem';
import { TagDataSource } from "./TagDataSource";

export class AllTagsTreeDataProvider implements vscode.TreeDataProvider<TagTreeItem> {

  private eventEmitter: vscode.EventEmitter<void> = (new vscode.EventEmitter<void>());

  onDidChangeTreeData: vscode.Event<void> = this.eventEmitter.event;

  reload(): void {
    this.eventEmitter.fire();
  }

  getTreeItem(element: TagTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TagTreeItem): Promise<TagTreeItem[]> {
    if (!element) {
      return Promise.resolve((await TagDataSource.getDistinctTagFullTextStrings()).map((label) => {
        return new TagTreeItem(label, vscode.TreeItemCollapsibleState.Expanded);
      }));
    } else {
      return Promise.resolve([]);
    }
  }
}


