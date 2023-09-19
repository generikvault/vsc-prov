import * as vscode from 'vscode'
import * as format from './format'

export default class Provider implements vscode.DocumentSymbolProvider {

    provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.DocumentSymbol[]> {
        var { lineCount, lineAt } = document
        var symbols: vscode.DocumentSymbol[] = []
        var name = ""
        var start = 0
        var last = new vscode.Position(0, 0)
        for (var i = 0; i < lineCount; i++) {
            if (token.isCancellationRequested)
                return []
            var line = lineAt(i).text

            if (line === "") {
                continue
            }

            if (line.substring(0, 1) !== "#") {
                last = new vscode.Position(i, line.length)
                continue
            }

            if (name !== "")
                symbols.push(new vscode.DocumentSymbol(name,
                    'table',
                    vscode.SymbolKind.Class,
                    new vscode.Range(new vscode.Position(start, 0), last),
                    new vscode.Range(new vscode.Position(start, 1), new vscode.Position(start, 1 + name.length))))

            let [cells, _] = format.parseLine(line.substring(1))

            name = cells.map(s => s.trim()).join("; ")
            start = i
            last = new vscode.Position(i, line.length)

        }
        if (name !== "")
            symbols.push(new vscode.DocumentSymbol(name,
                'table',
                vscode.SymbolKind.Class,
                new vscode.Range(new vscode.Position(start, 0), last),
                new vscode.Range(new vscode.Position(start, 1), new vscode.Position(start, 1 + name.length))))
        return symbols
    }


}
