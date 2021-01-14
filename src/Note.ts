import * as vscode from 'vscode';
import { readFile } from 'fs';
import { Ref, RefType } from './Ref';
import { NoteWorkspace } from './NoteWorkspace';
import { RawRange } from "./RawRange";
import { RefCandidate } from "./RefCandidate";
import { NoteParser } from './NoteParser';
import { FileDataSource } from './FileDataSource';

export class Note {

  fsPath: string;

  fileContents: string | undefined;

  refCandidates: Array<RefCandidate> = [];

  title: {
    text: string;
    line: number;
    contextLine: number; // line number after all empty lines
  } | undefined;

  constructor(fsPath: string) {
    this.fsPath = fsPath;
  }

  // mostly used as a constructor for tests
  // when we don't want to actually parse something
  // from the filesystem.
  // Won't fail because the init does not do anything with fsPath
  // static fromData(data: string): Note {
  //   let note = new Note('NO_PATH');
  //   note.fileContents = data;
  //   note.parse(false);
  //   return note;
  // }

  // read fsPath into this.data and return a
  // Promise that resolves to `this` Note instance.
  // Usage:
  // note.readFile().then(note => console.log(note.data));
  readFileAndParse(): Promise<Note> {
    let that = this;
    // if we are using the cache and cached data exists,
    // just resolve immediately without re-reading files
    // if (useCache && this.data) {
    //   return new Promise((resolve) => {
    //     resolve(that);
    //   });
    // }
    // make sure we reset parsed to false because we are re-reading the file
    // and we don't want to end up using the old parsed refCandidates
    // in the event that parseData(true) is called in the interim
    return new Promise((resolve, reject) => {
      readFile(that.fsPath, (err, buffer) => {
        if (err) {
          reject(err);
        } else {
          // NB! Make sure to cast this to a string
          // otherwise, it will cause weird silent failures
          that.fileContents = `${buffer}`;
          that.parse();
          resolve(that);
        }
      });
    });
  }

  parse() {
    let that = this;

    // don't debug on blank data, only null|undefined
    if (this.fileContents === '') {
      return;
    }

    if (!this.fileContents) {
      console.debug(`RefCandidate.parseData: no data for ${this.fsPath}`);
      return;
    }

    this.refCandidates = [];

    let lines = this.fileContents.split(/\r?\n/);

    lines.map((line, lineNum) => {
      Array.from(line.matchAll(NoteWorkspace.rxClutterTag())).map((match) => {
        that.refCandidates.push(RefCandidate.fromMatch(lineNum, match));
      });
    });
  }

  // NB: assumes this.parseData MUST have been called BEFORE running
  _getRawRefRanges(ref: Ref): Array<RawRange> {

    // don't debug on blank data, only null|undefined
    if (this.fileContents === '') {
      return [];
    }

    if (!this.fileContents || !this.refCandidates) {
      console.debug(
        'rangesForWordInDocumentData called with when !this.data || !this.refCandidates'
      );
      return [];
    }

    if (![RefType.Tag, RefType.WikiLink].includes(ref.type)) {
      console.debug('empty ref?');
      return [];
    }

    return this.refCandidates.filter((refCandidate) => {
      return refCandidate.matchesRef(ref);
    }).map((refCandidate) => {
      return refCandidate.rawRange;
    });
  }

  getRefRanges(ref: Ref): Array<vscode.Range> {
    return this._getRawRefRanges(ref).map((rawRange) => {
      return new vscode.Range(
        new vscode.Position(rawRange.start.line, rawRange.start.col),
        new vscode.Position(rawRange.end.line, rawRange.end.col)
      );
    });
  }

  tagSet(): Set<string> {
    let _tagSet: Set<string> = new Set();

    this.refCandidates
      .map((refCandidate) => {
        _tagSet.add(refCandidate.text);
      });

    return _tagSet;
  }

  static async getLocationsForRef(ref: Ref): Promise<vscode.Location[]> {
    let locations: vscode.Location[] = [];

    let notes = await Note.getAllParsedNotes();

    notes.map((note) => {
      note.getRefRanges(ref).map((range) => {
        locations.push(new vscode.Location(vscode.Uri.file(note.fsPath), range));
      });
    });

    return locations;
  }

  static async getAllParsedNotes(): Promise<Array<Note>> {
    let files = await FileDataSource.getFiles();

    let notes = files.map((file) => {
      return new Note(file.fsPath);
    });

    return (await Promise.all(notes.map((note) => {
      return note.readFileAndParse();
    })));
  }

  static async getDistictTagStrings(): Promise<Array<string>> {
    let _tags: Array<string> = [];

    await Note.getAllParsedNotes().then((notes) => {
      notes.map((note) => {
        _tags = _tags.concat(Array.from(note.tagSet()));
      });
    });

    return Array.from(new Set(_tags));
  }

}