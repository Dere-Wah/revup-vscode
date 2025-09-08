import * as vscode from "vscode";

// Define semantic token types and modifiers
const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();

const legend = new vscode.SemanticTokensLegend(
	["topic", "relative", "reviewers"],
	[]
);

const COMMIT_MSG_SELECTOR = { language: "git-commit" };

export const registerRevupProviders = (getTopics: () => string[]) => {
	// Register topic completions provider
	vscode.languages.registerCompletionItemProvider(COMMIT_MSG_SELECTOR, {
		async provideCompletionItems(document, position, token, context) {
			try {
				const topics = getTopics();

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
				const topics = getTopics();
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

				// Match relative: or # relative: lines
				const relativeMatch = text.match(/^(?:#\s*)?relative:\s*(.*)$/);
				if (relativeMatch) {
					const startIndex = text.indexOf("relative:");
					const length = text.length - startIndex; // Highlight to the end of line
					tokensBuilder.push(i, startIndex, length, 1); // 1 is the index of 'relative' in the legend
				}

				// Match reviewers: or # reviewers: lines
				const reviewersMatch = text.match(
					/^(?:#\s*)?reviewers:\s*(.*)$/
				);
				if (reviewersMatch) {
					const startIndex = text.indexOf("reviewers:");
					const length = text.length - startIndex; // Highlight to the end of line
					tokensBuilder.push(i, startIndex, length, 2); // 2 is the index of 'reviewers' in the legend
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
	// Detect current theme and set appropriate colors
	const currentTheme = vscode.window.activeColorTheme.kind;
	const isDarkTheme =
		currentTheme === vscode.ColorThemeKind.Dark ||
		currentTheme === vscode.ColorThemeKind.HighContrast;

	// Define colors based on theme for better contrast
	const colors = {
		topic: {
			// yellow/orange colors
			dark: "#f39c12", // bright orange for dark themes
			light: "#e67e22", // darker orange for light themes
		},
		relative: {
			// blue/cyan colors
			dark: "#3498db", // bright blue for dark themes
			light: "#2980b9", // darker blue for light themes
		},
		reviewers: {
			// red colors
			dark: "#e74c3c", // bright red for dark themes
			light: "#c0392b", // darker red for light themes
		},
	};

	// Set the colors for the token types
	void vscode.workspace.getConfiguration().update(
		"editor.semanticTokenColorCustomizations",
		{
			rules: {
				topic: {
					foreground: isDarkTheme
						? colors.topic.dark
						: colors.topic.light, // yellow/orange in most themes
					bold: true,
				},
				relative: {
					foreground: isDarkTheme
						? colors.relative.dark
						: colors.relative.light, // blue/cyan in most themes
					bold: true,
				},
				reviewers: {
					foreground: isDarkTheme
						? colors.reviewers.dark
						: colors.reviewers.light, // red in all themes
					bold: true,
				},
			},
		},
		vscode.ConfigurationTarget.Global
	);

	// Return disposables
	return semanticTokens;
};
