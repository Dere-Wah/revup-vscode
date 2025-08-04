// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {
	registerOAuthConfigCommand,
	registerOpenConfigCommand,
	registerRevupUploadCommand,
} from "./commands";
import { StatusBar } from "./StatusBar";
import { registerRevupProviders } from "./providers";
import { activateFileWatcher } from "./fileSystemWatcher";
import { TopicsWatcher } from "./topicsWatcher";

let revupStatusBarItem: StatusBar;
let topicsWatcher: TopicsWatcher;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log(
		'Congratulations, your extension "revup-vscode" is now active!!!'
	);

	registerOAuthConfigCommand(context);
	registerOpenConfigCommand(context);
	registerRevupUploadCommand(context);

	revupStatusBarItem = new StatusBar();

	topicsWatcher = new TopicsWatcher();

	registerRevupProviders(topicsWatcher.getTopics.bind(topicsWatcher));

	// Activate the commit message file watcher
	activateFileWatcher(context, topicsWatcher.getTopics.bind(topicsWatcher));

	context.subscriptions.push(revupStatusBarItem);
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(revupStatusBarItem.update)
	);
	context.subscriptions.push(
		vscode.window.onDidChangeTextEditorSelection(revupStatusBarItem.update)
	);

	revupStatusBarItem.update();
}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log("Deactivating Revup VSCode extension");
}
