import * as vscode from 'vscode';
import { OllamaService, LearningContent } from './ollamaService';
import { LocalStorage } from './localStorage';

export class LearningOverlayManager {
    private panel: vscode.WebviewPanel | undefined;
    private ollamaService: OllamaService;
    private localStorage: LocalStorage;
    private isVisible: boolean = false;
    private currentContent: LearningContent | null = null;
    private isGenerating: boolean = false;
    private contentRotationInterval: NodeJS.Timeout | undefined;

    constructor(ollamaService: OllamaService, localStorage: LocalStorage) {
        this.ollamaService = ollamaService;
        this.localStorage = localStorage;
    }

    initialize(): void {
        // Check if Ollama is available
        this.ollamaService.checkOllamaConnection().then(available => {
            if (!available) {
                vscode.window.showWarningMessage(
                    'Ollama is not running. Please start Ollama to use the learning overlay.',
                    'Open Settings'
                ).then(selection => {
                    if (selection === 'Open Settings') {
                        vscode.commands.executeCommand('workbench.action.openSettings', 'cursorLearningOverlay');
                    }
                });
            }
        });
    }

    async showOverlay(): Promise<void> {
        if (!this.localStorage.isEnabled() || this.isVisible) {
            return;
        }

        console.log('Showing learning overlay...');
        this.isVisible = true;
        
        // Create or show the webview panel with fullscreen behavior
        if (!this.panel) {
            this.panel = vscode.window.createWebviewPanel(
                'learningOverlay',
                'Learning Time!',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [],
                    enableFindWidget: false,
                    enableCommandUris: true
                }
            );

            // Hide all other panels to make it truly fullscreen
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');
            await vscode.commands.executeCommand('workbench.action.toggleSidebarVisibility');
            await vscode.commands.executeCommand('workbench.action.togglePanel');
            await vscode.commands.executeCommand('workbench.action.toggleStatusbarVisibility');
            await vscode.commands.executeCommand('workbench.action.toggleMenuBar');

            // Handle panel disposal
            this.panel.onDidDispose(() => {
                this.panel = undefined;
                this.isVisible = false;
            });

            // Handle messages from webview
            this.panel.webview.onDidReceiveMessage(
                async message => {
                    switch (message.type) {
                        case 'generateContent':
                            await this.generateNewContent();
                            break;
                        case 'answerSelected':
                            this.handleAnswerSelected(message.answerIndex);
                            break;
                        case 'nextQuestion':
                            await this.generateNewContent();
                            break;
                        case 'closeOverlay':
                            this.hideOverlay();
                            break;
                    }
                }
            );
        }

        // Generate initial content
        await this.generateNewContent();
        
        // Start content rotation for continuous learning
        this.startContentRotation();
        
        // Show the panel
        this.panel.reveal(vscode.ViewColumn.One);
    }

    async hideOverlay(): Promise<void> {
        if (this.panel && this.isVisible) {
            console.log('Hiding learning overlay...');
            
            // Stop content rotation
            this.stopContentRotation();
            
            // Restore UI elements
            await vscode.commands.executeCommand('workbench.action.toggleSidebarVisibility');
            await vscode.commands.executeCommand('workbench.action.togglePanel');
            await vscode.commands.executeCommand('workbench.action.toggleStatusbarVisibility');
            await vscode.commands.executeCommand('workbench.action.toggleMenuBar');
            
            this.panel.dispose();
            this.panel = undefined;
            this.isVisible = false;
        }
    }

    toggle(): void {
        if (this.isVisible) {
            this.hideOverlay();
        } else {
            this.showOverlay();
        }
    }

    private async generateNewContent(): Promise<void> {
        if (this.isGenerating || !this.panel) {
            return;
        }

        this.isGenerating = true;
        
        try {
            // Show loading state
            this.panel.webview.html = this.getLoadingHtml();

            const topics = this.localStorage.getTopics();
            let content: LearningContent | null = null;
            let attempts = 0;
            const maxAttempts = 3;

            // Try to generate content that hasn't been asked before
            while (attempts < maxAttempts) {
                content = await this.ollamaService.generateLearningContent(topics);
                
                if (content && !this.localStorage.shouldAvoidQuestion(content.question)) {
                    break;
                }
                attempts++;
            }

            if (!content) {
                // Fallback to any content if we can't generate new ones
                content = await this.ollamaService.generateLearningContent(topics);
            }

            if (content) {
                this.currentContent = content;
                this.localStorage.markQuestionAsUsed(content.question);
                this.localStorage.addToLastUsedTopics(content.topic);
                
                // Update the webview with the new content
                this.panel.webview.html = this.getContentHtml(content);
            } else {
                // Show error state
                this.panel.webview.html = this.getErrorHtml();
            }
        } catch (error) {
            console.error('Error generating content:', error);
            this.panel.webview.html = this.getErrorHtml();
        } finally {
            this.isGenerating = false;
        }
    }

    private handleAnswerSelected(answerIndex: number): void {
        if (!this.currentContent || !this.panel) {
            return;
        }

        const isCorrect = answerIndex === this.currentContent.correctAnswer;
        
        // Update the webview to show the result
        this.panel.webview.html = this.getResultHtml(this.currentContent, answerIndex, isCorrect);
    }

    private getLoadingHtml(): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Learning Time</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        }
        .loading-container {
            text-align: center;
        }
        .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h1 {
            font-size: 2.5rem;
            margin: 0;
            font-weight: 300;
        }
        p {
            font-size: 1.2rem;
            opacity: 0.8;
            margin: 10px 0 0 0;
        }
    </style>
</head>
<body>
    <div class="loading-container">
        <div class="spinner"></div>
        <h1>Preparing your learning...</h1>
        <p>Generating something interesting for you</p>
    </div>
</body>
</html>`;
    }

    private getContentHtml(content: LearningContent): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Learning Time</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            height: 100%;
            width: 100%;
            overflow: hidden;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            height: 100vh;
            width: 100vw;
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 9999;
        }
        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 90%;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .topic {
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            margin-bottom: 20px;
            display: inline-block;
        }
        .fun-fact {
            font-size: 1.3rem;
            line-height: 1.6;
            margin-bottom: 30px;
            font-style: italic;
        }
        .question {
            font-size: 1.4rem;
            font-weight: 600;
            margin-bottom: 30px;
        }
        .options {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-bottom: 30px;
        }
        .option {
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid transparent;
            padding: 15px 20px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1.1rem;
        }
        .option:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.3);
        }
        .test-me-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid white;
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 20px;
        }
        .test-me-btn:hover {
            background: white;
            color: #667eea;
        }
        .hidden {
            display: none;
        }
        .close-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            padding: 10px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.2rem;
        }
    </style>
</head>
<body>
    <button class="close-btn" onclick="closeOverlay()">×</button>
    
    <div class="card">
        <div class="topic">${content.topic}</div>
        
        <div id="fun-fact-section">
            <div class="fun-fact">${content.funFact}</div>
            <button class="test-me-btn" onclick="showQuestion()">Test me!</button>
        </div>
        
        <div id="question-section" class="hidden">
            <div class="question">${content.question}</div>
            <div class="options">
                ${content.options.map((option, index) => 
                    `<div class="option" onclick="selectAnswer(${index})">${option}</div>`
                ).join('')}
            </div>
        </div>
    </div>

    <script>
        function showQuestion() {
            document.getElementById('fun-fact-section').classList.add('hidden');
            document.getElementById('question-section').classList.remove('hidden');
        }
        
        function selectAnswer(answerIndex) {
            const vscode = acquireVsCodeApi();
            vscode.postMessage({
                type: 'answerSelected',
                answerIndex: answerIndex
            });
        }
        
        function closeOverlay() {
            const vscode = acquireVsCodeApi();
            vscode.postMessage({
                type: 'closeOverlay'
            });
        }
    </script>
</body>
</html>`;
    }

    private getResultHtml(content: LearningContent, selectedAnswer: number, isCorrect: boolean): string {
        const correctOption = content.options[content.correctAnswer];
        const selectedOption = content.options[selectedAnswer];
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Learning Time</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 90%;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .result-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        .correct { color: #4ade80; }
        .incorrect { color: #f87171; }
        .explanation {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
        }
        .next-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid white;
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 10px;
        }
        .next-btn:hover {
            background: white;
            color: #667eea;
        }
        .close-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            padding: 10px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.2rem;
        }
    </style>
</head>
<body>
    <button class="close-btn" onclick="closeOverlay()">×</button>
    
    <div class="card">
        <div class="result-icon ${isCorrect ? 'correct' : 'incorrect'}">
            ${isCorrect ? '🎉' : '❌'}
        </div>
        
        <h2>${isCorrect ? 'Correct!' : 'Not quite right'}</h2>
        
        <div class="explanation">
            <p><strong>Your answer:</strong> ${selectedOption}</p>
            <p><strong>Correct answer:</strong> ${correctOption}</p>
            <p><strong>Explanation:</strong> ${content.explanation}</p>
        </div>
        
        <button class="next-btn" onclick="nextQuestion()">Next Question</button>
        <button class="next-btn" onclick="closeOverlay()">Close</button>
    </div>

    <script>
        function nextQuestion() {
            const vscode = acquireVsCodeApi();
            vscode.postMessage({
                type: 'nextQuestion'
            });
        }
        
        function closeOverlay() {
            const vscode = acquireVsCodeApi();
            vscode.postMessage({
                type: 'closeOverlay'
            });
        }
    </script>
</body>
</html>`;
    }

    private getErrorHtml(): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Learning Time</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 90%;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .error-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        .retry-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid white;
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 10px;
        }
        .retry-btn:hover {
            background: white;
            color: #667eea;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="error-icon">⚠️</div>
        <h2>Oops! Something went wrong</h2>
        <p>We couldn't generate learning content right now. This might be because Ollama isn't running or there's a connection issue.</p>
        <button class="retry-btn" onclick="retry()">Try Again</button>
        <button class="retry-btn" onclick="closeOverlay()">Close</button>
    </div>

    <script>
        function retry() {
            const vscode = acquireVsCodeApi();
            vscode.postMessage({
                type: 'generateContent'
            });
        }
        
        function closeOverlay() {
            const vscode = acquireVsCodeApi();
            vscode.postMessage({
                type: 'closeOverlay'
            });
        }
    </script>
</body>
</html>`;
    }

    private startContentRotation(): void {
        // Rotate content every 30 seconds for continuous learning
        this.contentRotationInterval = setInterval(async () => {
            if (this.isVisible && this.panel) {
                console.log('Rotating learning content...');
                await this.generateNewContent();
            }
        }, 30000); // 30 seconds
    }

    private stopContentRotation(): void {
        if (this.contentRotationInterval) {
            clearInterval(this.contentRotationInterval);
            this.contentRotationInterval = undefined;
        }
    }

    dispose(): void {
        this.stopContentRotation();
        this.hideOverlay();
    }
}
