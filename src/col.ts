import { start } from 'repl'
import * as vscode from 'vscode'

export function parseLine(line: string): [string[], string] {
    var commentStart = line.indexOf("//")
    var contentLength = commentStart < 0 ? line.length : commentStart
    var cells = line.substring(0, contentLength).split(";")
    var comment = commentStart < 0 ? "" : line.substring(commentStart + 2)
    return [cells, comment.trim()]
}

export async function selectCol(editor: vscode.TextEditor) {
    const { document } = editor
    const { active } = editor.selection
    const cp = new ColParser(editor.document)
    var cellId = cp.cellId(active)
    if (cellId == null)
        return

    const selections: vscode.Selection[] = []
    let first = cp.firstTableLine(active.line)
    for (var l = first; l < document.lineCount; l++) {
        if (cp.isCaption(l) && l != first)
            break

        var cell = cp.cellSelection(l, cellId)
        if (cell != null)
            selections.push(cell)
    }
    editor.selections = selections
}

export async function moveColLeft(editor: vscode.TextEditor) {
    const { document } = editor
    const { active } = editor.selection
    const cp = new ColParser(editor.document)
    var cellId = cp.cellId(active)
    if (cellId == null || cellId == 0)
        return
    const cid = cellId

    editor.edit(edit => swapCol(edit, cp, document, cp.firstTableLine(active.line), cid, cid - 1))
    var sel = cp.cellSelection(active.line, cid - 1)
    if (sel != null)
        editor.selection = sel
}

function swapCol(edit: vscode.TextEditorEdit, cp: ColParser, document: vscode.TextDocument, first: number, a: number, b: number) {
    for (var l = first; l < document.lineCount; l++) {
        if ( cp.isCaption(l) && l != first)
            break

        var cellA = cp.cellSelection(l, a)
        var cellB = cp.cellSelection(l, b)


        if (cellA == null || cellB == null) {
            continue
        }

        const textA = document.getText(cellA)
        const textB = document.getText(cellB)
        edit.replace(cellA, textB)
        edit.replace(cellB, textA)
    }
}

export async function moveColRight(editor: vscode.TextEditor) {
    const { document } = editor
    const { active } = editor.selection
    const cp = new ColParser(editor.document)
    var cellId = cp.cellId(active)
    if (cellId == null)
        return
    const cid = cellId

    editor.edit(edit => swapCol(edit, cp, document, cp.firstTableLine(active.line), cid, cid + 1))
    var sel = cp.cellSelection(active.line, cid + 1)
    if (sel != null)
        editor.selection = sel
    // TODO format
}

class ColParser {

    private document: vscode.TextDocument

    constructor(document: vscode.TextDocument) {
        this.document = document
    }

    firstTableLine(l: number): number {
        while (l >= 0) {
            var line = this.document
                .lineAt(l)
                .text
            if (line.startsWith("#"))
                return l
            l--
        }
        return 0
    }

    cellId(sel: vscode.Position): number | void {
        var content = this.lineContent(sel.line)
        if (sel.character > content.length)
            return
        if (content.indexOf(";") < 0)
            return 0
        return content
            .substring(0, sel.character)
            .split(";")
            .length - 1
    }

    lineContent(l: number): string {
        var line = this.document
            .lineAt(l)
            .text
        var commentStart = line.indexOf("//")
        var contentLength = commentStart < 0 ? line.length : commentStart
        return line.substring(0, contentLength)
    }

    cellSelection(l: number, col: number): vscode.Selection | void {
        let content = this.lineContent(l)

        if (content.trim() == "")
            return

        var begin = 0
        for (var i = col; i > 0; i--) {
            begin = content.indexOf(";", begin) + 1
            if (begin == 0)
                return
        }
        if (col == 0 && content.trimLeft().startsWith("#")){
            begin = content.indexOf("#") + 1
        }
        var end = content.indexOf(";", begin)
        if (end == -1)
            end = content.length

        return new vscode.Selection(new vscode.Position(l, begin), new vscode.Position(l, end))
    }

    isCaption(l: number): boolean {
        var line = this.document
            .lineAt(l)
            .text
        return line.trimLeft().startsWith("#")
    }

}
