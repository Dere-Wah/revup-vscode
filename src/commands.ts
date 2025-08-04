import * as vscode from "vscode";
import { showRepoConfig } from "./config";
import { getOrCreateTerminal, runCommandSilently } from "./utils";

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
				try {
					// Run the command silently
					await runCommandSilently(
						`revup config github_oauth ${value}`,
						{ global: false }
					);

					// Show success message
					vscode.window.showInformationMessage(
						"GitHub OAuth token configured successfully"
					);
				} catch (error) {
					vscode.window.showErrorMessage(
						`Failed to configure OAuth token: ${
							error instanceof Error
								? error.message
								: String(error)
						}`
					);
				}
			}
		}
	);

	context.subscriptions.push(disposable);
}

export function registerOpenConfigCommand(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand(
		"revup.openConfig",
		async () => {
			await showRepoConfig();
		}
	);

	context.subscriptions.push(disposable);
}

export function registerRevupUploadCommand(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand(
		"revup.upload",
		async () => {
			// Create or get the terminal
			const terminal = getOrCreateTerminal("Revup Upload");

			// Show the terminal
			terminal.show();

			// Run the revup upload command
			terminal.sendText("revup upload");
		}
	);

	context.subscriptions.push(disposable);
}
