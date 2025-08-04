import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";
import { ensureWorkspaceExists, runCommandSilently } from "./utils";
import { getGithubUsername, isGitRepository } from "./git";

/**
 * Shows the RevUp configuration file in VS Code editor
 * @param repoConfig If true, shows repository-specific config, otherwise shows global config
 */
export async function showConfig(repoConfig: boolean): Promise<void> {
	try {
		if (repoConfig) {
			ensureWorkspaceExists();

			// Check if workspace is a Git repository
			const workspaceRoot =
				vscode.workspace.workspaceFolders![0].uri.fsPath;
			const isGitRepo = await isGitRepository(workspaceRoot);
			if (!isGitRepo) {
				throw new Error(
					"Current workspace is not a Git repository. Cannot create repository-specific config."
				);
			}
		}

		const configPath = repoConfig
			? path.join(
					vscode.workspace.workspaceFolders![0].uri.fsPath,
					".revupconfig"
			  )
			: process.env.REVUP_CONFIG_PATH ||
			  path.join(os.homedir(), ".revupconfig");

		const configUri = vscode.Uri.file(configPath);

		try {
			const doc = await vscode.workspace.openTextDocument(configUri);
			await vscode.window.showTextDocument(doc);
		} catch (error) {
			// File doesn't exist, ask if user wants to create it
			const choice = await vscode.window.showQuickPick(
				[
					{
						label: "Yes",
						description: "Create new configuration file",
					},
					{
						label: "No",
						description: "Cancel",
					},
				],
				{
					placeHolder:
						"No configuration found. Do you want to create it?",
				}
			);

			if (choice?.label === "Yes") {
				try {
					// Run the initial configuration commands silently
					const repoFlag = repoConfig ? " --repo" : "";
					const githubUsername = await getGithubUsername();

					// Execute commands silently
					await runCommandSilently(
						`revup config remote_name origin${repoFlag}`,
						!repoConfig
					);
					await runCommandSilently(
						`revup config main_branch main${repoFlag}`,
						!repoConfig
					);
					await runCommandSilently(
						`revup config github_username ${githubUsername}${repoFlag}`,
						!repoConfig
					);

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
				} catch (error) {
					vscode.window.showErrorMessage(
						`Error running configuration commands: ${
							error instanceof Error
								? error.message
								: String(error)
						}`
					);
				}
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
