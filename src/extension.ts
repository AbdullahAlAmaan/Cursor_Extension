import * as vscode from 'vscode';
import { LearningOverlayManager } from './learningOverlayManager';
import { OllamaService } from './ollamaService';
import { LocalStorage } from './localStorage';

let learningOverlayManager: LearningOverlayManager;
let ollamaService: OllamaService;
let localStorage: LocalStorage;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('Cursor Learning Overlay extension is now active!');

    // Extension is starting up

    try {
        // Initialize services
        ollamaService = new OllamaService();
        localStorage = new LocalStorage(context);
        learningOverlayManager = new LearningOverlayManager(ollamaService, localStorage);
        console.log('Services initialized successfully');
    } catch (error) {
        console.error('Error initializing services:', error);
        vscode.window.showErrorMessage('Failed to initialize Cursor Learning Overlay: ' + error);
        return;
    }

    // Register commands
    console.log('Starting command registration...');
    
    const showFunFactCommand = vscode.commands.registerCommand(
        "cursor-learning-overlay.showFunFact",
        async () => {
            console.log('Show Fun Fact command called');
            if (learningOverlayManager) {
                await learningOverlayManager.showOverlay();
            } else {
                console.error('LearningOverlayManager not initialized');
                vscode.window.showErrorMessage('LearningOverlayManager not initialized');
            }
        }
    );

    const settingsCommand = vscode.commands.registerCommand('cursor-learning-overlay.settings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'cursorLearningOverlay');
    });

    // Create status bar button
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        100
    );
    statusBarItem.text = "🎓 Fun Fact";
    statusBarItem.command = "cursor-learning-overlay.showFunFact";
    statusBarItem.tooltip = "Click to see a fun fact and quiz";
    
    // Show status bar button based on configuration
    const config = vscode.workspace.getConfiguration('cursorLearningOverlay');
    const showButton = config.get('showButton', true);
    if (showButton) {
        statusBarItem.show();
    }

    context.subscriptions.push(
        showFunFactCommand,
        settingsCommand,
        statusBarItem
    );
    
    console.log('Commands registered successfully');
    
    // Test if commands are actually registered
    vscode.commands.getCommands().then(commands => {
        const learningCommands = commands.filter(cmd => cmd.startsWith('cursor-learning-overlay.'));
        console.log('Available learning commands:', learningCommands);
    });

    // Initialize the overlay manager
    learningOverlayManager.initialize();
    
    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('cursorLearningOverlay.showButton')) {
            const config = vscode.workspace.getConfiguration('cursorLearningOverlay');
            const showButton = config.get('showButton', true);
            if (showButton) {
                statusBarItem.show();
            } else {
                statusBarItem.hide();
            }
        }
    });
    
    // Check if this is first time setup AFTER commands are registered
    checkFirstTimeSetup(context);
}

export function deactivate() {
    if (learningOverlayManager) {
        learningOverlayManager.dispose();
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
            console.log('Setup already completed');
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
            `Great! You've selected ${selectedTopics.length} topics. Click the 🎓 Fun Fact button in the status bar to start learning!`,
            'Open Settings'
        ).then(selection => {
            if (selection === 'Open Settings') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'cursorLearningOverlay');
            }
        });
    } else {
        // User cancelled, use default topics
        localStorage.setTopics(['JavaScript & TypeScript', 'AI/ML & Data Science', 'System Design & Architecture']);
        context.globalState.update('hasCompletedSetup', true);
    }
}

