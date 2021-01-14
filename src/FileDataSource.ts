import * as vscode from 'vscode';
import findNonIgnoredFiles from "./findNonIgnoredFiles";

export class FileDataSource {

  static async getFiles(): Promise<Array<vscode.Uri>> {
    // @todo Pull from Clutter index file
    return await findNonIgnoredFiles('**/*');
  }

  // static updateCacheFor(fsPath: string) {
  //   new Note(fsPath).readFileAndParse();
  // }

}