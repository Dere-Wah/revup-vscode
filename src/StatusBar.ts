import {
	Disposable,
	StatusBarAlignment,
	StatusBarItem,
	window,
	ThemeColor,
} from "vscode";
import { Revup } from "./revup";

export class StatusBar implements Disposable {
	private statusBarItem: StatusBarItem;
	private revupInstance: Revup;

	constructor(revupInstance: Revup) {
		this.statusBarItem = window.createStatusBarItem(
			StatusBarAlignment.Left,
			0
		);
		this.revupInstance = revupInstance;

		this.statusBarItem.name = "Revup Upload";
		this.statusBarItem.text = "$(cloud-upload) Revup Upload";
		this.statusBarItem.command = "revup.upload";
	}

	public dispose(): void {
		this.statusBarItem.dispose();
	}

	public update(): void {
		const installationStatus = this.revupInstance.getInstallationStatus();

		if (installationStatus === false || installationStatus === undefined) {
			this.statusBarItem.backgroundColor = new ThemeColor(
				"statusBarItem.errorBackground"
			);
			this.statusBarItem.text = "$(warning) Install Revup";
			this.statusBarItem.command = "revup.install";
		} else {
			this.statusBarItem.backgroundColor = undefined;
			this.statusBarItem.text = "$(cloud-upload) Revup Upload";
			this.statusBarItem.command = "revup.upload";
		}

		this.statusBarItem.show();
	}

	public hide(): void {
		this.statusBarItem.hide();
	}
}
