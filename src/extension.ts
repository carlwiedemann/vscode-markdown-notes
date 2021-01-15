import * as vscode from 'vscode';
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
  // We should modify this to make it work for tags.
  const backlinksTreeDataProvider = new BacklinksTreeDataProvider(
    vscode.workspace.rootPath || null
  );

  // Observe changes to a document.
  vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
    let parsed = Note.parseString(e.document.getText());
    TagDataSource.registerTempRefs(e.document.uri.fsPath, parsed);
    // Clear refs on save/delete.
    if (parsed.length > 0) {
      backlinksTreeDataProvider.reload();
    }
  });

  // New note from selection command.
  context.subscriptions.push(vscode.commands.registerCommand('clutter.newTagFromSelection', NoteWorkspace.newTagFromSelection));

  context.subscriptions.push(vscode.commands.registerCommand('clutter.insertTag', function (content: string) {
    // Get the active text editor
    const editor = vscode.window.activeTextEditor;

    if (editor) {
      // const document = editor.document;
      const selection = editor.selection;

      // Get the word within the selection
      // const word = document.getText(selection);
      // const reversed = word.split('').reverse().join('');
      editor.edit(editBuilder => {
        // editBuilder.replace(selection, reversed);
        editBuilder.insert(selection.start, content);
      });
    }
  }));

  // NoteParser.hydrateCache();


  vscode.window.onDidChangeActiveTextEditor(() => backlinksTreeDataProvider.reload());
  const treeView = vscode.window.createTreeView('vscodeMarkdownNotesBacklinks', {
    treeDataProvider: backlinksTreeDataProvider,
  });

}
