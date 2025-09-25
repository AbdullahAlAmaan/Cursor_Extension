const vscode = require('vscode');

function activate(context) {
    console.log('Simple Cursor Extension Activated!');
    
    // Register a simple command
    const disposable = vscode.commands.registerCommand('simple-cursor.hello', () => {
        vscode.window.showInformationMessage('Hello from Cursor!');
    });
    
    context.subscriptions.push(disposable);
    
    // Show a notification when extension activates
    vscode.window.showInformationMessage('Simple Cursor Extension is now active!');
}

function deactivate() {
    console.log('Simple Cursor Extension Deactivated!');
}

module.exports = {
    activate,
    deactivate
};
