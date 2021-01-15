import { exec, ExecException } from 'child_process';
import * as vscode from 'vscode';
import * as path from 'path';
import findNonIgnoredFiles from "./findNonIgnoredFiles";
import { Ref, RefType } from './Ref';
import { NoteWorkspace } from './NoteWorkspace';

export class TagDataSource {

  static getProjectRootUri(): string {
    let folders = vscode.workspace.workspaceFolders;
    if (folders) {
      return folders[0].uri.fsPath;
    }
    throw new Error();
  }

  static async getFiles(): Promise<Array<vscode.Uri>> {
    // @todo Pull from Clutter index file
    return await findNonIgnoredFiles('**/*');
  }

  // static updateCacheFor(fsPath: string) {
  //   new Note(fsPath).readFileAndParse();
  // }

  static async getRawTagData(): Promise<string> {

    try {
      let rootUri = TagDataSource.getProjectRootUri();

      const { stdout, stderr } = await new Promise<{ stdout: string; stderr: string }>(
        (resolve, reject) => {
          exec(`clutter find --no-index`, {
            cwd: rootUri
          }, (error: ExecException | null, stdout, stderr) => {
            if (error && error.code !== 0 && error.code !== 1) {
              reject(error);
              return;
            }

            resolve({ stdout, stderr });
          });
        }
      );

      if (stderr) {
        throw new Error(stderr);
      }

      return stdout;
    } catch (error) {
      console.error('clutter cli error', error);
    }

    return '';
  }

  static async getAllRefs(refToMatch?: Ref): Promise<Array<Ref>> {

    let stdout = await TagDataSource.getRawTagData();

    let allLines = stdout.split('\n');

    let lines: Array<string>;

    if (refToMatch) {
      let toMatch = refToMatch.innerText + ' ';
      lines = allLines.filter((line) => {
        return line.indexOf(toMatch) === 0;
      });
    }
    else {
      lines = allLines;
    }

    let refs: Array<Ref> = [];

    lines.map((line) => {
      let match = line.match(/^(.+) (.+):(\d+)\.(\d+)$/);
      if (match) {

        let refText = match[1];
        let fullText = NoteWorkspace.clutterTagFromText(refText);

        // let localPath = match[2];
        // let fullPath = path.join(rootUri, localPath);

        let line = parseInt(match[3]);
        let col = parseInt(match[4]);

        let range = new vscode.Range(
          new vscode.Position(line - 1, col - 1),
          new vscode.Position(line - 1, col - 1 + fullText.length)
        );

        refs.push({
          type: RefType.Tag,
          fullText: fullText,
          innerText: refText,
          hasExtension: false,
          range: range
        });
      }
    });

    return refs;
  }

  static async getAllRefLocations(refToMatch?: Ref): Promise<Array<vscode.Location>> {

    let rootUri = TagDataSource.getProjectRootUri();

    let locations: vscode.Location[] = [];

    let stdout = await TagDataSource.getRawTagData();

    let allLines = stdout.split('\n');

    let lines: Array<string>;

    if (refToMatch) {
      let toMatch = refToMatch.innerText + ' ';
      lines = allLines.filter((line) => {
        return line.indexOf(toMatch) === 0;
      });
    }
    else {
      lines = allLines;
    }

    lines.map((line) => {
      let match = line.match(/^(.+) (.+):(\d+)\.(\d+)$/);
      if (match) {

        let refText = match[1];
        let fullText = NoteWorkspace.clutterTagFromText(refText);

        let localPath = match[2];
        let fullPath = path.join(rootUri, localPath);

        let line = parseInt(match[3]);
        let col = parseInt(match[4]);

        let range = new vscode.Range(
          new vscode.Position(line - 1, col - 1),
          new vscode.Position(line - 1, col - 1 + fullText.length)
        );

        locations.push(new vscode.Location(vscode.Uri.file(fullPath), range));
      }
    });

    return locations;
  }

}