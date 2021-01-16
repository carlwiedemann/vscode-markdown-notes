import * as vscode from "vscode";
import { BacklinkItem } from './BacklinkItem';
import { Note } from './Note';

export class AllTagsTreeDataProvider implements vscode.TreeDataProvider<BacklinkItem> {

  onDidChangeTreeData: vscode.Event<BacklinkItem> = (new vscode.EventEmitter<BacklinkItem>()).event;

  reload(): void {
    (new vscode.EventEmitter<BacklinkItem>()).fire();
  }

  getTreeItem(element: BacklinkItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: BacklinkItem): Promise<BacklinkItem[]> {
    if (!element) {
      return Promise.resolve((await Note.getDistictTagFullTextStrings()).map((label) => {
        return new BacklinkItem(label, vscode.TreeItemCollapsibleState.Expanded);
      }));
    } else {
      return Promise.resolve([]);
    }
  }
}


