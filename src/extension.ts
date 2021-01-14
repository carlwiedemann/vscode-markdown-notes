import * as vscode from 'vscode';
import { BacklinksTreeDataProvider } from './BacklinksTreeDataProvider';
import { MarkdownReferenceProvider } from './MarkdownReferenceProvider';
import { MarkdownFileCompletionItemProvider } from './MarkdownFileCompletionItemProvider';
import { NoteWorkspace } from './NoteWorkspace';
import { NoteParser } from './NoteParser';
import { getRefAt, RefType } from './Ref';
// import { debug } from 'util';
// import { create } from 'domain';

export function activate(context: vscode.ExtensionContext) {

  const ds = NoteWorkspace.DOCUMENT_SELECTOR;

  // References.
  context.subscriptions.push(
    vscode.languages.registerReferenceProvider(ds, new MarkdownReferenceProvider())
  );

  // Completion
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(ds, new MarkdownFileCompletionItemProvider(), '#')
  );

  // Observe changes to a document.
  vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
    // We update the cache for the given path.
    NoteParser.updateCacheFor(e.document.uri.fsPath);
  });

  // New note from selection command.
  context.subscriptions.push(vscode.commands.registerCommand('clutter.newTagFromSelection', NoteWorkspace.newTagFromSelection));

  NoteParser.hydrateCache();

  // We should modify this to make it work for tags.
  const backlinksTreeDataProvider = new BacklinksTreeDataProvider(
    vscode.workspace.rootPath || null
  );
  vscode.window.onDidChangeActiveTextEditor(() => backlinksTreeDataProvider.reload());
  const treeView = vscode.window.createTreeView('vscodeMarkdownNotesBacklinks', {
    treeDataProvider: backlinksTreeDataProvider,
  });

}
