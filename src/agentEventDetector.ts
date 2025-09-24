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
        console.log('Starting Cursor agent monitoring...');
        
        // Monitor for Cursor-specific AI agent events
        this.monitorCursorAgentEvents();
        
        // Monitor for user prompts and agent activity
        this.monitorUserPrompts();
    }

    private monitorCursorAgentEvents(): void {
        // Listen for Cursor's AI agent events
        // These are Cursor-specific events that we need to detect
        
        // Check for AI agent status periodically
        this.checkInterval = setInterval(async () => {
            await this.checkAgentStatus();
        }, 1000); // Check every 1 second for faster response

        // Listen for editor changes to detect when user is active
        vscode.workspace.onDidChangeTextDocument(() => {
            this.lastActivity = Date.now();
            if (this.isAgentRunning) {
                this.simulateAgentEnd();
            }
        });

        // Listen for cursor position changes
        vscode.window.onDidChangeTextEditorSelection(() => {
            this.lastActivity = Date.now();
            if (this.isAgentRunning) {
                this.simulateAgentEnd();
            }
        });

        // Listen for file changes
        vscode.workspace.onDidOpenTextDocument(() => {
            this.lastActivity = Date.now();
            if (this.isAgentRunning) {
                this.simulateAgentEnd();
            }
        });
    }

    private monitorUserPrompts(): void {
        // Monitor for user prompts in the chat/command palette
        // This is a simplified approach - in real implementation, we'd listen to Cursor's specific events
        
        // Monitor for text input in chat panels
        vscode.window.onDidChangeActiveTextEditor(() => {
            // Check if user is typing in a chat or prompt area
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && activeEditor.document.fileName.includes('chat')) {
                this.detectUserPrompt();
            }
        });

        // Monitor for document changes that might indicate AI prompts
        vscode.workspace.onDidChangeTextDocument((event) => {
            // Check if the change is in a chat or AI-related document
            if (event.document.fileName.includes('chat') || event.document.fileName.includes('ai')) {
                this.detectUserPrompt();
            }
        });
    }

    private detectUserPrompt(): void {
        if (!this.userPromptDetected) {
            this.userPromptDetected = true;
            console.log('User prompt detected, waiting for agent to start...');
            
            // Start monitoring for agent activity after a short delay
            setTimeout(() => {
                this.startAgentDetection();
            }, 2000); // Wait 2 seconds for agent to start
        }
    }

    private startAgentDetection(): void {
        // Start more frequent monitoring when we expect agent to be running
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        this.checkInterval = setInterval(async () => {
            await this.checkAgentStatus();
        }, 500); // Check every 500ms for faster detection
    }

    private monitorUserActivity(): void {
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
                // Check if user has become active again (agent finished)
                if (timeSinceActivity < 5000) { // 5 seconds of recent activity
                    this.simulateAgentEnd();
                }
            }
        } catch (error) {
            console.error('Error checking agent status:', error);
        }
    }

    private async detectActiveAIOperations(): Promise<boolean> {
        // This is a placeholder for detecting active AI operations
        // In a real implementation, this would check Cursor's AI agent status
        
        // For now, we'll use a simple heuristic based on user activity
        return this.lastActivity < Date.now() - this.idleThreshold;
    }

    // Simulate agent start (for testing purposes)
    simulateAgentStart(): void {
        if (!this.isAgentRunning) {
            this.isAgentRunning = true;
            this.userPromptDetected = false; // Reset for next time
            console.log('Agent started - showing learning overlay');
            this.learningOverlayManager.showOverlay();
        }
    }

    // Simulate agent end (for testing purposes)
    simulateAgentEnd(): void {
        if (this.isAgentRunning) {
            this.isAgentRunning = false;
            console.log('Agent finished - notifying overlay');
            this.learningOverlayManager.notifyAgentCompleted();
        }
    }

    // Manual trigger for testing
    toggleAgentSimulation(): void {
        if (this.isAgentRunning) {
            this.simulateAgentEnd();
        } else {
            this.simulateAgentStart();
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
