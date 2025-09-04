// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

interface Scope {
    type: 'routine' | 'if' | 'loop';
    variables: string[];
    types: string[];
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const keywords = [
        "var","is","type","integer","real","boolean","true","false",
        "record","end","array","while","loop","in","reverse","print",
        "if","then","else","routine","not","and","or","xor","return", "for"
    ];

	const provider = vscode.languages.registerCompletionItemProvider(
		'i',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				const completions: vscode.CompletionItem[] = [];

				const scopes: Scope[] = [];
                let currentRoutine: string | null = null;

                for (let i = 0; i <= position.line; i++) {
                    const line = document.lineAt(i).text.trim();

                    // Routine header
                    const routineMatch = line.match(/^routine\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/);
                    if (routineMatch) {
                        currentRoutine = routineMatch[1];
                        scopes.push({ type: 'routine', variables: [], types: [] });

                        // Add routine parameters as variables
                        const params = routineMatch[2].split(',').map(p => p.trim());
                        for (const p of params) {
                            const paramName = p.split(':')[0]?.trim();
                            if (paramName) scopes[scopes.length - 1].variables.push(paramName);
                        }
                        continue;
                    }

                    // Variable declaration
                    const varMatch = line.match(/^var\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                    if (varMatch && scopes.length > 0) {
                        scopes[scopes.length - 1].variables.push(varMatch[1]);
                        continue;
                    }

                    // User-defined types
                    const arrayTypeMatch = line.match(/^type\s+([A-Z][a-zA-Z0-9_]*)\s+is\s+array/);
                    const recordTypeMatch = line.match(/^type\s+([A-Z][a-zA-Z0-9_]*)\s+is\s+record/);
                    if (arrayTypeMatch && scopes.length > 0) {
                        scopes[scopes.length - 1].types.push(arrayTypeMatch[1]);
                        continue;
                    }
                    if (recordTypeMatch && scopes.length > 0) {
                        scopes[scopes.length - 1].types.push(recordTypeMatch[1]);
                        continue;
                    }

                    // For loop variable
                    const forMatch = line.match(/^for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in/);
                    if (forMatch) {
                        scopes.push({ type: 'loop', variables: [forMatch[1]], types: [] });
                        continue;
                    }

                    // If/while blocks
                    if (/^if .*then$/.test(line)) scopes.push({ type: 'if', variables: [], types: [] });
                    if (/^while .*loop$/.test(line)) scopes.push({ type: 'loop', variables: [], types: [] });

                    // End of block
                    if (/^end$/.test(line) && scopes.length > 0) {
                        scopes.pop();
                    }
                }

                // Flatten all variables and types in enclosing scopes
                const visibleVariables = scopes.flatMap(s => s.variables);
                const visibleTypes = scopes.flatMap(s => s.types);

                for (const v of visibleVariables) {
                    completions.push(new vscode.CompletionItem(v, vscode.CompletionItemKind.Variable));
                }
                for (const t of visibleTypes) {
                    completions.push(new vscode.CompletionItem(t, vscode.CompletionItemKind.Class)); // Use Class for types
                }

				return completions;
			}
		},
		..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_".split("")
	);

	context.subscriptions.push(provider);
}

// This method is called when your extension is deactivated
export function deactivate() {}
