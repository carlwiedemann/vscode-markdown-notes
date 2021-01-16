import * as vscode from "vscode";
import { TagInterface } from "./TagInterface";

export class Tag {

  static tagRegExp: RegExp = /\[\#[^\#]+\#\]/gi;

  static tagStartRegExp: RegExp = /\[\#/;

  static isTagStart(document: vscode.TextDocument, position: vscode.Position): boolean {
    return !!document.getWordRangeAtPosition(position, Tag.tagStartRegExp);
  }

  static getTagAt(document: vscode.TextDocument, position: vscode.Position): TagInterface | null {
    let range: vscode.Range | undefined;

    range = document.getWordRangeAtPosition(position, Tag.tagRegExp);
    let fullText = document.getText(range);
    let innerText = Tag.innerTextFromFullText(fullText);

    if (range) {
      return {
        fullText: fullText,
        innerText: innerText,
        range: range,
      };
    }

    return null;
  }

  static innerTextFromFullText(fullText: string) {
    // We use this formatting here so that we don't
    // mistake this as a clutter tag itself :).
    return fullText.replace('[' + '#', '').replace('#' + ']', '');
  }

  static fullTextFromInnerText(text: string) {
    // We use this formatting here so that we don't
    // mistake this as a clutter tag itself :).
    return `[` + `#${text}#` + `]`;
  }

  static fromMatch(lineNum: number, match: RegExpMatchArray): TagInterface {
    let start = match.index || 0;
    let fullText = match[0];
    let end = start + fullText.length;

    let range = new vscode.Range(
      new vscode.Position(lineNum, start),
      new vscode.Position(lineNum, end)
    );

    return {
      fullText: fullText,
      innerText: Tag.innerTextFromFullText(fullText),
      range: range,
    };
  };

}