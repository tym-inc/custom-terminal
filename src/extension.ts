// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const provider = new CustomTerminalProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(CustomTerminalProvider.viewType, provider));
}

class CustomTerminalProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'customTerminal.canvasTerminal';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const htmlUri = vscode.Uri.joinPath(this._extensionUri, 'media', 'terminal.html');
		const html = fs.readFileSync(htmlUri.fsPath, 'utf8');

		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'terminal.js'));
		
		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();
		
		// Do the same for the stylesheet.
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'terminal.css'));

		return html
			.replaceAll('{{SCRIPT_PATH}}', scriptUri.toString())
			.replaceAll('{{SCRIPT_NONCE}}', nonce)
			.replaceAll('{{WEBVIEW_CSP_SOURCE}}', webview.cspSource)
			.replaceAll('{{CSS_PATH}}', styleMainUri.toString());
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

