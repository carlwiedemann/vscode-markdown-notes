import * as vscode from 'vscode';


export type FileWithLocations = {
  file: string;
  locations: vscode.Location[];
};
