import * as vscode from 'vscode'
import Provider from './provider'
import * as col from './col'
import * as format from './format'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.languages.registerDocumentFormattingEditProvider('prov', new format.Formatter()),
		vscode.languages.registerDocumentSymbolProvider({ language: 'prov' }, new Provider()),
		new StatusBarCollInfo(),
		inEditor("prov.selectColumn", col.selectCol),
		inEditor("prov.moveColumnLeft", col.moveColLeft),
		inEditor("prov.moveColumnRight", col.moveColRight),
	)
}

function inEditor(name: string, fn: (editor: vscode.TextEditor) => void): vscode.Disposable {
	let cmd = () => {
		let editor = vscode.window.activeTextEditor

		if (editor == null) {
			return
		}
		fn(editor)
	}

	return vscode.commands.registerCommand(name, cmd)
}

// this method is called when your extension is deactivated
export function deactivate() { }



class StatusBarCollInfo implements vscode.Disposable {

	private disposables: vscode.Disposable[] = []
	private statusBarItem: vscode.StatusBarItem

	constructor() {

		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0)
		this.disposables.push(
			vscode.window.onDidChangeTextEditorSelection(e => this.update(e.textEditor)),
		)
	}

	private update(editor: vscode.TextEditor) {
		this.statusBarItem.text = this.colname(editor)
		this.statusBarItem.show()
	}

	private colname(editor: vscode.TextEditor): string {
		let { document } = editor
		let { active } = editor.selection
		let l = active.line
		let line = document
			.lineAt(l)
			.text
		let commentStart = line.indexOf("//")
		let contentLength = commentStart < 0 ? line.length : commentStart
		if (active.character > contentLength)
			return ""
		let content = line.substring(0, contentLength)
		if (content.indexOf(";") < 0)
			return ""
		let cellId = content
			.substring(0, active.character)
			.split(";")
			.length - 1

		while (l > 0) {
			let line = document
				.lineAt(l)
				.text
			if (!line.startsWith("#")) {
				l--
				continue
			}

			let commentStart = line.indexOf("//")
			let contentLength = commentStart < 0 ? line.length : commentStart
			let cells = line.substring(0, contentLength).split(";")
			return (cells[cellId] ?? "").replace("//", "").trim()
		}
		return ""
	}

	dispose() {
		this.statusBarItem.dispose()
		this.disposables.forEach(d => d.dispose())
	}
}
