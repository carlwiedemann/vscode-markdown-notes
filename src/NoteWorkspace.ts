import * as vscode from 'vscode';

// This class contains:
// 1. an interface to some of the basic user configurable settings or this extension
// 2. command for creating a New Note
// 3. some other bootstrapping
export class NoteWorkspace {
  // Defining these as strings now, and then compiling them with accessor methods.
  // This will allow us to potentially expose these as settings.
  static clutterTagFromText(text: string) {
    // We use this formatting here so that we don't
    // mistake this as a clutter tag itself :).
    return `[` + `#${text}#` + `]`;
  }

  static innerTextFromFullText(fullText: string) {
    return fullText.replace('[#', '').replace('#]', '');
  }

  static rxClutterTag(): RegExp {
    return /\[\#[^\#]+\#\]/gi;
  }

  static rxClutterTagStart(): RegExp {
    return /\[\#/;
  }

  static newTagFromSelection() {
    const originEditor = vscode.window.activeTextEditor;

    if (!originEditor) {
      return;
    }

    const { selection } = originEditor;
    const text = originEditor.document.getText(selection);
    const originSelectionRange = new vscode.Range(selection.start, selection.end);

    if (text === '') {
      vscode.window.showErrorMessage('Error creating tag from selection: selection is empty.');
    }
    else {
      const edit = new vscode.WorkspaceEdit();
      edit.replace(originEditor.document.uri, originSelectionRange, NoteWorkspace.clutterTagFromText(text));
      vscode.workspace.applyEdit(edit);
      // NoteParser.updateCacheFor(originEditor.document.uri.fsPath);
    }
  }

}
