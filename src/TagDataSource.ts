import { exec, ExecException } from 'child_process';
import * as vscode from 'vscode';
import * as path from 'path';
import { TagInterface } from './TagInterface';
import { DictionaryInterface } from './DictionaryInterface';
import { Tag } from "./Tag";

export class TagDataSource {

  static tempTags: DictionaryInterface<Array<TagInterface>> = {};

  static getProjectRootUri(): string {
    let folders = vscode.workspace.workspaceFolders;
    if (folders) {
      return folders[0].uri.fsPath;
    }
    throw new Error();
  }

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

  // @todo Dedupe with below.
  static async getAllTags(refToMatch?: TagInterface): Promise<Array<TagInterface>> {

    let stdout = await TagDataSource.getRawTagData();

    let allLines = stdout.split('\n');

    let lines: Array<string>;

    if (refToMatch) {
      let toMatch = refToMatch.innerText + ' ';
      lines = allLines.filter((line) => {
        return line.indexOf(toMatch) === 0;
      });
    } else {
      lines = allLines;
    }

    let tags: Array<TagInterface> = [];

    lines.map((line) => {
      let match = line.match(/^(.+) (.+):(\d+)\.(\d+)$/);
      if (match) {

        let refText = match[1];
        let fullText = Tag.fullTextFromInnerText(refText);

        let line = parseInt(match[3]);
        let col = parseInt(match[4]);

        let range = new vscode.Range(
          new vscode.Position(line - 1, col - 1),
          new vscode.Position(line - 1, col - 1 + fullText.length)
        );

        tags.push({
          fullText: fullText,
          innerText: refText,
          range: range
        });
      }
    });

    // Also push temp refs.
    Object.keys(TagDataSource.tempTags).forEach((key) => {
      tags = [...tags, ...(TagDataSource.tempTags[key])];
    });

    return tags;
  }

  // @todo Dedupe with above.
  static async getAllTagLocations(refToMatch?: TagInterface): Promise<Array<vscode.Location>> {

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
    } else {
      lines = allLines;
    }

    lines.map((line) => {
      let match = line.match(/^(.+) (.+):(\d+)\.(\d+)$/);
      if (match) {

        let refText = match[1];
        let fullText = Tag.fullTextFromInnerText(refText);

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

  static registerTempTags(fsPath: string, tags: Array<TagInterface>) {
    TagDataSource.tempTags[fsPath] = tags;
  }

  static async getDistinctTagFullTextStrings(): Promise<Array<string>> {
    let tagSet = (await TagDataSource.getAllTags()).reduce((carry: Set<string>, tag: TagInterface): Set<string> => {
      return carry.add(tag.fullText);
    }, new Set());

    return Array.from(tagSet);
  }

  // @todo deprecate in favor of CLI integration.
  // @see https://github.com/cluttercode/clutter/issues/1
  static parseString(data: string): Array<TagInterface> {

    let tags: Array<TagInterface> = [];

    // don't debug on blank data, only null|undefined
    if (data === '') {
      return tags;
    }

    data.split(/\r?\n/).map((line, lineNum) => {
      Array.from(line.matchAll(Tag.tagRegExp)).map((match) => {
        tags.push(Tag.fromMatch(lineNum, match));
      });
    });

    return tags;
  }

}