import * as vscode from "vscode";
import { isGitRepository } from "./git";
import { runCommandSilently, getOrCreateTerminal } from "./utils";
import { StatusBar } from "./StatusBar";

export class Revup {
	private topics: string[] = [];
	private refreshInterval: NodeJS.Timeout | undefined;
	private static readonly REFRESH_INTERVAL_MS = 10 * 1000; // 10 seconds
	private installed: boolean | undefined;
	private statusBar: StatusBar;

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

		this.statusBar = new StatusBar(this);
	}

	private async initializeForWorkspace(
		workspaceFolder: vscode.WorkspaceFolder
	) {
		const isGitRepo = await isGitRepository(workspaceFolder.uri.fsPath);
		if (isGitRepo) {
			// Check if revup is installed before proceeding
			if (this.installed === undefined) {
				await this.isRevupInstalled();
			}

			if (this.installed) {
				await this.refreshTopics();
				this.startPeriodicRefresh();
			}
		}
	}

	private clearTopics() {
		this.topics = [];
		this.stopPeriodicRefresh();
	}

	private async refreshTopics() {
		// Don't refresh if revup is not installed
		if (this.installed === false) {
			return;
		}

		// Check installation status if undefined
		if (this.installed === undefined) {
			await this.isRevupInstalled();
			if (!this.installed) {
				return;
			}
		}

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
		if (!this.refreshInterval && this.installed !== false) {
			this.refreshInterval = setInterval(
				() => this.refreshTopics(),
				Revup.REFRESH_INTERVAL_MS
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

	public getStatusBar(): StatusBar {
		return this.statusBar;
	}

	/**
	 * Checks if revup CLI is installed by attempting to run 'revup --version'
	 * @returns Promise<boolean> indicating whether revup is installed
	 */
	public async isRevupInstalled(): Promise<boolean> {
		try {
			await runCommandSilently("revup --version");
			this.setInstallationStatus(true);
			return true;
		} catch (error) {
			const response = await vscode.window.showErrorMessage(
				"Revup CLI is not installed. Would you like to install it?",
				"Yes",
				"No"
			);

			if (response === "Yes") {
				const terminal = getOrCreateTerminal("Revup Installation");
				terminal.show();
				terminal.sendText("pip install revup");
				this.setInstallationStatus(undefined);
			} else {
				this.setInstallationStatus(false);
			}

			return false;
		}
	}

	/**
	 * Gets the current installation status
	 * @returns The installation status (true/false/undefined)
	 */
	public getInstallationStatus(): boolean | undefined {
		return this.installed;
	}

	/**
	 * Sets the installation status
	 * @param installed The new installation status
	 */
	public setInstallationStatus(installed: boolean | undefined): void {
		const wasInstalled = this.installed;
		this.installed = installed;

		// If revup was just installed, start refreshing
		if (!wasInstalled && installed) {
			this.refreshTopics();
			this.startPeriodicRefresh();
		}
		// If revup was uninstalled, stop refreshing
		else if (wasInstalled && !installed) {
			this.stopPeriodicRefresh();
			this.clearTopics();
		}
		this.statusBar.update();
	}

	/**
	 * Disposes of the watcher and cleans up resources
	 */
	public dispose() {
		this.clearTopics();
	}
}
