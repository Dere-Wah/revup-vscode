// Helper functions to deduce data from git
import { runCommandSilently } from "./utils";

/**
 * Gets the Git user email from global config
 * @returns Promise containing the user's Git email
 * @throws Error if email is not configured
 */
export async function getGithubEmail(): Promise<string> {
	try {
		const { stdout } = await runCommandSilently("git config user.email");
		const email = stdout.trim();

		if (!email) {
			throw new Error(
				"Couldn't get git email, set it with `git config --global user.email`"
			);
		}

		return email;
	} catch (error) {
		throw new Error(
			"Couldn't get git email, set it with `git config --global user.email`"
		);
	}
}

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
		await runCommandSilently(
			"git rev-parse --is-inside-work-tree",
			directory
		);
		return true;
	} catch (error) {
		return false;
	}
}

export async function getGithubUsername(): Promise<string> {
	try {
		const { stdout } = await runCommandSilently("git config user.name");
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

/**
 * Gets all commit messages from the repository (both local and remote)
 * @returns Promise containing an array of commit messages, where each message is an array of lines
 * @throws Error if not in a git repository or if git log fails
 */
export async function getCommitMessages(): Promise<string[][]> {
	try {
		// First ensure we're in a git repository
		const isRepo = await isGitRepository(process.cwd());
		if (!isRepo) {
			throw new Error("Not in a git repository");
		}

		// Get all commit messages using git log
		// %B gives us the raw body of the commit message
		// --all includes all refs/heads for local and remote branches
		const { stdout } = await runCommandSilently(
			'git log --all --format="%B%x00"',
			false
		);

		// Split by null character to get individual commit messages
		// Filter out empty messages and split each message into lines
		return stdout
			.split("\0")
			.filter((msg) => msg.trim().length > 0)
			.map((msg) =>
				msg
					.trim()
					.split("\n")
					.filter((line) => line.trim().length > 0)
			);
	} catch (error) {
		throw new Error(
			`Failed to get commit messages: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
}
