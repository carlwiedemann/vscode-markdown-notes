import * as vscode from 'vscode';
import { NoteWorkspace } from './NoteWorkspace';

export enum RefType {
  Null, // 0
  WikiLink, // 1
  Tag, // 2
}

export interface Ref {
  type: RefType;
  text: string;
  hasExtension: boolean | null;
  range: vscode.Range | undefined;
}

export const NULL_REF = {
  type: RefType.Null,
  text: '',
  hasExtension: null,
  range: undefined,
};

export function isRefStart(document: vscode.TextDocument, position: vscode.Position): boolean {
  return document.getWordRangeAtPosition(position, NoteWorkspace.rxClutterTagStart()) ? true : false;
}

export function getRefAt(document: vscode.TextDocument, position: vscode.Position): Ref {
  let range: vscode.Range | undefined;

  range = document.getWordRangeAtPosition(position, NoteWorkspace.rxClutterTag());

  if (range) {
    return {
      type: RefType.Tag,
      text: document.getText(range),
      hasExtension: false,
      range: range,
    };
  }

  return NULL_REF;
}