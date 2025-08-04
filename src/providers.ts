import * as vscode from "vscode";
import { getAllTopics } from "./revup";

// Define semantic token types and modifiers
const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();

const legend = new vscode.SemanticTokensLegend(["topic"], []);

const COMMIT_MSG_SELECTOR = {
	scheme: "file",
	pattern: "**/.git/COMMIT_EDITMSG",
};

export const registerRevupProviders = () => {
	// Register topic completions provider
	vscode.languages.registerCompletionItemProvider(COMMIT_MSG_SELECTOR, {
		async provideCompletionItems(document, position, token, context) {
			try {
				const topics = await getAllTopics();

				const completionItems = topics.flatMap((topic) => {
					const topicCompletion = new vscode.CompletionItem(
						`topic: ${topic}`
					);
					const relativeCompletion = new vscode.CompletionItem(
						`relative: ${topic}`
					);

					return [topicCompletion, relativeCompletion];
				});

				return completionItems;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				void vscode.window.showErrorMessage(
					`Failed to get completions: ${errorMessage}`
				);
				return [];
			}
		},
	});

	// Register hover provider
	vscode.languages.registerHoverProvider(COMMIT_MSG_SELECTOR, {
		async provideHover(document, position, token) {
			const lineText = document.lineAt(position.line).text;
			const wordRange = document.getWordRangeAtPosition(
				position,
				/topic:|relative:/
			);

			if (!wordRange) {
				return;
			}

			const word = document.getText(wordRange);

			try {
				const topics = await getAllTopics();
				let description = "";

				if (word === "topic:") {
					description =
						"Creates a new topic branch based on the selected topic.\n\n";
					description += "Available topics:\n";
					description += topics
						.map((topic) => `- ${topic}`)
						.join("\n");
				} else if (word === "relative:") {
					description =
						"Creates a branch relative to an existing topic branch.\n\n";
					description += "Available topics:\n";
					description += topics
						.map((topic) => `- ${topic}`)
						.join("\n");
				}

				if (description) {
					return new vscode.Hover(description);
				}
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				void vscode.window.showErrorMessage(
					`Failed to get topics: ${errorMessage}`
				);
			}
		},
	});

	// Register semantic tokens provider
	const semanticTokensProvider: vscode.DocumentSemanticTokensProvider = {
		provideDocumentSemanticTokens(
			document: vscode.TextDocument
		): vscode.SemanticTokens {
			const tokensBuilder = new vscode.SemanticTokensBuilder(legend);

			// Process each line of the document
			for (let i = 0; i < document.lineCount; i++) {
				const line = document.lineAt(i);
				const text = line.text;

				// Match topic: or # topic: lines
				const topicMatch = text.match(/^(?:#\s*)?topic:\s*(.*)$/);
				if (topicMatch) {
					const startIndex = text.indexOf("topic:");
					const length = text.length - startIndex; // Highlight to the end of line
					tokensBuilder.push(i, startIndex, length, 0); // 0 is the index of 'topic' in the legend
				}
			}

			return tokensBuilder.build();
		},
	};

	// Register the provider
	const semanticTokens =
		vscode.languages.registerDocumentSemanticTokensProvider(
			COMMIT_MSG_SELECTOR,
			semanticTokensProvider,
			legend
		);

	// Set the color for the 'topic' token type
	void vscode.workspace.getConfiguration().update(
		"editor.semanticTokenColorCustomizations",
		{
			rules: {
				topic: {
					foreground: "#C586C0", // Purple color (you can adjust this hex code)
				},
			},
		},
		vscode.ConfigurationTarget.Global
	);
};
