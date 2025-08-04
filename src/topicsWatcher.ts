import * as vscode from "vscode";
import { isGitRepository } from "./git";
import { runCommandSilently } from "./utils";

export class TopicsWatcher {
	private topics: string[] = [];
	private refreshInterval: NodeJS.Timeout | undefined;
	private static readonly REFRESH_INTERVAL_MS = 10 * 1000; // 10 seconds

	constructor() {
		// Initialize when a workspace is opened
		vscode.workspace.onDidChangeWorkspaceFolders(async (event) => {
			for (const folder of event.removed) {
				if (folder === vscode.workspace.workspaceFolders?.[0]) {
					this.clearTopics();
				}
			}

			for (const folder of event.added) {
				await this.initializeForWorkspace(folder);
			}
		});

		// Initialize for the current workspace if it exists
		if (vscode.workspace.workspaceFolders?.[0]) {
			this.initializeForWorkspace(vscode.workspace.workspaceFolders[0]);
		}
	}

	private async initializeForWorkspace(
		workspaceFolder: vscode.WorkspaceFolder
	) {
		const isGitRepo = await isGitRepository(workspaceFolder.uri.fsPath);
		if (isGitRepo) {
			await this.refreshTopics();
			this.startPeriodicRefresh();
		}
	}

	private clearTopics() {
		this.topics = [];
		this.stopPeriodicRefresh();
	}

	private async refreshTopics() {
		try {
			// Run revup toolkit list-topics command
			const { stdout } = await runCommandSilently(
				"revup toolkit list-topics",
				{ global: false }
			);

			// Split by newlines and filter out empty lines
			this.topics = stdout
				.split("\n")
				.map((topic) => topic.trim())
				.filter((topic) => topic.length > 0);
		} catch (error) {
			console.error(
				"Failed to get topics from revup:",
				error instanceof Error ? error.message : String(error)
			);
		}
	}

	private startPeriodicRefresh() {
		if (!this.refreshInterval) {
			this.refreshInterval = setInterval(
				() => this.refreshTopics(),
				TopicsWatcher.REFRESH_INTERVAL_MS
			);
		}
	}

	private stopPeriodicRefresh() {
		if (this.refreshInterval) {
			clearInterval(this.refreshInterval);
			this.refreshInterval = undefined;
		}
	}

	/**
	 * Gets the current list of topics
	 * @returns Array of unique topic values
	 */
	public getTopics(): string[] {
		return [...this.topics];
	}

	/**
	 * Manually triggers a refresh of the topics
	 * @returns Promise that resolves when the refresh is complete
	 */
	public async forceRefresh(): Promise<void> {
		await this.refreshTopics();
	}

	/**
	 * Disposes of the watcher and cleans up resources
	 */
	public dispose() {
		this.clearTopics();
	}
}
