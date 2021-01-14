import * as vscode from 'vscode';
import * as fs from 'fs';
import { FileWithLocations } from "./FileWithLocations";

export class BacklinkItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public locations?: vscode.Location[],
    private location?: vscode.Location
  ) {
    super(label, collapsibleState);
  }

  // return the 1 collapsible Item for each file
  // store the locations within that file to the .locations attribute
  static fromFileWithLocations(fwl: FileWithLocations): BacklinkItem {
    let label = fwl.file;
    let cs = vscode.TreeItemCollapsibleState.Expanded;
    return new BacklinkItem(label, cs, fwl.locations, undefined);
  }

  // items for the locations within files
  static fromLocation(location: vscode.Location): BacklinkItem {
    // location / range is 0-indexed, but editor lines are 1-indexed
    let lineNum = location.range.start.line + 1;
    let label = `${lineNum}:`; // path.basename(location.uri.fsPath);
    let cs = vscode.TreeItemCollapsibleState.None;
    return new BacklinkItem(label, cs, undefined, location);
  }

  get command(): vscode.Command | undefined {
    if (this.location) {
      return {
        command: 'vscode.open',
        arguments: [
          this.location.uri,
          {
            preview: true,
            selection: this.location.range,
          },
        ],
        title: 'Open File',
      };
    }
  }

  get tooltip(): string {
    return this.description;
  }

  get description(): string {
    let d = ``;
    if (this.location) {
      let lines = (fs.readFileSync(this.location?.uri.fsPath) || '').toString().split(/\r?\n/);
      let line = lines[this.location?.range.start.line];
      // Look back 12 chars before the start of the reference.
      // There is almost certainly a more elegant way to do this.
      let s = this.location?.range.start.character - 12;
      if (s < 20) {
        s = 0;
      }
      return line.substr(s);
    } else if (this.locations) {
      d = `${this.locations?.length} References`;
    }
    return d;
  }

  get iconPath(): vscode.ThemeIcon | undefined {
    // to leave more room for the ref text,
    // don't use an icon for each line
    return this.location ? undefined : new vscode.ThemeIcon('references');
  }
}
