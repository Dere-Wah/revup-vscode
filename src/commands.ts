import * as vscode from "vscode";
import { showConfig } from "./config";
import { getGithubUsername } from "./git";

export function registerOAuthConfigCommand(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand(
		"revup.configOAuth",
		async () => {
			// Ask user if they want to open the token generation page
			const choice = await vscode.window.showQuickPick(
				[
					{
						label: "Yes",
						description: "Open browser to generate GitHub token",
					},
					{
						label: "No",
						description: "Skip and enter token directly",
					},
				],
				{
					placeHolder:
						"You must first generate an OAuth Token with scope Repo. Open a browser page to generate it?",
				}
			);

			if (choice?.label === "Yes") {
				// Open GitHub token creation page if user agrees
				await vscode.env.openExternal(
					vscode.Uri.parse(
						"https://github.com/settings/tokens/new?scopes=repo",
						true
					)
				);
			}

			// Then show input box for the token with ignoreFocusOut to prevent closing when focus changes
			const value = await vscode.window.showInputBox({
				prompt: "Enter your GitHub Personal Access Token",
				placeHolder: "Enter your GitHub Personal Access Token",
				password: true,
				ignoreFocusOut: true, // Prevent the input box from closing when focus changes
			});

			if (value) {
				// Create and show terminal
				const terminal = vscode.window.createTerminal(
					"Revup Configuration"
				);
				terminal.show();

				// Run the revup config command with the token
				terminal.sendText(`revup config github_oauth ${value}`);

				// Also copy to clipboard for convenience
				await vscode.env.clipboard.writeText(value);
			}
		}
	);

	context.subscriptions.push(disposable);
}

export function regiserGitUsernameConfigCommand(
	context: vscode.ExtensionContext
) {
	const disposable = vscode.commands.registerCommand(
		"revup.configGithubUsername",
		async () => {
			let githubUsername = "username";
			try {
				githubUsername = await getGithubUsername();
			} catch (error) {
				vscode.window.showErrorMessage(
					"Couldn't get default github username."
				);
			}
			vscode.window
				.showInputBox({
					prompt: "Enter your GitHub Username",
					placeHolder: githubUsername, //TODO calculate from current file
				})
				.then((value) => {
					if (value) {
						// Create or get the terminal
						const terminal = vscode.window.createTerminal("Revup");

						// Show the terminal
						terminal.show();

						// Run the revup config command
						terminal.sendText(
							`revup config github_username ${value}`
						);
					}
				});
		}
	);

	context.subscriptions.push(disposable);
}

export function registerOpenConfigCommand(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand(
		"revup.openConfig",
		async () => {
			const choice = await vscode.window.showQuickPick(
				[
					{
						label: "User Configuration",
						description: `Open User Revup configuration file (${
							process.env.REVUP_CONFIG_PATH
								? "$REVUP_CONFIG_PATH"
								: "~/.revupconfig"
						})`,
					},
					{
						label: "Repo Configuration",
						description:
							"Open repository-specific Revup configuration (.revupconfig)",
					},
				],
				{
					placeHolder: "Select which configuration file to open",
				}
			);

			if (choice?.label === "User Configuration") {
				await showConfig(false);
			} else if (choice?.label === "Repo Configuration") {
				await showConfig(true);
			}
		}
	);

	context.subscriptions.push(disposable);
}
