import * as vscode from 'vscode';

export class AgentEventDetector {
    private learningOverlayManager: any;
    private isAgentRunning: boolean = false;
    private checkInterval: NodeJS.Timeout | undefined;
    private lastActivity: number = Date.now();
    private idleThreshold: number = 30000; // 30 seconds of inactivity (only for fallback)
    private userPromptDetected: boolean = false;
    private agentStartTime: number = 0;

    constructor(learningOverlayManager: any) {
        this.learningOverlayManager = learningOverlayManager;
    }

    startMonitoring(): void {
        console.log('Starting REAL Cursor agent monitoring...');
        
        // Real Cursor AI detection - monitor actual patterns
        this.monitorRealCursorAI();
        
        // Monitor for user prompts and agent activity
        this.monitorUserPrompts();
        
        // Start continuous monitoring for AI activity
        this.startContinuousMonitoring();
    }

    private startContinuousMonitoring(): void {
        // Monitor for AI activity every 2 seconds
        setInterval(() => {
            this.checkForAIActivity();
        }, 2000);

        // Monitor for user activity to detect when AI should stop
        setInterval(() => {
            if (this.isAgentRunning) {
                const now = Date.now();
                const timeSinceActivity = now - this.lastActivity;
                
                // If user has been active recently, AI might have finished
                if (timeSinceActivity < 5000) { // 5 seconds of recent activity
                    console.log('User activity detected - checking if agent should stop');
                    this.checkIfAgentShouldStop();
                }
            }
        }, 3000);
    }

    private checkIfAgentShouldStop(): void {
        // Check if AI is still generating content
        if (this.isAgentRunning) {
            // If user is actively typing, AI might have finished
            const now = Date.now();
            const timeSinceLastChange = now - this.lastActivity;
            
            if (timeSinceLastChange < 2000) { // User typed in last 2 seconds
                console.log('User is actively typing - agent likely finished');
                this.simulateAgentEnd();
            }
        }
    }

    private monitorRealCursorAI(): void {
        console.log('Setting up REAL Cursor AI detection...');
        
        // Monitor for Cursor AI chat panel activity
        this.monitorCursorChatPanel();
        
        // Monitor for Cursor AI composer activity
        this.monitorCursorComposer();
        
        // Monitor for Cursor AI command execution
        this.monitorCursorCommands();
        
        // Monitor for AI-generated content patterns
        this.monitorAIContentGeneration();
        
        // Monitor for Cursor AI status indicators
        this.monitorCursorAIStatus();
    }

    private monitorCursorChatPanel(): void {
        console.log('Setting up Cursor chat panel monitoring...');
        
        // Monitor for Cursor's chat panel opening/closing
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                const fileName = editor.document.fileName.toLowerCase();
                const uri = editor.document.uri.toString();
                
                console.log('Active editor changed:', fileName, uri);
                
                // Check for various Cursor chat patterns
                if (fileName.includes('chat') || 
                    fileName.includes('cursor') ||
                    uri.includes('chat') ||
                    uri.includes('cursor') ||
                    editor.document.uri.scheme === 'cursor-chat' || 
                    editor.document.languageId === 'cursor-chat' ||
                    editor.document.uri.scheme === 'cursor' ||
                    editor.document.languageId === 'cursor') {
                    console.log('Cursor chat panel activated - user likely sent prompt');
                    this.detectUserPrompt();
                }
            }
        });

        // Monitor for chat panel content changes (AI responses)
        vscode.workspace.onDidChangeTextDocument((event) => {
            const fileName = event.document.fileName.toLowerCase();
            const uri = event.document.uri.toString();
            
            // Check for various Cursor chat patterns
            if (fileName.includes('chat') || 
                fileName.includes('cursor') ||
                uri.includes('chat') ||
                uri.includes('cursor') ||
                event.document.uri.scheme === 'cursor-chat' ||
                event.document.uri.scheme === 'cursor') {
                console.log('Cursor chat content changed - AI might be responding');
                this.detectAIGeneration();
            }
        });
    }

    private monitorCursorComposer(): void {
        // Monitor for Cursor's composer panel
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                const fileName = editor.document.fileName.toLowerCase();
                if (fileName.includes('composer') || fileName.includes('cursor-composer') ||
                    editor.document.uri.scheme === 'cursor-composer' ||
                    editor.document.languageId === 'cursor-composer') {
                    console.log('Cursor composer activated - user likely composing prompt');
                    this.detectUserPrompt();
                }
            }
        });

        // Monitor for composer content changes
        vscode.workspace.onDidChangeTextDocument((event) => {
            const fileName = event.document.fileName.toLowerCase();
            if (fileName.includes('composer') || fileName.includes('cursor-composer') ||
                event.document.uri.scheme === 'cursor-composer') {
                console.log('Cursor composer content changed - AI might be working');
                this.detectAIGeneration();
            }
        });
    }

    private monitorCursorCommands(): void {
        // Monitor for Cursor AI command execution by watching for specific patterns
        vscode.workspace.onDidChangeTextDocument((event) => {
            // Look for patterns that indicate AI is working
            const content = event.document.getText();
            
            // Check for AI generation patterns
            if (this.isAIGenerationPattern(event, content)) {
                console.log('AI generation pattern detected');
                this.detectAIGeneration();
            }
            
            // Check for user prompt patterns
            if (this.isUserPromptPattern(event, content)) {
                console.log('User prompt pattern detected');
                this.detectUserPrompt();
            }
        });
    }

    private isAIGenerationPattern(event: vscode.TextDocumentChangeEvent, content: string): boolean {
        // Detect patterns that indicate AI is generating content
        
        // Exclude settings and configuration files
        const fileName = event.document.fileName.toLowerCase();
        if (fileName.includes('settings.json') || 
            fileName.includes('preferences') || 
            fileName.includes('config') ||
            fileName.includes('extension') ||
            fileName.includes('workspace')) {
            return false;
        }
        
        // Pattern 1: Rapid sequential changes (AI typing effect)
        if (event.contentChanges.length > 3) {
            const timeSinceLastChange = Date.now() - this.lastActivity;
            if (timeSinceLastChange < 2000) { // Within 2 seconds
                console.log('Rapid sequential changes detected - AI generating');
                return true;
            }
        }
        
        // Pattern 2: Large content additions (AI generated code)
        const totalAddedLength = event.contentChanges.reduce((sum, change) => 
            sum + (change.text.length - (change.rangeLength || 0)), 0);
        if (totalAddedLength > 100) { // More than 100 characters added
            console.log('Large content addition detected - AI generating');
            return true;
        }
        
        // Pattern 3: AI response indicators in content
        const aiIndicators = [
            '// Generated by AI',
            '// Cursor AI',
            '// AI Assistant',
            '```typescript',
            '```javascript',
            '```python',
            '// TODO:',
            '// FIXME:',
            '// Generated code'
        ];
        
        for (const indicator of aiIndicators) {
            if (content.includes(indicator)) {
                console.log(`AI indicator found: ${indicator}`);
                return true;
            }
        }
        
        return false;
    }

    private isUserPromptPattern(event: vscode.TextDocumentChangeEvent, content: string): boolean {
        // Detect patterns that indicate user is typing a prompt
        
        // Pattern 1: User is typing in a chat-like interface
        const fileName = event.document.fileName.toLowerCase();
        const uri = event.document.uri.toString();
        
        // Exclude settings and configuration files
        if (fileName.includes('settings.json') || 
            fileName.includes('preferences') || 
            fileName.includes('config') ||
            fileName.includes('extension') ||
            fileName.includes('workspace')) {
            return false;
        }
        
        // Check for Cursor chat patterns
        if (fileName.includes('chat') || 
            fileName.includes('composer') || 
            fileName.includes('cursor') ||
            uri.includes('chat') ||
            uri.includes('cursor') ||
            event.document.uri.scheme === 'cursor-chat' ||
            event.document.uri.scheme === 'cursor') {
            console.log('User prompt pattern detected in:', fileName, uri);
            return true;
        }
        
        // Pattern 2: Content contains prompt-like text
        const promptIndicators = [
            '// Please',
            '// Can you',
            '// Help me',
            '// I need',
            '// How to',
            '// Explain',
            '// Write a',
            '// Create a',
            '// Fix this',
            '// Improve this'
        ];
        
        for (const indicator of promptIndicators) {
            if (content.includes(indicator)) {
                console.log(`User prompt indicator found: ${indicator}`);
                return true;
            }
        }
        
        return false;
    }

    private monitorAIContentGeneration(): void {
        // Monitor for AI content generation patterns across all documents
        vscode.workspace.onDidChangeTextDocument((event) => {
            // Check if this looks like AI-generated content
            if (this.isAIGenerationPattern(event, event.document.getText())) {
                console.log('AI content generation detected');
                this.detectAIGeneration();
            }
        });
    }

    private monitorCursorAIStatus(): void {
        // Monitor for Cursor AI status by checking for AI-related UI elements
        setInterval(() => {
            this.checkCursorAIStatus();
        }, 1000); // Check every second
    }

    private checkCursorAIStatus(): void {
        // Check for Cursor AI status indicators
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            const fileName = activeEditor.document.fileName.toLowerCase();
            
            // Check if we're in a Cursor AI context
            if (fileName.includes('chat') || fileName.includes('composer') || 
                fileName.includes('cursor') || 
                activeEditor.document.uri.scheme.includes('cursor')) {
                
                // Check if AI is actively working
                if (this.isAIActivelyWorking()) {
                    console.log('Cursor AI is actively working');
                    this.detectAIGeneration();
                }
            }
        }
    }

    private isAIActivelyWorking(): boolean {
        // Check if AI is actively working by looking for specific patterns
        const now = Date.now();
        const timeSinceLastActivity = now - this.lastActivity;
        
        // If user hasn't been active for a while, AI might be working
        if (timeSinceLastActivity > 5000) { // 5 seconds of inactivity
            return true;
        }
        
        // Check for AI-related documents that are being modified
        const documents = vscode.workspace.textDocuments;
        for (const doc of documents) {
            const fileName = doc.fileName.toLowerCase();
            if (fileName.includes('chat') || fileName.includes('composer') || 
                fileName.includes('cursor')) {
                // If this document was recently modified, AI might be working
                const lastModified = doc.uri.fsPath ? 
                    require('fs').statSync(doc.uri.fsPath).mtime.getTime() : 0;
                if (now - lastModified < 10000) { // Modified in last 10 seconds
                    return true;
                }
            }
        }
        
        return false;
    }

    private monitorUserPrompts(): void {
        // Monitor for Cursor AI activity
        this.monitorCursorAIActivity();
        this.monitorChatActivity();
        this.monitorCommandPalette();
        this.monitorDocumentChanges();
    }

    private monitorCursorAIActivity(): void {
        // Monitor for Cursor AI specific activities
        // Since we can't directly listen to command execution, we'll monitor for AI-related UI changes
        
        // Monitor for chat/composer panel visibility changes
        vscode.window.onDidChangeActiveTextEditor(() => {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                const fileName = activeEditor.document.fileName.toLowerCase();
                if (fileName.includes('chat') || fileName.includes('composer')) {
                    console.log('Cursor AI panel activated');
                    this.detectUserPrompt();
                }
            }
        });

        // Monitor for workspace changes that might indicate AI activity
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            console.log('Workspace changed - checking for AI activity');
            this.checkForAIActivity();
        });
    }

    checkForAIActivity(): void {
        // Check if there are any AI-related panels or documents open
        vscode.workspace.textDocuments.forEach(doc => {
            const fileName = doc.fileName.toLowerCase();
            if (fileName.includes('chat') || fileName.includes('composer') || fileName.includes('cursor')) {
                console.log('AI-related document found:', fileName);
                this.detectUserPrompt();
            }
        });
    }

    private monitorChatActivity(): void {
        // Monitor for chat panel activity
        vscode.window.onDidChangeActiveTextEditor(() => {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                const fileName = activeEditor.document.fileName.toLowerCase();
                if (fileName.includes('chat') || fileName.includes('composer') || fileName.includes('cursor')) {
                    console.log('Chat/Composer panel detected');
                    this.detectUserPrompt();
                }
            }
        });
    }

    private monitorCommandPalette(): void {
        // Monitor for AI-related command palette usage
        vscode.window.onDidChangeActiveTextEditor(() => {
            // This will trigger when user switches to chat/composer
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && activeEditor.document.fileName.includes('chat')) {
                console.log('User switched to chat panel');
                this.detectUserPrompt();
            }
        });
    }

    private monitorDocumentChanges(): void {
        // Monitor for document changes that might indicate AI prompts
        vscode.workspace.onDidChangeTextDocument((event) => {
            const fileName = event.document.fileName.toLowerCase();
            const uri = event.document.uri.toString();
            
            console.log('Document changed:', fileName, uri);
            
            // Check if it's a chat or AI-related document
            if (fileName.includes('chat') || 
                fileName.includes('composer') || 
                fileName.includes('cursor') ||
                uri.includes('chat') ||
                uri.includes('cursor') ||
                event.document.uri.scheme === 'cursor-chat' ||
                event.document.uri.scheme === 'cursor') {
                console.log('AI-related document changed:', fileName, uri);
                this.detectUserPrompt();
            }
            
            // Check for rapid changes that might indicate AI generation
            if (this.isRapidDocumentChange(event)) {
                console.log('Rapid document changes detected - possible AI generation');
                this.detectAIGeneration();
            }
            
            // Check for prompt patterns in any document
            if (this.isUserPromptPattern(event, event.document.getText())) {
                console.log('User prompt pattern detected in document changes');
                this.detectUserPrompt();
            }
        });
    }

    private isRapidDocumentChange(event: vscode.TextDocumentChangeEvent): boolean {
        // Check if there are many changes in a short time (AI generation pattern)
        const now = Date.now();
        const timeSinceLastChange = now - this.lastActivity;
        
        if (timeSinceLastChange < 1000 && event.contentChanges.length > 5) {
            return true;
        }
        
        this.lastActivity = now;
        return false;
    }

    public detectAIGeneration(): void {
        // Detect when AI is generating content
        if (!this.isAgentRunning) {
            console.log('AI generation detected - starting agent');
            this.simulateAgentStart();
        }
    }

    public detectUserPrompt(): void {
        if (!this.userPromptDetected) {
            this.userPromptDetected = true;
            console.log('🎯 User prompt detected, waiting for agent to start...');
            
            // Show a notification to confirm detection
            vscode.window.showInformationMessage('Learning Overlay: User prompt detected! Starting agent monitoring...');
            
            // Start monitoring for agent activity after a short delay
            setTimeout(() => {
                this.startAgentDetection();
            }, 2000); // Wait 2 seconds for agent to start
        }
    }

    public startAgentDetection(): void { 
        // Start more frequent monitoring when we expect agent to be running
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        this.checkInterval = setInterval(async () => {
            await this.checkAgentStatus();
        }, 500); // Check every 500ms for faster detection
    }

    public monitorUserActivity(): void {
        // Monitor for user activity to detect idle time
        setInterval(() => {
            const now = Date.now();
            const timeSinceActivity = now - this.lastActivity;

            // If user has been idle for more than threshold and agent isn't running, start overlay
            if (timeSinceActivity > this.idleThreshold && !this.isAgentRunning) {
                console.log('User idle detected, starting learning overlay');
                this.simulateAgentStart();
            }
        }, 2000); // Check every 2 seconds for faster response
    }

    private async checkAgentStatus(): Promise<void> {
        try {
            // Check if Cursor's AI agent is running
            // This is a simplified check - in a real implementation, we'd listen to Cursor's actual events
            
            const now = Date.now();
            const timeSinceActivity = now - this.lastActivity;
            
            // If user prompt was detected and we're in detection mode
            if (this.userPromptDetected && !this.isAgentRunning) {
                // Check if there are any active AI operations
                const hasActiveAI = await this.detectActiveAIOperations();
                if (hasActiveAI) {
                    this.agentStartTime = now;
                    this.simulateAgentStart();
                }
            }
            // If agent is running, check if it should stop
            else if (this.isAgentRunning) {
                // For testing, don't auto-end the agent based on user activity
                // Let it run for the full duration
                console.log('Agent is running, monitoring...');
            }
        } catch (error) {
            console.error('Error checking agent status:', error);
        }
    }

    private async detectActiveAIOperations(): Promise<boolean> {
        // Detect active AI operations by monitoring various indicators
        
        // Check for rapid document changes (AI generation pattern)
        const hasRapidChanges = await this.checkForRapidChanges();
        if (hasRapidChanges) {
            console.log('Rapid changes detected - AI likely generating');
            return true;
        }

        // Check for AI-related UI elements
        const hasAIPanels = await this.checkForAIPanels();
        if (hasAIPanels) {
            console.log('AI panels detected');
            return true;
        }

        // Check for idle time (user not typing, but system active)
        const isIdle = this.lastActivity < Date.now() - this.idleThreshold;
        if (isIdle) {
            console.log('User idle - possible AI activity');
            return true;
        }

        return false;
    }

    private async checkForRapidChanges(): Promise<boolean> {
        // Check if there have been many document changes recently
        const now = Date.now();
        const timeSinceLastActivity = now - this.lastActivity;
        
        // If user has been idle for a while, AI might be working
        return timeSinceLastActivity > this.idleThreshold;
    }

    private async checkForAIPanels(): Promise<boolean> {
        // Check if any AI-related panels are open
        const documents = vscode.workspace.textDocuments;
        for (const doc of documents) {
            const fileName = doc.fileName.toLowerCase();
            if (fileName.includes('chat') || fileName.includes('composer') || fileName.includes('cursor')) {
                return true;
            }
        }
        return false;
    }

    // Simulate agent start (for testing purposes)
    simulateAgentStart(): void {
        if (!this.isAgentRunning) {
            this.isAgentRunning = true;
            this.userPromptDetected = false; // Reset for next time
            console.log('Agent started - showing learning overlay');
            // Add a small delay to ensure proper initialization
            setTimeout(() => {
                this.learningOverlayManager.showOverlay();
            }, 100);
        }
    }

    // Simulate agent end (for testing purposes)
    simulateAgentEnd(): void {
        if (this.isAgentRunning) {
            this.isAgentRunning = false;
            console.log('Agent finished - notifying overlay');
            // Add a small delay to prevent timing issues
            setTimeout(() => {
                this.learningOverlayManager.notifyAgentCompleted();
            }, 100);
        }
    }

    // Manual trigger for testing
    toggleAgentSimulation(): void {
        console.log('toggleAgentSimulation called, isAgentRunning:', this.isAgentRunning);
        if (this.isAgentRunning) {
            // Don't end immediately, let it run for a bit
            console.log('Agent is already running, keeping it running...');
        } else {
            this.simulateAgentStart();
            // Keep agent running for at least 10 seconds for testing
            setTimeout(() => {
                if (this.isAgentRunning) {
                    console.log('Auto-ending agent after 10 seconds...');
                    this.simulateAgentEnd();
                }
            }, 10000);
        }
    }

    stopMonitoring(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = undefined;
        }
    }

    dispose(): void {
        this.stopMonitoring();
    }
}
