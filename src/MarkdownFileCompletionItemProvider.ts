import * as vscode from 'vscode';
import { isRefStart } from './Ref';
import { NoteParser } from './NoteParser';

export class MarkdownFileCompletionItemProvider implements vscode.CompletionItemProvider {
  public async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {

    const start = isRefStart(document, position);

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

      return (await NoteParser.distinctTags()).map((t) => {
        let label = `${t}`; // cast to a string
        let item = new vscode.CompletionItem(label, vscode.CompletionItemKind.Snippet);
        item.range = range;

        return item;
      });
    }

    return [];
  }

}
