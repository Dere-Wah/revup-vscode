import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { ensureWorkspaceExists } from "./utils";
import { isGitRepository } from "./git";

/**
 * Opens an existing RevUp configuration file in VS Code editor
 * @param configPath Path to the configuration file
 */
export async function openConfig(configPath: string): Promise<void> {
	const configUri = vscode.Uri.file(configPath);
	const doc = await vscode.workspace.openTextDocument(configUri);
	await vscode.window.showTextDocument(doc);
}

/**
 * Creates a new RevUp configuration file by copying from the default template
 * @param configPath Path where the configuration file should be created
 */
export async function createConfig(configPath: string): Promise<void> {
	// Get the extension's root directory (go up one level from src)
	const extensionPath = path.resolve(__dirname, "..");

	// Path to the default config template
	const defaultConfigPath = path.join(extensionPath, ".revupconfig.default");

	// Check if the default config file exists
	if (!fs.existsSync(defaultConfigPath)) {
		throw new Error(
			`Default config template not found at: ${defaultConfigPath}`
		);
	}

	// Copy the default config to the workspace
	const defaultConfigContent = fs.readFileSync(defaultConfigPath, "utf8");
	fs.writeFileSync(configPath, defaultConfigContent, "utf8");
}

/**
 * Shows the RevUp configuration file in VS Code editor
 * Creates the config file from template if it doesn't exist
 */
export async function showRepoConfig(): Promise<void> {
	try {
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

		const configPath = path.join(workspaceRoot, ".revupconfig");

		try {
			// Try to open existing config file
			await openConfig(configPath);
		} catch (error) {
			// Config file doesn't exist, create it from template
			try {
				await createConfig(configPath);
				await openConfig(configPath);
			} catch (createError) {
				vscode.window.showErrorMessage(
					`Failed to create config file: ${
						createError instanceof Error
							? createError.message
							: String(createError)
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

/**
 * Shows the global RevUp configuration file from the user's home directory
 * Does not create the config file if it doesn't exist
 */
export async function showGlobalConfig(): Promise<void> {
	try {
		// Get the user's home directory in an OS-independent way
		const homeDir = os.homedir();
		const globalConfigPath = path.join(homeDir, ".revupconfig");

		// Check if the global config file exists
		if (!fs.existsSync(globalConfigPath)) {
			vscode.window.showErrorMessage("Global config not found");
			return;
		}

		// Open the existing global config file
		await openConfig(globalConfigPath);
	} catch (error) {
		vscode.window.showErrorMessage(
			`Error showing global config: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
}
