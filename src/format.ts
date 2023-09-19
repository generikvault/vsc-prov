import * as vscode from 'vscode'

export class Formatter {

    public provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
        let { lineCount } = document
        let delta: vscode.TextEdit[] = []

        let i = 0
        while (i < lineCount) {
            let [tableDelta, end] = tableFormatings(document, i)
            i = end
            delta.push(...tableDelta)
        }
        return delta
    }
}

export function parseLine(line: string): [string[], string] {
    var commentStart = line.indexOf("//")
    var contentLength = commentStart < 0 ? line.length : commentStart
    var cells = line.substring(0, contentLength).split(";")
    var comment = commentStart < 0 ? "" : line.substring(commentStart + 2)
    return [cells, comment.trim()]
}

export function tableFormatings(document: vscode.TextDocument, start: number): [vscode.TextEdit[], number] {
    let { lineCount, lineAt } = document
    let cellEnds: number[] | undefined = undefined
    let delta: vscode.TextEdit[] = []
    for (let i = start; i < lineCount; i++) {
        let line = lineAt(i).text

        let isHeader = line.substring(0, 1) === "#"
        let [cells, comment] = parseLine(line)

        if (isHeader && i != start) {
            return [delta, i]
        }

        if (isHeader || !cellEnds) {
            let leftTrimed = cells.map(s => s.trimLeft())
            let pos = 0
            cellEnds = []
            for (let j = 0; j < leftTrimed.length; j++) {
                let cell = leftTrimed[j]
                pos += cell.length
                if (j != 0) {
                    pos++ // +1 for ";" separator
                    if (!cell.startsWith(" ")) {
                        pos++
                    }
                }
                if (!cell.endsWith(" ")) {
                    pos++
                }
                cellEnds[j] = pos
            }
        }
        let formated = cells[0].trim()
        for (let j = 0; j < cells.length - 1; j++) {
            while (formated.length < cellEnds[j] ?? 0)
                formated += " "
            formated += "; "
            formated += cells[j + 1].trim()
        }
        if (comment) {
            let cellEnd = cellEnds[cells.length - 1] ?? 0
            while (formated.length < cellEnd)
                formated += " "
            formated += " // " + comment
        }
        if (formated == line){
            continue
        }
        delta.push(vscode.TextEdit.replace(new vscode.Range(
            new vscode.Position(i, 0),
            new vscode.Position(i, line.length),
        ), formated))
    }
    return [delta, lineCount]
}
