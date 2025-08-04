import { Disposable, StatusBarAlignment, StatusBarItem, window } from "vscode";

export class StatusBar implements Disposable {
	private statusBarItem: StatusBarItem;

	constructor() {
		this.statusBarItem = window.createStatusBarItem(
			StatusBarAlignment.Left,
			0
		);

		this.statusBarItem.name = "Revup Upload";
		this.statusBarItem.text = "$(cloud-upload) Revup Upload";
		this.statusBarItem.command = "revup.upload";
	}

	public dispose(): void {
		this.statusBarItem.dispose();
	}

	public update(): void {
		this.statusBarItem.show();
	}

	public hide(): void {
		this.statusBarItem.hide();
	}
}
