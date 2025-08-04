import { runCommandSilently } from "./utils";

/**
 * Gets all unique topics from the repository using revup toolkit
 * @returns Promise containing an array of unique topic values
 * @throws Error if running revup toolkit list-topics command fails
 */
export async function getAllTopics(): Promise<string[]> {
	try {
		// Run revup toolkit list-topics command
		const { stdout } = await runCommandSilently(
			"revup toolkit list-topics",
			{ global: false }
		);

		// Split by newlines and filter out empty lines
		const topics = stdout
			.split("\n")
			.map((topic) => topic.trim())
			.filter((topic) => topic.length > 0);

		return topics;
	} catch (error) {
		throw new Error(
			`Failed to get topics from revup: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
}
