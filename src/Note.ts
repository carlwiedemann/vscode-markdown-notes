import * as vscode from 'vscode';
import { readFile } from 'fs';
import { Ref, RefType } from './Ref';
import { NoteWorkspace } from './NoteWorkspace';
import { RawRange } from "./RawRange";
import { RefCandidate } from "./RefCandidate";

// Caches the results of reading and parsing a TextDocument
// into an in-memory index,
// so we don't have to re-parse the file
// every time we want to get the locations of
// the Tags and WikiLinks in it

export class Note {

  fsPath: string;

  data: string | undefined;

  refCandidates: Array<RefCandidate> = [];

  title: {
    text: string;
    line: number;
    contextLine: number; // line number after all empty lines
  } | undefined;

  private _parsed: boolean = false;

  constructor(fsPath: string) {
    this.fsPath = fsPath;
  }

  // mostly used as a constructor for tests
  // when we don't want to actually parse something
  // from the filesystem.
  // Won't fail because the init does not do anything with fsPath
  static fromData(data: string): Note {
    let note = new Note('NO_PATH');
    note.data = data;
    note.parse(false);
    return note;
  }

  // read fsPath into this.data and return a
  // Promise that resolves to `this` Note instance.
  // Usage:
  // note.readFile().then(note => console.log(note.data));
  readFile(useCache = false): Promise<Note> {
    let that = this;
    // if we are using the cache and cached data exists,
    // just resolve immediately without re-reading files
    if (useCache && this.data) {
      return new Promise((resolve) => {
        resolve(that);
      });
    }
    // make sure we reset parsed to false because we are re-reading the file
    // and we don't want to end up using the old parsed refCandidates
    // in the event that parseData(true) is called in the interim
    this._parsed = false;
    return new Promise((resolve, reject) => {
      readFile(that.fsPath, (err, buffer) => {
        if (err) {
          reject(err);
        } else {
          // NB! Make sure to cast this to a string
          // otherwise, it will cause weird silent failures
          that.data = `${buffer}`;
          resolve(that);
        }
      });
    });
  }

  parse(useCache = false) {
    let that = this;

    // don't debug on blank data, only null|undefined
    if (this.data === '') {
      return;
    }

    if (!this.data) {
      console.debug(`RefCandidate.parseData: no data for ${this.fsPath}`);
      return;
    }

    if (useCache && this._parsed) {
      return;
    }

    this.refCandidates = [];

    let lines = this.data.split(/\r?\n/);

    lines.map((line, lineNum) => {
      Array.from(line.matchAll(NoteWorkspace.rxClutterTag())).map((match) => {
        that.refCandidates.push(RefCandidate.fromMatch(lineNum, match));
      });
    });

    this._parsed = true;
  }

  // NB: assumes this.parseData MUST have been called BEFORE running
  _getRawRefRanges(ref: Ref): Array<RawRange> {

    // don't debug on blank data, only null|undefined
    if (this.data === '') {
      return [];
    }

    if (!this.data || !this.refCandidates) {
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

  // completionItem.documentation ()
  documentation(): string | vscode.MarkdownString | undefined {
    if (this.data === undefined) {
      return "";
    } else {
      let data = this.data;
      if (this.title) { // get the portion of the note after the title
        data = this.data.split(/\r?\n/).slice(this.title.contextLine + 1).join('\n');
      }
      if (NoteWorkspace.compileSuggestionDetails()) {
        try {
          let result = new vscode.MarkdownString(data);
          return result;
        } catch (error) {
          return "";
        }
      } else {
        return data;
      }
    }
  }
}
