import * as vscode from 'vscode';
import got = require('got');
import { BacklinksTreeDataProvider } from './BacklinksTreeDataProvider';
import { ClutterTagReferenceProvider } from './ClutterTagReferenceProvider';
import { ClutterTagCompletionItemProvider } from './ClutterTagCompletionItemProvider';
import { NoteWorkspace } from './NoteWorkspace';
import { NoteParser } from './NoteParser';
import { TagDataSource } from './TagDataSource';
import { Note } from './Note';

export function activate(context: vscode.ExtensionContext) {

  const ds = NoteWorkspace.DOCUMENT_SELECTOR;

  // References.
  context.subscriptions.push(
    vscode.languages.registerReferenceProvider(ds, new ClutterTagReferenceProvider())
  );

  // Completion
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(ds, new ClutterTagCompletionItemProvider(), '#')
  );

  // Hover
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(ds, {
      async provideHover(document, position, token) {
        const line = document.lineAt(position.line);
        const re = /\[#flagr:(.*)#\]/g;
        const match = re.exec(line.text) || ['', ''];
        const flagrId = match[1];
        const flagrBaseURL = 'https://try-flagr.herokuapp.com/api/v1/flags';

        if (flagrId != '') {
          const res = await got(`${flagrBaseURL}/${flagrId}`);
          const flag = JSON.parse(res.body);
          const tooltip: vscode.MarkdownString = new vscode.MarkdownString(`
|                  |                       |
|------------------|-----------------------|
| **Flag ID**      | ${flag.id}            |
| **Enabled**      | ${flag.enabled}       |
| **Key**          | ${flag.key}           |
| **Description**  | ${flag.description}   |
| **Updated At**   | ${flag.updatedAt}     |
          `);
          tooltip.isTrusted = true;
          return new vscode.Hover(tooltip);
        }
      },
    })
  );

  // Observe changes to a document.
  vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
    let parsed = Note.parseString(e.document.getText());
    TagDataSource.registerTempRefs(e.document.uri.fsPath, parsed);
    // Clear refs on save/delete.
  });

  // New note from selection command.
  context.subscriptions.push(vscode.commands.registerCommand('clutter.newTagFromSelection', NoteWorkspace.newTagFromSelection));

  // NoteParser.hydrateCache();

  // We should modify this to make it work for tags.
  // const backlinksTreeDataProvider = new BacklinksTreeDataProvider(
  //   vscode.workspace.rootPath || null
  // );
  // vscode.window.onDidChangeActiveTextEditor(() => backlinksTreeDataProvider.reload());
  // const treeView = vscode.window.createTreeView('vscodeMarkdownNotesBacklinks', {
  //   treeDataProvider: backlinksTreeDataProvider,
  // });

}
