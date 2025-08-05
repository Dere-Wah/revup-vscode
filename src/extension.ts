// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {
	registerOAuthConfigCommand,
	registerOpenConfigCommand,
	registerRevupUploadCommand,
	registerRevupInstallCommand,
} from "./commands";
import { registerRevupProviders } from "./providers";
import { activateFileWatcher } from "./fileSystemWatcher";
import { Revup } from "./revup";

let revupInstance: Revup;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log(
		'Congratulations, your extension "revup-vscode" is now active!!!'
	);

	revupInstance = new Revup();

	registerOAuthConfigCommand(context, revupInstance);
	registerOpenConfigCommand(context, revupInstance);
	registerRevupUploadCommand(context, revupInstance);
	registerRevupInstallCommand(context, revupInstance);

	registerRevupProviders(revupInstance.getTopics.bind(revupInstance));

	// Activate the commit message file watcher
	activateFileWatcher(context, revupInstance.getTopics.bind(revupInstance));

	context.subscriptions.push(revupInstance.getStatusBar());
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(
			revupInstance.getStatusBar().update
		)
	);
	context.subscriptions.push(
		vscode.window.onDidChangeTextEditorSelection(
			revupInstance.getStatusBar().update
		)
	);
}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log("Deactivating Revup VSCode extension");
}
