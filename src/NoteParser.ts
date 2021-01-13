import * as vscode from 'vscode';
const fsp = require('fs').promises;
import { Ref, RefType } from './Ref';
import { NoteWorkspace } from './NoteWorkspace';
import { Note } from './Note';
import { Dictionary } from './Dictionary';

export class NoteParser {
  // mapping of file fsPaths to Note objects
  static _notes: Dictionary<Note> = {};

  static async distinctTags(): Promise<Array<string>> {
    let useCache = true;
    let _tags: Array<string> = [];
    await NoteParser.parsedFilesForWorkspace(useCache).then((pfs) => {
      pfs.map((note) => {
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

  static parsedFileFor(fsPath: string): Note {
    let note = NoteParser._notes[fsPath];
    if (!note) {
      note = new Note(fsPath);
    }
    this._notes[fsPath] = note;
    return note;
  }

  static async parsedFilesForWorkspace(useCache = false): Promise<Array<Note>> {
    let files = await NoteWorkspace.noteFiles();

    let notes = files.map((f) => NoteParser.parsedFileFor(f.fsPath));

    return (await Promise.all(notes.map((note) => {
      return note.readFile(useCache);
    }))).map((note) => {
      note.parseData(useCache);
      return note;
    });
  }

  // call this when we know a file has changed contents to update the cache
  static updateCacheFor(fsPath: string) {
    let that = this;
    let note = NoteParser.parsedFileFor(fsPath);
    note.readFile(false).then((_pf) => {
      _pf.parseData(false);
      // remember to set in the master index:
      that._notes[fsPath] = _pf;
    });
  }

  // call this when we know a file has been deleted
  static clearCacheFor(fsPath: string) {
    delete NoteParser._notes[fsPath];
  }

  static async hydrateCache(): Promise<Array<Note>> {
    let useCache = false;
    let parsedFiles = await NoteParser.parsedFilesForWorkspace(useCache);
    return parsedFiles;
  }

  static async search(ref: Ref): Promise<vscode.Location[]> {
    //let useCache = true;
    let useCache = false;

    let locations: vscode.Location[] = [];

    let notes = await NoteParser.parsedFilesForWorkspace(useCache);

    notes.map((note) => {
      note.getRefRanges(ref).map((range) => {
        locations.push(new vscode.Location(vscode.Uri.file(note.fsPath), range));
      });
    });

    return locations;
  }

  static noteFromFsPath(fsPath: string): Note | undefined {
    return this._notes[fsPath];
  }

}
