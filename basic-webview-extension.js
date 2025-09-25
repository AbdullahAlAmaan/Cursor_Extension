const vscode = require('vscode');

function activate(context) {
    console.log('Basic Webview Extension Activated!');
    
    // Register a command to show the webview
    const disposable = vscode.commands.registerCommand('basic-webview.show', () => {
        // Create a simple webview panel
        const panel = vscode.window.createWebviewPanel(
            'basicWebview',
            'Learning Time!',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );
        
        // Set the HTML content
        panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Learning Time!</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        margin: 0;
                        padding: 20px;
                        color: white;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .container {
                        text-align: center;
                        max-width: 600px;
                    }
                    .title {
                        font-size: 2.5rem;
                        margin-bottom: 1rem;
                    }
                    .content {
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(10px);
                        border-radius: 20px;
                        padding: 2rem;
                        margin: 2rem 0;
                    }
                    .fun-fact {
                        font-size: 1.3rem;
                        line-height: 1.6;
                        margin-bottom: 1rem;
                    }
                    .quiz-button {
                        background: rgba(255, 255, 255, 0.2);
                        border: 2px solid white;
                        color: white;
                        padding: 1rem 2rem;
                        border-radius: 10px;
                        cursor: pointer;
                        font-size: 1.1rem;
                        margin: 1rem;
                    }
                    .quiz-button:hover {
                        background: rgba(255, 255, 255, 0.3);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="title">🎓 Learning Time!</h1>
                    <div class="content">
                        <div class="fun-fact">
                            The human brain contains approximately 86 billion neurons, similar to the number of stars in the Milky Way galaxy.
                        </div>
                        <button class="quiz-button" onclick="alert('Quiz feature coming soon!')">
                            🧠 Take a Quiz!
                        </button>
                    </div>
                </div>
            </body>
            </html>
        `;
    });
    
    context.subscriptions.push(disposable);
    
    // Show a notification when extension activates
    vscode.window.showInformationMessage('Basic Webview Extension is now active! Press Cmd+Shift+P and type "Show Learning" to test.');
}

function deactivate() {
    console.log('Basic Webview Extension Deactivated!');
}

module.exports = {
    activate,
    deactivate
};
