import * as vscode from 'vscode';
import { AllTagsTreeDataProvider } from './AllTagsTreeDataProvider';
import { TagReferenceProvider } from './TagReferenceProvider';
import { TagCompletionItemProvider } from './TagCompletionItemProvider';
import { TagDataSource } from './TagDataSource';
import * as got from 'got';
import { Tag } from "./Tag";

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
    vscode.languages.registerReferenceProvider(documentSelector, new TagReferenceProvider())
  );

  // Completion.
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(documentSelector, new TagCompletionItemProvider(), '#')
  );

  // Flagr hover.
  // @todo How to extract/isolate this?
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
    let parsed = TagDataSource.parseString(e.document.getText());
    TagDataSource.registerTempTags(e.document.uri.fsPath, parsed);
    // Clear refs on save/delete.
    if (parsed.length > 0) {
      allTagsTreeDataProvider.reload();
    }
  });

  // New tag from selection command.
  context.subscriptions.push(vscode.commands.registerCommand('clutter.newTagFromSelection', function () {
    const originEditor = vscode.window.activeTextEditor;

    if (!originEditor) {
      return;
    }

    const { selection } = originEditor;
    const text = originEditor.document.getText(selection);
    const originSelectionRange = new vscode.Range(selection.start, selection.end);

    if (text === '') {
      vscode.window.showErrorMessage('Error creating tag from selection: selection is empty.');
    } else {
      const edit = new vscode.WorkspaceEdit();
      edit.replace(originEditor.document.uri, originSelectionRange, Tag.fullTextFromInnerText(text));
      vscode.workspace.applyEdit(edit);
    }
  }));

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
  vscode.window.createTreeView('vscodeClutterAllTags', {
    treeDataProvider: allTagsTreeDataProvider,
  });
  vscode.window.onDidChangeActiveTextEditor(() => {
    allTagsTreeDataProvider.reload();
  });

}
