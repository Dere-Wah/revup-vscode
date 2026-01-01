import * as vscode from "vscode";
import * as fs from "fs";
import { isGitRepository } from "./git";
import { runCommandSilently } from "./utils";

// Keep track of active watchers per workspace
const activeWatchers = new Map<string, CommitMessageWatcher>();

export class CommitMessageWatcher {
  private fileWatcher: vscode.FileSystemWatcher | undefined;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private workspaceRoot: string,
    private getTopics: () => string[]
  ) {
    this.setupWatcher();
  }

  private setupWatcher() {
    // Create a file system watcher for COMMIT_EDITMSG
    const pattern = new vscode.RelativePattern(
      this.workspaceRoot,
      ".git/COMMIT_EDITMSG"
    );
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

    // Watch for changes to the file
    this.fileWatcher.onDidChange(this.handleCommitMessageChange.bind(this));
    this.fileWatcher.onDidCreate(this.handleCommitMessageChange.bind(this));

    // Add watcher to disposables
    this.disposables.push(this.fileWatcher);
  }

  private async handleCommitMessageChange(uri: vscode.Uri) {
    try {
      // Read the file content
      const content = await fs.promises.readFile(uri.fsPath, "utf8");
      let lines = content.split("\n");

      // Check if the file matches our criteria:
      // - First line is empty
      // - Second line starts with #
      if (
        lines.length >= 2 &&
        lines[0].trim() === "" &&
        lines[1].startsWith("#")
      ) {
        // Add 'topic: ' to the second line if it doesn't already have it
        if (!lines[1].includes("topic:")) {
          // Get all available topics using the provided method
          const topics = this.getTopics();

          // Format topics into lines of max 80 characters
          const formattedTopics = this.formatTopicList(topics);

          // Replace the comment with our template
          lines[1] = lines[1].replace(
            "#",
            "topic: \n#relative: \n#reviewers: \n#"
          );

          // Add the topic list after the template
          if (topics.length > 0) {
            lines.splice(2, 0, "#", "# Available topics:", ...formattedTopics);
          }

          // Annotate file paths with their last commit's topic
          lines = await this.annotateFilesWithTopics(lines);

          // Write the modified content back to the file
          await fs.promises.writeFile(uri.fsPath, lines.join("\n"), "utf8");
        }
      }
    } catch (error) {
      console.error("Error handling commit message change:", error);
    }
  }

  private formatTopicList(topics: string[]): string[] {
    return topics.map((topic) => `# topic: ${topic}`);
  }

  /**
   * Gets the last commit message for a specific file
   * @param filePath The file path relative to the workspace root
   * @returns The commit message or null if no commits found
   */
  private async getLastCommitForFile(filePath: string): Promise<string | null> {
    try {
      const { stdout } = await runCommandSilently(
        `git log -1 --format=%B -- "${filePath}"`,
        { global: false, directory: this.workspaceRoot }
      );
      return stdout.trim() || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extracts the topic from a commit message
   * @param commitMessage The full commit message
   * @returns The topic or null if not found
   */
  private extractTopicFromCommit(commitMessage: string): string | null {
    // Match "topic: <topic_name>" pattern (case insensitive)
    const match = commitMessage.match(/^topic:\s*(.+)$/im);
    return match ? match[1].trim() : null;
  }

  /**
   * Parses file paths from COMMIT_EDITMSG lines
   * Matches lines like: "#	modified:   src/file.ts" or "#	new file:   src/file.ts"
   * @param line A line from the commit message
   * @returns The file path or null if not a file entry
   */
  private parseFilePathFromLine(line: string): string | null {
    // Match lines like "#	modified:   path/to/file" or "#	new file:   path/to/file"
    const match = line.match(
      /^#\t(?:modified|new file|deleted|renamed|copied):\s+(.+)$/
    );
    return match ? match[1].trim() : null;
  }

  /**
   * Annotates file path lines with their last commit's topic
   * @param lines The lines of the commit message
   * @returns The modified lines with topics appended
   */
  private async annotateFilesWithTopics(lines: string[]): Promise<string[]> {
    const annotatedLines: string[] = [];

    for (const line of lines) {
      const filePath = this.parseFilePathFromLine(line);

      if (filePath) {
        const commitMessage = await this.getLastCommitForFile(filePath);
        if (commitMessage) {
          const topic = this.extractTopicFromCommit(commitMessage);
          if (topic) {
            annotatedLines.push(`${line} [topic: ${topic}]`);
            continue;
          }
        }
      }

      annotatedLines.push(line);
    }

    return annotatedLines;
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}

export async function activateFileWatcher(
  context: vscode.ExtensionContext,
  getTopics: () => string[]
) {
  // Setup workspace change handling
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(async (event) => {
      // Clean up removed workspaces
      for (const workspace of event.removed) {
        const watcher = activeWatchers.get(workspace.uri.fsPath);
        if (watcher) {
          watcher.dispose();
          activeWatchers.delete(workspace.uri.fsPath);
        }
      }

      // Initialize new workspaces
      for (const workspace of event.added) {
        await initializeWorkspaceWatcher(
          context,
          workspace.uri.fsPath,
          getTopics
        );
      }
    })
  );

  // Initialize watchers for existing workspaces
  if (vscode.workspace.workspaceFolders) {
    for (const folder of vscode.workspace.workspaceFolders) {
      await initializeWorkspaceWatcher(context, folder.uri.fsPath, getTopics);
    }
  }
}

async function initializeWorkspaceWatcher(
  context: vscode.ExtensionContext,
  workspaceRoot: string,
  getTopics: () => string[]
) {
  // Check if workspace is a git repository
  if (!(await isGitRepository(workspaceRoot))) {
    return;
  }

  // Clean up existing watcher if any
  const existingWatcher = activeWatchers.get(workspaceRoot);
  if (existingWatcher) {
    existingWatcher.dispose();
    activeWatchers.delete(workspaceRoot);
  }

  const watcher = new CommitMessageWatcher(workspaceRoot, getTopics);
  activeWatchers.set(workspaceRoot, watcher);
  context.subscriptions.push(watcher);
}
