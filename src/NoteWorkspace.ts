import * as vscode from 'vscode';
import { basename, dirname, isAbsolute, join, normalize, relative } from 'path';
import { existsSync, writeFileSync } from 'fs';
import findNonIgnoredFiles from './findNonIgnoredFiles';
import { NoteParser } from './NoteParser';
import { TagDataSource } from './TagDataSource';
const GithubSlugger = require('github-slugger');
const SLUGGER = new GithubSlugger();

export const foo = () => {
  return 1;
};

enum NoteCompletionConvention {
  rawFilename = 'rawFilename',
  noExtension = 'noExtension',
  toSpaces = 'toSpaces',
}
enum WorkspaceFilenameConvention {
  uniqueFilenames = 'uniqueFilenames',
  relativePaths = 'relativePaths',
}
enum SlugifyCharacter {
  dash = '-',
  underscore = '_',
  fullwidthDash = '－',
  fullwidthUnderscore = '＿',
  none = 'NONE',
}

export enum SlugifyMethod {
  github = 'github-slugger',
  classic = 'classic',
}

export enum PipedWikiLinksSyntax {
  fileDesc = 'file|desc',
  descFile = 'desc|file',
}

enum PreviewLabelStyling {
  brackets = '[[label]]',
  bracket = '[label]',
  none = 'label',
}

type Config = {
  createNoteOnGoToDefinitionWhenMissing: boolean;
  defaultFileExtension: string;
  noteCompletionConvention: NoteCompletionConvention;
  slugifyCharacter: SlugifyCharacter;
  slugifyMethod: SlugifyMethod;
  workspaceFilenameConvention: WorkspaceFilenameConvention;
  newNoteTemplate: string;
  newNoteFromSelectionReplacementTemplate: string;
  lowercaseNewNoteFilenames: boolean;
  compileSuggestionDetails: boolean;
  triggerSuggestOnReplacement: boolean;
  allowPipedWikiLinks: boolean;
  pipedWikiLinksSyntax: PipedWikiLinksSyntax;
  pipedWikiLinksSeparator: string;
  newNoteDirectory: string;
  previewLabelStyling: PreviewLabelStyling;
  previewShowFileExtension: boolean;
};
// This class contains:
// 1. an interface to some of the basic user configurable settings or this extension
// 2. command for creating a New Note
// 3. some other bootstrapping
export class NoteWorkspace {
  // Defining these as strings now, and then compiling them with accessor methods.
  // This will allow us to potentially expose these as settings.
  static _rxTagNoAnchors = '\\#[\\w\\-\\_]+'; // used to match tags that appear within lines

  static _rxTagWithAnchors = '^\\#[\\w\\-\\_]+$'; // used to match entire words
  static _rxWikiLink = '\\[\\[[^sep\\]]+(sep[^sep\\]]+)?\\]\\]'; // [[wiki-link-regex(|with potential pipe)?]] Note: "sep" will be replaced with pipedWikiLinksSeparator on compile
  static _rxTitle = '(?<=^( {0,3}#[^\\S\\r\\n]+)).+';
  static _rxMarkdownWordPattern = '([\\_\\w\\#\\.\\/\\\\]+)'; // had to add [".", "/", "\"] to get relative path completion working and ["#"] to get tag completion working
  static _rxFileExtensions = '\\.(md|markdown|mdx|fountain)$';
  static SLUGIFY_NONE = 'NONE';
  static NEW_NOTE_SAME_AS_ACTIVE_NOTE = 'SAME_AS_ACTIVE_NOTE';
  static NEW_NOTE_WORKSPACE_ROOT = 'WORKSPACE_ROOT';
  static DEFAULT_CONFIG: Config = {
    createNoteOnGoToDefinitionWhenMissing: true,
    compileSuggestionDetails: false,
    defaultFileExtension: 'md',
    noteCompletionConvention: NoteCompletionConvention.rawFilename,
    slugifyCharacter: SlugifyCharacter.dash,
    slugifyMethod: SlugifyMethod.classic,
    workspaceFilenameConvention: WorkspaceFilenameConvention.uniqueFilenames,
    newNoteTemplate: '# ${noteName}\n\n',
    newNoteFromSelectionReplacementTemplate: '[[${wikiLink}]]',
    lowercaseNewNoteFilenames: true,
    triggerSuggestOnReplacement: true,
    allowPipedWikiLinks: false,
    pipedWikiLinksSyntax: PipedWikiLinksSyntax.fileDesc,
    pipedWikiLinksSeparator: '\\|',
    newNoteDirectory: NoteWorkspace.NEW_NOTE_SAME_AS_ACTIVE_NOTE,
    previewLabelStyling: PreviewLabelStyling.brackets,
    previewShowFileExtension: false,
  };
  static DOCUMENT_SELECTOR = [
    { scheme: 'file', language: '*' }
  ];

  static cfg(): Config {
    let c = vscode.workspace.getConfiguration('vscodeMarkdownNotes');
    return {
      createNoteOnGoToDefinitionWhenMissing: c.get(
        'createNoteOnGoToDefinitionWhenMissing'
      ) as boolean,
      defaultFileExtension: c.get('defaultFileExtension') as string,
      noteCompletionConvention: c.get('noteCompletionConvention') as NoteCompletionConvention,
      slugifyCharacter: c.get('slugifyCharacter') as SlugifyCharacter,
      slugifyMethod: c.get('slugifyMethod') as SlugifyMethod,
      workspaceFilenameConvention: c.get(
        'workspaceFilenameConvention'
      ) as WorkspaceFilenameConvention,
      newNoteTemplate: c.get('newNoteTemplate') as string,
      newNoteFromSelectionReplacementTemplate: c.get('newNoteFromSelectionReplacementTemplate') as string,
      lowercaseNewNoteFilenames: c.get('lowercaseNewNoteFilenames') as boolean,
      compileSuggestionDetails: c.get('compileSuggestionDetails') as boolean,
      triggerSuggestOnReplacement: c.get('triggerSuggestOnReplacement') as boolean,
      allowPipedWikiLinks: c.get('allowPipedWikiLinks') as boolean,
      pipedWikiLinksSyntax: c.get('pipedWikiLinksSyntax') as PipedWikiLinksSyntax,
      pipedWikiLinksSeparator: c.get('pipedWikiLinksSeparator') as string,
      newNoteDirectory: c.get('newNoteDirectory') as string,
      previewLabelStyling: c.get('previewLabelStyling') as PreviewLabelStyling,
      previewShowFileExtension: c.get('previewShowFileExtension') as boolean,
    };
  }

  static clutterTagFromText(text: string) {
    // We use this formatting here so that we don't
    // mistake this as a clutter tag itself :).
    return `[` + `#${text}#` + `]`;
  }

  static innerTextFromFullText(fullText: string) {
    return fullText.replace('[#', '').replace('#]', '');
  }

  static slugifyChar(): string {
    return this.cfg().slugifyCharacter;
  }

  static slugifyMethod(): string {
    return this.cfg().slugifyMethod;
  }

  static defaultFileExtension(): string {
    return this.cfg().defaultFileExtension;
  }

  static newNoteTemplate(): string {
    return this.cfg().newNoteTemplate;
  }

  static newNoteFromSelectionReplacementTemplate(): string {
    return this.cfg().newNoteFromSelectionReplacementTemplate;
  }

  static lowercaseNewNoteFilenames(): boolean {
    return this.cfg().lowercaseNewNoteFilenames;
  }

  static triggerSuggestOnReplacement() {
    return this.cfg().triggerSuggestOnReplacement;
  }

  static allowPipedWikiLinks(): boolean {
    return this.cfg().allowPipedWikiLinks;
  }

  static pipedWikiLinksSyntax(): string {
    return this.cfg().pipedWikiLinksSyntax;
  }

  static pipedWikiLinksSeparator(): string {
    return this.cfg().pipedWikiLinksSeparator;
  }

  static newNoteDirectory(): string {
    return this.cfg().newNoteDirectory;
  }

  static previewLabelStyling(): string {
    return this.cfg().previewLabelStyling;
  }

  static previewShowFileExtension(): boolean {
    return this.cfg().previewShowFileExtension;
  }

  static rxTagNoAnchors(): RegExp {
    // NB: MUST have g flag to match multiple words per line
    // return /\#[\w\-\_]+/i; // used to match tags that appear within lines
    return new RegExp(this._rxTagNoAnchors, 'gi');
  }

  static rxClutterTag(): RegExp {
    return /\[\#[^\#]+\#\]/gi;
  }

  static rxClutterTagStart(): RegExp {
    return /\[\#/;
  }

  static rxTagWithAnchors(): RegExp {
    // NB: MUST have g flag to match multiple words per line
    // return /^\#[\w\-\_]+$/i; // used to match entire words
    return new RegExp(this._rxTagWithAnchors, 'gi');
  }
  static rxWikiLink(): RegExp {
    // NB: MUST have g flag to match multiple words per line
    // return /\[\[[\w\.\-\_\/\\]+/i; // [[wiki-link-regex
    this._rxWikiLink = this._rxWikiLink.replace(/sep/g, NoteWorkspace.pipedWikiLinksSeparator());
    return new RegExp(this._rxWikiLink, 'gi');
  }
  static rxTitle(): RegExp {
    return new RegExp(this._rxTitle, 'gi');
  }
  static rxMarkdownWordPattern(): RegExp {
    // return /([\#\.\/\\\w_]+)/; // had to add [".", "/", "\"] to get relative path completion working and ["#"] to get tag completion working
    return new RegExp(this._rxMarkdownWordPattern);
  }
  static rxFileExtensions(): RegExp {
    // return noteName.replace(/\.(md|markdown|mdx|fountain)$/i, '');
    return new RegExp(this._rxFileExtensions, 'i');
  }

  static useUniqueFilenames(): boolean {
    // return false;
    return this.cfg().workspaceFilenameConvention == 'uniqueFilenames';
  }

  static createNoteOnGoToDefinitionWhenMissing(): boolean {
    return !!this.cfg().createNoteOnGoToDefinitionWhenMissing;
  }

  static compileSuggestionDetails(): boolean {
    return this.cfg().compileSuggestionDetails;
  }

  static newTagFromSelection() {
    const originEditor = vscode.window.activeTextEditor;

    if (!originEditor) {
      return;
    }

    const { selection } = originEditor;
    const text = originEditor.document.getText(selection);
    const originSelectionRange = new vscode.Range(selection.start, selection.end);

    if (text === '') {
      vscode.window.showErrorMessage('Error creating tag from selection: selection is empty.');
    }
    else {
      const edit = new vscode.WorkspaceEdit();
      edit.replace(originEditor.document.uri, originSelectionRange, NoteWorkspace.clutterTagFromText(text));
      vscode.workspace.applyEdit(edit);
      // NoteParser.updateCacheFor(originEditor.document.uri.fsPath);
    }
  }

}
