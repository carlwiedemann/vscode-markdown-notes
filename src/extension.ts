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
