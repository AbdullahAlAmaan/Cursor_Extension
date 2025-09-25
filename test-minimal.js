const vscode = require('vscode');

function activate(context) {
    console.log('MINIMAL TEST EXTENSION ACTIVATED!');
    
    const disposable = vscode.commands.registerCommand('test-minimal.hello', () => {
        vscode.window.showInformationMessage('Hello from minimal test!');
    });
    
    context.subscriptions.push(disposable);
}

function deactivate() {
    console.log('MINIMAL TEST EXTENSION DEACTIVATED!');
}

module.exports = {
    activate,
    deactivate
};
