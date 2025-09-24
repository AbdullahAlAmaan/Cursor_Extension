import * as vscode from 'vscode';

export class AgentEventDetector {
    private learningOverlayManager: any;
    private isAgentRunning: boolean = false;
    private checkInterval: NodeJS.Timeout | undefined;
    private lastActivity: number = Date.now();
    private idleThreshold: number = 30000; // 30 seconds of inactivity (only for fallback)

    constructor(learningOverlayManager: any) {
        this.learningOverlayManager = learningOverlayManager;
    }

    startMonitoring(): void {
        console.log('Starting Cursor agent monitoring...');
        
        // Monitor for Cursor-specific AI agent events
        this.monitorCursorAgentEvents();
        
        // Note: We don't start idle monitoring by default
        // The overlay should only appear when agent is actually working
    }

    private monitorCursorAgentEvents(): void {
        // Listen for Cursor's AI agent events
        // These are Cursor-specific events that we need to detect
        
        // Check for AI agent status periodically
        this.checkInterval = setInterval(async () => {
            await this.checkAgentStatus();
        }, 2000); // Check every 2 seconds

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
            
            // For now, we'll use a heuristic: if there's no user activity for a while,
            // and no recent editor changes, assume the agent might be running
            const now = Date.now();
            const timeSinceActivity = now - this.lastActivity;
            
            if (timeSinceActivity > this.idleThreshold && !this.isAgentRunning) {
                // Check if there are any active AI operations
                const hasActiveAI = await this.detectActiveAIOperations();
                if (hasActiveAI) {
                    this.simulateAgentStart();
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
            console.log('Simulating agent start - showing learning overlay');
            this.learningOverlayManager.showOverlay();
        }
    }

    // Simulate agent end (for testing purposes)
    simulateAgentEnd(): void {
        if (this.isAgentRunning) {
            this.isAgentRunning = false;
            console.log('Simulating agent end - hiding learning overlay');
            this.learningOverlayManager.hideOverlay();
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
