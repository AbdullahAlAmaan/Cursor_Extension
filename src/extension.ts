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

    // Check if this is first time setup
    checkFirstTimeSetup(context);

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

    const resetSetupCommand = vscode.commands.registerCommand('cursor-learning-overlay.resetSetup', async () => {
        context.globalState.update('hasCompletedSetup', false);
        vscode.window.showInformationMessage('Setup reset! Please reload the window to restart the setup process.');
    });

    // Register event listeners for AI agent lifecycle
    const onDidStartTask = vscode.commands.registerCommand('cursor-learning-overlay.onDidStartTask', () => {
        learningOverlayManager.showOverlay();
    });

    const onDidEndTask = vscode.commands.registerCommand('cursor-learning-overlay.onDidEndTask', async () => {
        await learningOverlayManager.hideOverlay();
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
        resetSetupCommand,
        onDidStartTask,
        onDidEndTask,
        { dispose: () => clearInterval(checkAgentStatus) }
    );

    // Initialize the overlay manager
    learningOverlayManager.initialize();
}

export function deactivate() {
    if (learningOverlayManager) {
        learningOverlayManager.dispose();
    }
    if (agentEventDetector) {
        agentEventDetector.dispose();
    }
}

async function checkFirstTimeSetup(context: vscode.ExtensionContext) {
    const hasCompletedSetup = context.globalState.get('hasCompletedSetup', false);
    
    if (!hasCompletedSetup) {
        // Show welcome and topic selection
        await showWelcomeAndTopicSelection(context);
    } else {
        // Start monitoring for agent events
        agentEventDetector.startMonitoring();
    }
}

async function showWelcomeAndTopicSelection(context: vscode.ExtensionContext) {
    const welcomeMessage = await vscode.window.showInformationMessage(
        'Welcome to Cursor Learning Overlay! 🎓\n\nThis extension will show you fun facts and quizzes while Cursor\'s AI agent is working. Let\'s set up your learning preferences!',
        'Get Started'
    );

    if (welcomeMessage === 'Get Started') {
        await showTopicSelection(context);
    }
}

async function showTopicSelection(context: vscode.ExtensionContext) {
    const topicOptions = [
        'JavaScript & TypeScript',
        'React & Frontend',
        'Node.js & Backend',
        'AI/ML & Data Science',
        'System Design & Architecture',
        'DevOps & Cloud',
        'Python & Data',
        'Mobile Development',
        'Web3 & Blockchain',
        'Cooking & Food',
        'Science & Technology',
        'History & Culture',
        'Sports & Fitness',
        'Art & Design',
        'Business & Finance'
    ];

    const selectedTopics = await vscode.window.showQuickPick(
        topicOptions,
        {
            canPickMany: true,
            placeHolder: 'Select topics you\'re interested in learning about (you can change these later)',
            title: 'Choose Your Learning Topics'
        }
    );

    if (selectedTopics && selectedTopics.length > 0) {
        // Save selected topics
        localStorage.setTopics(selectedTopics);
        context.globalState.update('hasCompletedSetup', true);
        
        // Show completion message
        vscode.window.showInformationMessage(
            `Great! You've selected ${selectedTopics.length} topics. The learning overlay will appear when Cursor's AI agent is working.`,
            'Open Settings'
        ).then(selection => {
            if (selection === 'Open Settings') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'cursorLearningOverlay');
            }
        });

        // Start monitoring for agent events
        agentEventDetector.startMonitoring();
    } else {
        // User cancelled, use default topics
        localStorage.setTopics(['JavaScript & TypeScript', 'AI/ML & Data Science', 'System Design & Architecture']);
        context.globalState.update('hasCompletedSetup', true);
        agentEventDetector.startMonitoring();
    }
}
