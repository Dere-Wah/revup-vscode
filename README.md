# revup-vscode

A VS Code extension that integrates with
[skydio/revup](https://github.com/skydio/revup) to enhance your GitHub PR
workflow with smart commit messages and topic management.

## Installation

Since this extension is not yet published on the VS Code Marketplace (we are
currently working on finding a publisher), you can install it manually:

1. **Download the Extension**: Go to the
   [Releases](https://github.com/derewah/revup-vscode/releases) page and
   download the latest `.vsix` file
2. **Install from VSIX**: In VS Code, open the Command Palette (`Ctrl+Shift+P` /
   `Cmd+Shift+P`) and run the command `Extensions: Install from VSIX...`
3. **Select the Downloaded File**: Choose the `.vsix` file you downloaded
4. **Start Using**: Once the extension is installed, you can start using it
   immediately. If revup is not found on your system, the extension will
   automatically prompt you to install it

> **Note**: I am currently working on getting this extension published to the VS
> Code Marketplace for easier installation. Until then, manual installation via
> VSIX is required.

## Prerequisites

This extension requires `revup` to be installed on your system. Currently, the
extension does not handle the installation of `revup`. Please follow the
installation instructions in the [revup README](https://github.com/skydio/revup)
to set up the core tool first.

## Features

### 1. VSCode Commands

-   **Configure GitHub OAuth Token** (`revup.configOAuth`): Set up your GitHub
    OAuth token for authentication
-   **Configure Branch Naming Style** (`revup.configBranchNamingStyle`):
    Customize how your branch names are formatted
-   **Open Configuration File** (`revup.openConfig`): Quick access to your revup
    configuration
-   **Revup Upload** (`revup.upload`): Trigger revup upload directly from VS
    Code

### 2. Smart Commit Messages

<img width="747" height="327" alt="image" src="https://github.com/user-attachments/assets/d8ff55c1-747d-4587-b88e-5918926b72b2" />

-   Automatically templates your COMMIT_EDITMSG file when creating a new commit
-   Adds the current topic and relative key ready to use
-   Displays all active topics in your repository for reference

### 3. Commit Message Auto-completion

![auto](https://github.com/user-attachments/assets/875e5e5b-a26d-423d-9784-427514fe0fb7)

-   Intelligent auto-completion for commit messages
-   Suggests topics based on your repository's active topics
-   Makes it easier to maintain consistent commit message formatting

### 4. Quick Access Status Bar

-   Convenient status bar item for quick access to revup upload
-   Visual indicator for revup integration status

## Requirements

1. Install revup by following the instructions at
   [skydio/revup](https://github.com/skydio/revup)
2. Configure your GitHub OAuth token using the
   `Revup: Configure Github OAuth Key` command
3. Set up your preferred branch naming style using
   `Revup: Configure Branch Naming Style`

## Extension Settings

This extension contributes the following settings through VS Code's settings:

-   `revup.revupConfiguration`: Access and modify your revup configuration

## Known Issues

Please report any issues on the
[GitHub repository](https://github.com/derewah/revup-vscode/issues).

## Release Notes

### 0.0.1

-   Initial release
-   Basic integration with revup
-   Commit message templating
-   Topic-aware auto-completion
-   Status bar integration

## Upcoming Features

The following features are currently being worked on:

-   **Auto Installation**: Automatic installation of revup during extension
    setup
-   **VSCode Settings Integration**: Improved configuration interface that
    integrates seamlessly with VSCode's native settings system
-   **Extended Revup Features**: Additional functionality beyond the basic
    features:
    -   (More features to be announced)
