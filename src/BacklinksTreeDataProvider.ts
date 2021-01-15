import * as vscode from 'vscode';
import * as path from 'path';
import { NoteParser } from './NoteParser';
import { BacklinkItem } from './BacklinkItem';
import { FileWithLocations } from './FileWithLocations';
import { TagDataSource } from './TagDataSource';
import { Note } from './Note';

export class BacklinksTreeDataProvider implements vscode.TreeDataProvider<BacklinkItem> {

  constructor(private workspaceRoot: string | null) { }

  _onDidChangeTreeData: vscode.EventEmitter<BacklinkItem> = new vscode.EventEmitter<BacklinkItem>();

  onDidChangeTreeData: vscode.Event<BacklinkItem> = this._onDidChangeTreeData.event;

  reload(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: BacklinkItem): vscode.TreeItem {
    return element;
  }

  // Take a flat list of locations, such as:
  // - file1.md, l1
  // - file2.md, l2
  // - file1.md, l3
  // And return as list of files with location lists:
  // - file1.md
  //   - l1
  //   - l3
  // - file2.md
  //   - l2
  // NB: does work well with relativePaths mode, assumes uniqueFilenames
  static locationListToTree(locations: vscode.Location[]): FileWithLocations[] {
    let m: Record<string, FileWithLocations> = {};
    locations.map((l) => {
      let f = path.basename(l.uri.fsPath);
      if (!m[f]) {
        let fwl: FileWithLocations = {
          file: f,
          locations: [],
        };
        m[f] = fwl;
      }
      m[f].locations.push(l);
    });
    let arr = Object.values(m);
    // sort the files by name:
    let asc = (a: string | number, b: string | number) => {
      if (a < b) {
        return -1;
      }
      if (a > b) {
        return 1;
      }
      return 0;
    };
    arr.sort((a, b) => asc(a.file, b.file));
    // sort the locations in each file by start position:
    return arr.map((fwl) => {
      fwl.locations.sort((locA, locB) => {
        let a = locA.range.start;
        let b = locB.range.start;
        if (a.line < b.line) {
          return -1;
        }
        if (a.line > b.line) {
          return 1;
        }
        // same line, compare chars
        if (a.character < b.character) {
          return -1;
        }
        if (a.character > b.character) {
          return 1;
        }
        return 0;
      });
      return fwl;
    });
  }

  _getChildren(element?: BacklinkItem): Thenable<BacklinkItem[]> {

    let fsPath = vscode.window.activeTextEditor?.document.uri.fsPath;

    if (!fsPath) {
      // no activeTextEditor, so there can be no refs
      return Promise.resolve([]);
    }

    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No refs in empty workspace');
      return Promise.resolve([]);
    }

    let activeFilename = path.basename(fsPath);

    // TOP LEVEL:
    // Parse the workspace into list of FilesWithLocations
    // Return 1 collapsible element per file

    if (!element) {
      // What we really want to do is to parse the file for tags
      // and show all the tags in the file

      return NoteParser.searchBacklinksFor(activeFilename).then((locations) => {
        let filesWithLocations = BacklinksTreeDataProvider.locationListToTree(locations);
        return filesWithLocations.map((fwl) => BacklinkItem.fromFileWithLocations(fwl));
      });

      // Given the collapsible elements,
      // return the children, 1 for each location within the file
    } else if (element && element.locations) {
      return Promise.resolve(element.locations.map((l) => BacklinkItem.fromLocation(l)));
    } else {
      return Promise.resolve([]);
    }
  }

  async getChildren(element?: BacklinkItem): Promise<BacklinkItem[]> {
    console.debug(element);

    if (!element) {
      return Promise.resolve((await Note.getDistictTagFullTextStrings()).map((label) => {
        let cs = vscode.TreeItemCollapsibleState.Expanded;
        return new BacklinkItem(label, cs);
      }));
    }
    else if (element) {
      // return Promise.resolve([element]);
      return Promise.resolve([]);
    }
    else {
      return Promise.resolve([]);
    }
  }
}


