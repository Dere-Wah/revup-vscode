// Helper functions to deduce data from git
import { runCommandSilently } from "./utils";

/**
 * Gets the Git user name from global config
 * @returns Promise containing the user's Git name
 * @throws Error if name is not configured
 */
/**
 * Checks if a directory is a Git repository
 * @param directory The directory to check
 * @returns Promise<boolean> True if the directory is a Git repository
 */
export async function isGitRepository(directory: string): Promise<boolean> {
	try {
		await runCommandSilently("git rev-parse --is-inside-work-tree", {
			global: false,
			directory,
		});
		return true;
	} catch (error) {
		return false;
	}
}

export async function getGithubUsername(): Promise<string> {
	try {
		const { stdout } = await runCommandSilently("git config user.name", {
			global: true,
		});
		const name = stdout.trim();

		if (!name) {
			throw new Error(
				"Couldn't get git name, set it with `git config --global user.name`"
			);
		}

		return name;
	} catch (error) {
		throw new Error(
			"Couldn't get git name, set it with `git config --global user.name`"
		);
	}
}
