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

    // Extension is starting up

    try {
        // Initialize services
        ollamaService = new OllamaService();
        localStorage = new LocalStorage(context);
        learningOverlayManager = new LearningOverlayManager(ollamaService, localStorage);
        agentEventDetector = new AgentEventDetector(learningOverlayManager);
        console.log('Services initialized successfully');
    } catch (error) {
        console.error('Error initializing services:', error);
        vscode.window.showErrorMessage('Failed to initialize Cursor Learning Overlay: ' + error);
        return;
    }

    // Register commands FIRST
    console.log('Starting command registration...');
    const toggleCommand = vscode.commands.registerCommand('cursor-learning-overlay.toggle', () => {
        console.log('Toggle command called');
        if (learningOverlayManager) {
            learningOverlayManager.toggle();
        } else {
            console.error('LearningOverlayManager not initialized');
            vscode.window.showErrorMessage('LearningOverlayManager not initialized');
        }
    });

    const settingsCommand = vscode.commands.registerCommand('cursor-learning-overlay.settings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'cursorLearningOverlay');
    });

    const simulateAgentCommand = vscode.commands.registerCommand('cursor-learning-overlay.simulateAgent', () => {
        console.log('Simulate Agent command called');
        if (agentEventDetector) {
            agentEventDetector.toggleAgentSimulation();
        } else {
            console.error('AgentEventDetector not initialized');
            vscode.window.showErrorMessage('AgentEventDetector not initialized');
        }
    });

    const resetSetupCommand = vscode.commands.registerCommand('cursor-learning-overlay.resetSetup', async () => {
        context.globalState.update('hasCompletedSetup', false);
        vscode.window.showInformationMessage('Setup reset! Please reload the window to restart the setup process.');
    });

    // Simple test command
    const testCommand = vscode.commands.registerCommand('cursor-learning-overlay.test', () => {
        console.log('Test command called - extension is working!');
        vscode.window.showInformationMessage('Extension is working! Commands are registered successfully.');
    });

    // Real agent event listeners for Cursor AI integration
    setupRealAgentListeners();

    context.subscriptions.push(
        toggleCommand,
        settingsCommand,
        simulateAgentCommand,
        resetSetupCommand,
        testCommand
    );
    
    console.log('Commands registered successfully');
    
    // Test if commands are actually registered
    vscode.commands.getCommands().then(commands => {
        const learningCommands = commands.filter(cmd => cmd.startsWith('cursor-learning-overlay.'));
        console.log('Available learning commands:', learningCommands);
    });

    // Initialize the overlay manager
    learningOverlayManager.initialize();
    
    // Check if this is first time setup AFTER commands are registered
    checkFirstTimeSetup(context);
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
    try {
        const hasCompletedSetup = context.globalState.get('hasCompletedSetup', false);
        console.log('Has completed setup:', hasCompletedSetup);
        
        if (!hasCompletedSetup) {
            // Show welcome and topic selection
            console.log('Showing welcome and topic selection');
            await showWelcomeAndTopicSelection(context);
        } else {
            // Start monitoring for agent events
            console.log('Starting agent monitoring');
            agentEventDetector.startMonitoring();
        }
    } catch (error) {
        console.error('Error in checkFirstTimeSetup:', error);
        vscode.window.showErrorMessage('Setup error: ' + error);
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

function setupRealAgentListeners() {
    console.log('Setting up real agent listeners...');
    
    // Monitor for Cursor AI chat activity
    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            const fileName = editor.document.fileName.toLowerCase();
            if (fileName.includes('chat') || fileName.includes('composer')) {
                console.log('Cursor AI panel activated - starting monitoring');
                if (agentEventDetector) {
                    agentEventDetector.detectUserPrompt();
                }
            }
        }
    });

    // Monitor for document changes that might indicate AI generation
    vscode.workspace.onDidChangeTextDocument((event) => {
        const fileName = event.document.fileName.toLowerCase();
        
        // Check if it's an AI-related document
        if (fileName.includes('chat') || fileName.includes('composer') || fileName.includes('cursor')) {
            console.log('AI document changed:', fileName);
            if (agentEventDetector) {
                agentEventDetector.detectUserPrompt();
            }
        }
        
        // Check for rapid changes (AI generation pattern)
        if (event.contentChanges.length > 3) {
            console.log('Rapid changes detected - possible AI generation');
            if (agentEventDetector) {
                agentEventDetector.detectAIGeneration();
            }
        }
    });

    // Monitor for workspace changes
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
        console.log('Workspace changed - checking for AI activity');
        if (agentEventDetector) {
            agentEventDetector.checkForAIActivity();
        }
    });

    console.log('Real agent listeners set up successfully');
}
