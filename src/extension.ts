import * as vscode from 'vscode';
import {AllTagsTreeDataProvider} from './AllTagsTreeDataProvider';
import {ClutterTagReferenceProvider} from './ClutterTagReferenceProvider';
import {ClutterTagCompletionItemProvider} from './ClutterTagCompletionItemProvider';
import {NoteWorkspace} from './NoteWorkspace';
import {TagDataSource} from './TagDataSource';
import {Note} from './Note';
import * as got from 'got';

export function activate(context: vscode.ExtensionContext) {

  const documentSelector = [
    {
      scheme: 'file',
      language: '*'
    }
  ];

  // Tree data provider.
  const allTagsTreeDataProvider = new AllTagsTreeDataProvider();

  // References.
  context.subscriptions.push(
    vscode.languages.registerReferenceProvider(documentSelector, new ClutterTagReferenceProvider())
  );

  // Completion.
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(documentSelector, new ClutterTagCompletionItemProvider(), '#')
  );

  // Flagr hover.
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(documentSelector, {
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
    if (parsed.length > 0) {
      allTagsTreeDataProvider.reload();
    }
  });

  // New note from selection command.
  context.subscriptions.push(vscode.commands.registerCommand('clutter.newTagFromSelection', NoteWorkspace.newTagFromSelection));

  // Insert tag from tag tree view command.
  context.subscriptions.push(vscode.commands.registerCommand('clutter.insertTag', function (content: string) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      editor.edit(editBuilder => {
        editBuilder.insert(editor.selection.start, content);
      });
    }
  }));

  // Tag tree view.
  vscode.window.createTreeView('vscodeMarkdownNotesBacklinks', {
    treeDataProvider: allTagsTreeDataProvider,
  });
  vscode.window.onDidChangeActiveTextEditor(() => {
    allTagsTreeDataProvider.reload();
  });

}
