// Regular expression for parsing tags
export const RE_TAGS = /^(?<tagname>[a-zA-Z\-]+):(?<tagvalue>.*)$/m;

// Tag constants
export const TAG_REVIEWER = "reviewer";
export const TAG_ASSIGNEE = "assignee";
export const TAG_BRANCH = "branch";
export const TAG_LABEL = "label";
export const TAG_TOPIC = "topic";
export const TAG_RELATIVE = "relative";
export const TAG_RELATIVE_BRANCH = "relative-branch";
export const TAG_UPLOADER = "uploader";
export const TAG_UPDATE_PR_BODY = "update-pr-body";
export const TAG_BRANCH_FORMAT = "branch-format";

// Set of valid tags
export const VALID_TAGS = new Set([
	TAG_BRANCH,
	TAG_LABEL,
	TAG_RELATIVE,
	TAG_RELATIVE_BRANCH,
	TAG_REVIEWER,
	TAG_ASSIGNEE,
	TAG_TOPIC,
	TAG_UPLOADER,
	TAG_UPDATE_PR_BODY,
	TAG_BRANCH_FORMAT,
]);

import { getCommitMessages } from "./git";

/**
 * Gets all unique topics from commit messages in the repository
 * @returns Promise containing an array of unique topic values found in commit messages
 * @throws Error if getting commit messages fails
 */
export async function getAllTopics(): Promise<string[]> {
	// Get all commit messages
	const commitMessages = await getCommitMessages();

	// Set to store unique topics
	const topics = new Set<string>();

	// Go through each commit message
	for (const message of commitMessages) {
		// Check each line of the commit message
		for (const line of message) {
			const match = RE_TAGS.exec(line);
			if (match?.groups && match.groups.tagname === TAG_TOPIC) {
				const topic = match.groups.tagvalue.trim();
				if (topic) {
					topics.add(topic);
				}
			}
		}
	}

	// Convert Set to array and return
	return Array.from(topics);
}
