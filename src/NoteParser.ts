import * as vscode from 'vscode';
import { Ref, RefType } from './Ref';
import { NoteWorkspace } from './NoteWorkspace';
import { Note } from './Note';
import { Dictionary } from './Dictionary';

export class NoteParser {
  // mapping of file fsPaths to Note objects
  static _noteCacheMap: Dictionary<Note> = {};

  static async distinctTags(): Promise<Array<string>> {
    // let useCache = true;
    let useCache = false;
    let _tags: Array<string> = [];

    await NoteParser.getWorkspaceParsedNotes(useCache).then((notes) => {
      notes.map((note) => {
        _tags = _tags.concat(Array.from(note.tagSet()));
      });
    });

    return Array.from(new Set(_tags));
  }

  static async searchBacklinksFor(fileBasename: string): Promise<vscode.Location[]> {
    let ref: Ref = {
      type: RefType.WikiLink,
      hasExtension: true,
      text: fileBasename,
      range: undefined,
    };
    return this.search(ref);
  }

  static noteFromPath(fsPath: string): Note {
    let note = NoteParser._noteCacheMap[fsPath];
    if (!note) {
      note = new Note(fsPath);
      NoteParser._noteCacheMap[fsPath] = note;
    }
    return note;
  }

  static async getWorkspaceParsedNotes(useCache = false): Promise<Array<Note>> {
    let files = await NoteWorkspace.getFiles();

    let notes = files.map((file) => {
      return NoteParser.noteFromPath(file.fsPath);
    });

    return (await Promise.all(notes.map((note) => {
      return note.readFile(useCache);
    }))).map((note) => {
      note.parse(useCache);
      return note;
    });
  }

  // call this when we know a file has changed contents to update the cache
  static updateCacheFor(fsPath: string) {
    let useCache = false;
    NoteParser.noteFromPath(fsPath).readFile(useCache).then((note) => {
      note.parse(useCache);
      NoteParser._noteCacheMap[fsPath] = note;
    });
  }

  // call this when we know a file has been deleted
  static clearCacheFor(fsPath: string) {
    delete NoteParser._noteCacheMap[fsPath];
  }

  static async hydrateCache(): Promise<Array<Note>> {
    let useCache = false;
    return await NoteParser.getWorkspaceParsedNotes(useCache);
  }

  static async search(ref: Ref): Promise<vscode.Location[]> {
    // let useCache = true;
    let useCache = false;

    let locations: vscode.Location[] = [];

    let notes = await NoteParser.getWorkspaceParsedNotes(useCache);

    notes.map((note) => {
      note.getRefRanges(ref).map((range) => {
        locations.push(new vscode.Location(vscode.Uri.file(note.fsPath), range));
      });
    });

    return locations;
  }

  static noteFromFsPath(fsPath: string): Note | undefined {
    return this._noteCacheMap[fsPath];
  }

}
