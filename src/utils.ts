import { Uri, workspace, type TextDocument } from "vscode";
import { RevupVSCodeConfig } from "./types";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Executes a command silently (without showing a terminal)
 * @param command The command to execute
 * @param globalOrDirectory If true/undefined, executes globally. If false, executes in workspace directory. If string, executes in that directory.
 * @returns Promise containing stdout and stderr
 */
export async function runCommandSilently(
	command: string,
	globalOrDirectory: boolean | string = true
): Promise<{ stdout: string; stderr: string }> {
	try {
		let options: { cwd?: string } | undefined;

		if (typeof globalOrDirectory === "string") {
			options = { cwd: globalOrDirectory };
		} else if (!globalOrDirectory) {
			if (!workspace.workspaceFolders?.length) {
				throw new Error(
					"No workspace is open. Cannot execute workspace-scoped command."
				);
			}
			options = {
				cwd: workspace.workspaceFolders[0].uri.fsPath,
			};
		}

		const { stdout, stderr } = await execAsync(command, options);
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
	if (!workspace.workspaceFolders?.length) {
		throw new Error(
			"No workspace is open. Cannot access repository-specific config."
		);
	}
}

export function getConfig(scope?: TextDocument | Uri): RevupVSCodeConfig {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const config = workspace.getConfiguration(
		"revup-vscode",
		scope
	) as unknown as RevupVSCodeConfig;

	// Some settings are disabled for untrusted workspaces
	// because they can be used for bad things.
	if (!workspace.isTrusted) {
		const newConfig = {
			...config,
			user: undefined,
		};
		return newConfig;
	}

	return config;
}
