import * as vscode from 'vscode';
import { LearningOverlayManager } from './learningOverlayManager';
import { OllamaService } from './ollamaService';
import { LocalStorage } from './localStorage';
import { AgentEventDetector } from './agentEventDetector';

let learningOverlayManager: LearningOverlayManager;
let ollamaService: OllamaService;
let localStorage: LocalStorage;
let agentEventDetector: AgentEventDetector;

export function activate(context: vscode.ExtensionContext) {
    console.log('Cursor Learning Overlay extension is now active!');

    // Initialize services
    ollamaService = new OllamaService();
    localStorage = new LocalStorage(context);
    learningOverlayManager = new LearningOverlayManager(ollamaService, localStorage);
    agentEventDetector = new AgentEventDetector(learningOverlayManager);

    // Register commands
    const toggleCommand = vscode.commands.registerCommand('cursor-learning-overlay.toggle', () => {
        learningOverlayManager.toggle();
    });

    const settingsCommand = vscode.commands.registerCommand('cursor-learning-overlay.settings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'cursorLearningOverlay');
    });

    const simulateAgentCommand = vscode.commands.registerCommand('cursor-learning-overlay.simulateAgent', () => {
        agentEventDetector.toggleAgentSimulation();
    });

    // Register event listeners for AI agent lifecycle
    const onDidStartTask = vscode.commands.registerCommand('cursor-learning-overlay.onDidStartTask', () => {
        learningOverlayManager.showOverlay();
    });

    const onDidEndTask = vscode.commands.registerCommand('cursor-learning-overlay.onDidEndTask', () => {
        learningOverlayManager.hideOverlay();
    });

    // Listen for Cursor-specific events (we'll need to detect these)
    // For now, we'll use a simple timer-based approach as a fallback
    let agentRunning = false;
    const checkAgentStatus = setInterval(() => {
        // This is a placeholder - in a real implementation, we'd listen to Cursor's actual events
        // For now, we'll simulate this with a manual trigger
    }, 1000);

    context.subscriptions.push(
        toggleCommand,
        settingsCommand,
        simulateAgentCommand,
        onDidStartTask,
        onDidEndTask,
        { dispose: () => clearInterval(checkAgentStatus) }
    );

    // Initialize the overlay manager and start monitoring
    learningOverlayManager.initialize();
    agentEventDetector.startMonitoring();
}

export function deactivate() {
    if (learningOverlayManager) {
        learningOverlayManager.dispose();
    }
    if (agentEventDetector) {
        agentEventDetector.dispose();
    }
}
