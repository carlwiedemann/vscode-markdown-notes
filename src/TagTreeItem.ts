import * as vscode from 'vscode';

export class TagTreeItem extends vscode.TreeItem {
  constructor(public readonly label: string, public readonly collapsibleState: vscode.TreeItemCollapsibleState) {
    super(label, collapsibleState);
  }

  get command(): vscode.Command | undefined {
    return {
      command: 'clutter.insertTag',
      arguments: [
        this.label
      ],
      title: 'Insert Tag',
    };
  }

  get tooltip(): string {
    return `Insert ${this.label} at cursor.`;
  }

  get description(): string {
    return this.label;
  }

}
