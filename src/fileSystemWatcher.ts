import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { isGitRepository } from "./git";
import { TopicsWatcher } from "./topicsWatcher";

// Keep track of active watchers per workspace
const activeWatchers = new Map<string, CommitMessageWatcher>();

export class CommitMessageWatcher {
	private fileWatcher: vscode.FileSystemWatcher | undefined;
	private disposables: vscode.Disposable[] = [];

	constructor(
		private workspaceRoot: string,
		private getTopics: () => string[]
	) {
		this.setupWatcher();
	}

	private setupWatcher() {
		// Create a file system watcher for COMMIT_EDITMSG
		const pattern = new vscode.RelativePattern(
			this.workspaceRoot,
			".git/COMMIT_EDITMSG"
		);
		this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

		// Watch for changes to the file
		this.fileWatcher.onDidChange(this.handleCommitMessageChange.bind(this));
		this.fileWatcher.onDidCreate(this.handleCommitMessageChange.bind(this));

		// Add watcher to disposables
		this.disposables.push(this.fileWatcher);
	}

	private async handleCommitMessageChange(uri: vscode.Uri) {
		try {
			// Read the file content
			const content = await fs.promises.readFile(uri.fsPath, "utf8");
			const lines = content.split("\n");

			// Check if the file matches our criteria:
			// - First line is empty
			// - Second line starts with #
			if (
				lines.length >= 2 &&
				lines[0].trim() === "" &&
				lines[1].startsWith("#")
			) {
				// Add 'topic: ' to the second line if it doesn't already have it
				if (!lines[1].includes("topic:")) {
					// Get all available topics using the provided method
					const topics = this.getTopics();

					// Format topics into lines of max 80 characters
					const formattedTopics = this.formatTopicList(topics);

					// Replace the comment with our template
					lines[1] = lines[1].replace("#", "topic: \n#relative: \n#");

					// Add the topic list after the template
					if (topics.length > 0) {
						lines.splice(
							2,
							0,
							"#",
							"# Available topics:",
							...formattedTopics
						);
					}

					// Write the modified content back to the file
					await fs.promises.writeFile(
						uri.fsPath,
						lines.join("\n"),
						"utf8"
					);
				}
			}
		} catch (error) {
			console.error("Error handling commit message change:", error);
		}
	}

	private formatTopicList(topics: string[]): string[] {
		return topics.map((topic) => `# topic: ${topic}`);
	}

	dispose() {
		this.disposables.forEach((d) => d.dispose());
	}
}

export async function activateFileWatcher(
	context: vscode.ExtensionContext,
	getTopics: () => string[]
) {
	// Setup workspace change handling
	context.subscriptions.push(
		vscode.workspace.onDidChangeWorkspaceFolders(async (event) => {
			// Clean up removed workspaces
			for (const workspace of event.removed) {
				const watcher = activeWatchers.get(workspace.uri.fsPath);
				if (watcher) {
					watcher.dispose();
					activeWatchers.delete(workspace.uri.fsPath);
				}
			}

			// Initialize new workspaces
			for (const workspace of event.added) {
				await initializeWorkspaceWatcher(
					context,
					workspace.uri.fsPath,
					getTopics
				);
			}
		})
	);

	// Initialize watchers for existing workspaces
	if (vscode.workspace.workspaceFolders) {
		for (const folder of vscode.workspace.workspaceFolders) {
			await initializeWorkspaceWatcher(
				context,
				folder.uri.fsPath,
				getTopics
			);
		}
	}
}

async function initializeWorkspaceWatcher(
	context: vscode.ExtensionContext,
	workspaceRoot: string,
	getTopics: () => string[]
) {
	// Check if workspace is a git repository
	if (!(await isGitRepository(workspaceRoot))) {
		return;
	}

	// Clean up existing watcher if any
	const existingWatcher = activeWatchers.get(workspaceRoot);
	if (existingWatcher) {
		existingWatcher.dispose();
		activeWatchers.delete(workspaceRoot);
	}

	// Create new watchers
	const topicsWatcher = new TopicsWatcher();
	const watcher = new CommitMessageWatcher(workspaceRoot, getTopics);
	activeWatchers.set(workspaceRoot, watcher);
	context.subscriptions.push(watcher, topicsWatcher);
}
