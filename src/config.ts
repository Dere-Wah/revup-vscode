import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";
import { ensureWorkspaceExists, runCommandSilently } from "./utils";
import { getGithubUsername, isGitRepository } from "./git";

/**
 * Shows the RevUp configuration file in VS Code editor
 * @param repoConfig If true, shows repository-specific config, otherwise shows global config
 */
export async function showRepoConfig(): Promise<void> {
	try {
		let configPath: string;

		ensureWorkspaceExists();

		// Check if workspace is a Git repository
		const workspaceRoot = vscode.workspace.workspaceFolders![0]?.uri.fsPath;
		const isGitRepo =
			workspaceRoot !== undefined
				? await isGitRepository(workspaceRoot)
				: false;
		if (!isGitRepo) {
			throw new Error(
				"Current workspace is not a Git repository. Cannot create repository-specific config."
			);
		}

		configPath = path.join(workspaceRoot, ".revupconfig");

		const configUri = vscode.Uri.file(configPath);

		try {
			const doc = await vscode.workspace.openTextDocument(configUri);
			await vscode.window.showTextDocument(doc);
		} catch (error) {
			// Execute commands silently
			await runCommandSilently(`revup config remote_name origin --repo`, {
				global: false,
			});
			await runCommandSilently(`revup config main_branch main --repo`, {
				global: false,
			});

			// Try to open the file immediately since we await the commands
			try {
				const newDoc = await vscode.workspace.openTextDocument(
					configUri
				);
				await vscode.window.showTextDocument(newDoc);
			} catch (retryError) {
				vscode.window.showErrorMessage(
					`Failed to open the newly created config file: ${
						retryError instanceof Error
							? retryError.message
							: String(retryError)
					}`
				);
			}
		}
	} catch (error) {
		vscode.window.showErrorMessage(
			`Error showing config: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
}
