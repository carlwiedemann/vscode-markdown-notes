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

  // console.debug('vscode-markdown-notes.activate');

  const ds = NoteWorkspace.DOCUMENT_SELECTOR;

  //////////////
  // COMMANDS //
  //////////////

  // TODO: REMOVE
  NoteWorkspace.overrideMarkdownWordPattern(); // still nec to get ../ to trigger suggestions in `relativePaths` mode

  // TODO: We should have a tag reference provider.
  context.subscriptions.push(
    vscode.languages.registerReferenceProvider(ds, new MarkdownReferenceProvider())
  );

  // TODO: We should have a tag completion provider.
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(ds, new MarkdownFileCompletionItemProvider())
  );

  // This appears to be suggestion based.
  vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
    NoteParser.updateCacheFor(e.document.uri.fsPath);

    if (NoteWorkspace.triggerSuggestOnReplacement()) {
      // See discussion on https://github.com/kortina/vscode-markdown-notes/pull/69/
      const shouldSuggest = e.contentChanges.some((change) => {
        const ref = getRefAt(e.document, change.range.end);
        return ref.type != RefType.Null && change.rangeLength > ref.text.length;
      });
      if (shouldSuggest) {
        vscode.commands.executeCommand('editor.action.triggerSuggest');
      }
    }
  });

  //////////////
  // COMMANDS //
  //////////////

  let newNoteDisposable = vscode.commands.registerCommand(
    'vscodeMarkdownNotes.newNote',
    NoteWorkspace.newNote
  );
  context.subscriptions.push(newNoteDisposable);

  let newNoteFromSelectionDisposable = vscode.commands.registerCommand(
    'vscodeMarkdownNotes.newNoteFromSelection',
    NoteWorkspace.newNoteFromSelection
  );
  context.subscriptions.push(newNoteFromSelectionDisposable);

  // parse the tags from every file in the workspace
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
