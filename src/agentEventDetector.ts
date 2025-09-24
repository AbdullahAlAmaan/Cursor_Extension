import * as vscode from 'vscode';

export class AgentEventDetector {
    private learningOverlayManager: any;
    private isAgentRunning: boolean = false;
    private checkInterval: NodeJS.Timeout | undefined;

    constructor(learningOverlayManager: any) {
        this.learningOverlayManager = learningOverlayManager;
    }

    startMonitoring(): void {
        // For now, we'll use a simple approach to detect when the user might be idle
        // In a real implementation, this would listen to Cursor's actual AI agent events
        
        // Check for active text editor changes as a proxy for user activity
        let lastActivity = Date.now();
        const idleThreshold = 30000; // 30 seconds of inactivity

        this.checkInterval = setInterval(() => {
            const now = Date.now();
            const timeSinceActivity = now - lastActivity;

            // If user has been idle for more than threshold and agent isn't running, start overlay
            if (timeSinceActivity > idleThreshold && !this.isAgentRunning) {
                this.simulateAgentStart();
            }
        }, 5000); // Check every 5 seconds

        // Listen for editor changes to reset idle timer
        vscode.workspace.onDidChangeTextDocument(() => {
            lastActivity = Date.now();
            if (this.isAgentRunning) {
                this.simulateAgentEnd();
            }
        });

        // Listen for cursor position changes
        vscode.window.onDidChangeTextEditorSelection(() => {
            lastActivity = Date.now();
            if (this.isAgentRunning) {
                this.simulateAgentEnd();
            }
        });

        // Listen for file changes
        vscode.workspace.onDidChangeTextDocument(() => {
            lastActivity = Date.now();
            if (this.isAgentRunning) {
                this.simulateAgentEnd();
            }
        });
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
