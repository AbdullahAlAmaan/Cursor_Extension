import * as vscode from 'vscode';
import { LearningContent } from './ollamaService';

export interface UserPreferences {
    topics: string[];
    learningMode: 'single' | 'continuous';
    enabled: boolean;
    lastUsedTopics: string[];
    questionHistory: string[];
}

export class LocalStorage {
    private context: vscode.ExtensionContext;
    private preferences: UserPreferences;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.preferences = this.loadPreferences();
    }

    private loadPreferences(): UserPreferences {
        const config = vscode.workspace.getConfiguration('cursorLearningOverlay');
        
        return {
            topics: config.get('topics', ['JavaScript', 'TypeScript', 'React', 'Node.js', 'AI/ML']),
            learningMode: 'single',
            enabled: config.get('enabled', true),
            lastUsedTopics: this.context.globalState.get('lastUsedTopics', []),
            questionHistory: this.context.globalState.get('questionHistory', [])
        };
    }

    savePreferences(): void {
        this.context.globalState.update('preferences', this.preferences);
    }

    getTopics(): string[] {
        return this.preferences.topics;
    }

    setTopics(topics: string[]): void {
        this.preferences.topics = topics;
        this.savePreferences();
    }

    isEnabled(): boolean {
        return this.preferences.enabled;
    }

    setEnabled(enabled: boolean): void {
        this.preferences.enabled = enabled;
        this.savePreferences();
    }

    getLearningMode(): 'single' | 'continuous' {
        return this.preferences.learningMode;
    }

    setLearningMode(mode: 'single' | 'continuous'): void {
        this.preferences.learningMode = mode;
        this.savePreferences();
    }

    addQuestionToHistory(question: string): void {
        this.preferences.questionHistory.push(question);
        // Keep only last 100 questions to prevent storage bloat
        if (this.preferences.questionHistory.length > 100) {
            this.preferences.questionHistory = this.preferences.questionHistory.slice(-100);
        }
        this.savePreferences();
    }

    hasQuestionBeenAsked(question: string): boolean {
        return this.preferences.questionHistory.includes(question);
    }

    getQuestionHistory(): string[] {
        return this.preferences.questionHistory;
    }

    clearQuestionHistory(): void {
        this.preferences.questionHistory = [];
        this.savePreferences();
    }

    addToLastUsedTopics(topic: string): void {
        if (!this.preferences.lastUsedTopics.includes(topic)) {
            this.preferences.lastUsedTopics.unshift(topic);
            // Keep only last 10 topics
            if (this.preferences.lastUsedTopics.length > 10) {
                this.preferences.lastUsedTopics = this.preferences.lastUsedTopics.slice(0, 10);
            }
            this.savePreferences();
        }
    }

    getLastUsedTopics(): string[] {
        return this.preferences.lastUsedTopics;
    }

    // Get a random topic that hasn't been used recently
    getRandomTopic(): string {
        const availableTopics = this.preferences.topics.filter(topic => 
            !this.preferences.lastUsedTopics.slice(0, 3).includes(topic)
        );
        
        if (availableTopics.length === 0) {
            return this.preferences.topics[Math.floor(Math.random() * this.preferences.topics.length)];
        }
        
        return availableTopics[Math.floor(Math.random() * availableTopics.length)];
    }

    // Check if we should avoid repeating a question
    shouldAvoidQuestion(question: string): boolean {
        return this.hasQuestionBeenAsked(question);
    }

    // Mark a question as used
    markQuestionAsUsed(question: string): void {
        this.addQuestionToHistory(question);
    }
}
