import * as vscode from 'vscode';
import { Ref, RefType } from './Ref';
import { NoteWorkspace } from './NoteWorkspace';
import { Note } from './Note';
import { Dictionary } from './Dictionary';
import { FileDataSource } from './FileDataSource';

export class NoteParser {
  // mapping of file fsPaths to Note objects
  // static _noteCacheMap: Dictionary<Note> = {};

  static async searchBacklinksFor(fileBasename: string): Promise<vscode.Location[]> {
    let ref: Ref = {
      type: RefType.WikiLink,
      hasExtension: true,
      text: fileBasename,
      range: undefined,
    };
    return Note.getLocationsForRef(ref);
  }

  // call this when we know a file has changed contents to update the cache
  // static updateCacheFor(fsPath: string) {
  //   let useCache = false;
  //   NoteParser.noteFromPath(fsPath).readFile(useCache).then((note) => {
  //     note.parse(useCache);
  //     NoteParser._noteCacheMap[fsPath] = note;
  //   });
  // }

  // call this when we know a file has been deleted
  // static clearCacheFor(fsPath: string) {
  //   delete NoteParser._noteCacheMap[fsPath];
  // }

  // static async hydrateCache(): Promise<Array<Note>> {
  //   let useCache = false;
  //   return await NoteParser.getWorkspaceParsedNotes(useCache);
  // }

}
