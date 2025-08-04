import * as vscode from "vscode";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

type CommandExecutionOptions =
	| { global: true; directory?: undefined }
	| { global: false; directory?: string };

/**
 * Executes a command silently (without showing a terminal)
 * @param command The command to execute
 * @param options Execution options: { global: true } for global execution, { global: false, directory?: string } for workspace execution (uses workspace root if directory not provided)
 * @returns Promise containing stdout and stderr
 */
export async function runCommandSilently(
	command: string,
	options: CommandExecutionOptions = { global: true }
): Promise<{ stdout: string; stderr: string }> {
	try {
		let execOptions: { cwd?: string } | undefined;

		if (!options.global) {
			if (options.directory) {
				execOptions = { cwd: options.directory };
			} else {
				if (!vscode.workspace.workspaceFolders?.[0]?.uri) {
					throw new Error("No workspace is open.");
				}

				if (
					!vscode.workspace.workspaceFolders?.length ||
					!vscode.workspace.workspaceFolders[0]
				) {
					throw new Error(
						"No workspace is open. Cannot execute workspace-scoped command."
					);
				}
				execOptions = {
					cwd: vscode.workspace.workspaceFolders[0].uri.fsPath,
				};
			}
		}

		const { stdout, stderr } = await execAsync(command, execOptions);
		return {
			stdout: stdout.toString(),
			stderr: stderr.toString(),
		};
	} catch (error) {
		throw new Error(
			`Failed to execute command: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
}

/**
 * Checks if a workspace is open and throws an error if not
 * @throws {Error} If no workspace is open
 */
export function ensureWorkspaceExists(): void {
	if (
		!vscode.workspace.workspaceFolders?.length ||
		!vscode.workspace.workspaceFolders[0]
	) {
		throw new Error(
			"No workspace is open. Cannot access repository-specific config."
		);
	}
}

/**
 * Creates a new terminal with the specified name or returns an existing one if it already exists
 * @param name The name for the terminal
 * @returns The terminal instance
 */
export function getOrCreateTerminal(name: string) {
	// Try to find an existing terminal with the given name
	const existingTerminal = vscode.window.terminals.find(
		(t) => t.name === name
	);
	if (existingTerminal) {
		return existingTerminal;
	}

	// Create a new terminal if none exists
	return vscode.window.createTerminal(name);
}
