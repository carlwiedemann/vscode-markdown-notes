import * as vscode from 'vscode';
import { TagDataSource } from "./TagDataSource";
import { Tag } from "./Tag";

export class TagCompletionItemProvider implements vscode.CompletionItemProvider {
  public async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {

    const start = Tag.isTagStart(document, position);

    if (start) {

      let line = document.lineAt(position);
      let remainder = line.text.substring(position.character);
      let endTranslate: number;

      if (remainder === '') {
        endTranslate = 0;
      }
      else if (remainder === '#' || remainder === ']') {
        endTranslate = 1;
      }
      else if (remainder === '#]') {
        endTranslate = 2;
      }
      else {
        let match: RegExpMatchArray | null;
        match = remainder.match(/^[^\[]*?\#*\]/);
        endTranslate = match ? match[0].length : 0;
      }

      let range = new vscode.Range(position.translate(0, -2), position.translate(0, endTranslate));

      let fullTexts = await TagDataSource.getDistinctTagFullTextStrings();

      return fullTexts.map((fullText) => {
        let item = new vscode.CompletionItem(fullText, vscode.CompletionItemKind.Snippet);
        item.range = range;

        return item;
      });
    }

    return [];
  }

}
