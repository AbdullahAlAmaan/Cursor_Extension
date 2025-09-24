import axios from 'axios';
import * as vscode from 'vscode';

export interface LearningContent {
    funFact: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    topic: string;
}

export class OllamaService {
    private config = vscode.workspace.getConfiguration('cursorLearningOverlay');
    private ollamaUrl: string;
    private model: string;

    constructor() {
        this.ollamaUrl = this.config.get('ollamaUrl', 'http://localhost:11434');
        this.model = this.config.get('model', 'wizardlm2:latest');
    }

    async generateFunFact(topics: string[]): Promise<LearningContent | null> {
        try {
            const randomTopic = topics[Math.floor(Math.random() * topics.length)];
            
            const prompt = `Generate a fun fact for a developer about "${randomTopic}". 
            
            Return ONLY a JSON object with this exact structure:
            {
                "funFact": "A short, interesting fact about ${randomTopic} (1-2 sentences)",
                "question": "",
                "options": [],
                "correctAnswer": 0,
                "explanation": "",
                "topic": "${randomTopic}"
            }

            Make it educational but engaging and surprising. Focus on something developers might not know.`;

            const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
                model: this.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.8,
                    top_p: 0.9
                }
            });

            const content = response.data.response;
            
            // Try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonContent = JSON.parse(jsonMatch[0]);
                return jsonContent as LearningContent;
            } else {
                // Fallback if JSON parsing fails
                return this.createFallbackFunFact(randomTopic);
            }

        } catch (error) {
            console.error('Error generating fun fact:', error);
            // Return fallback content if Ollama is not available
            const randomTopic = topics[Math.floor(Math.random() * topics.length)];
            return this.createFallbackFunFact(randomTopic);
        }
    }

    async generateQuizFromFunFact(funFact: LearningContent): Promise<LearningContent | null> {
        try {
            const prompt = `Based on this fun fact about "${funFact.topic}": "${funFact.funFact}"
            
            Generate a quiz question that tests understanding of this topic.
            
            Return ONLY a JSON object with this exact structure:
            {
                "funFact": "",
                "question": "A single multiple choice question about ${funFact.topic}",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": 0,
                "explanation": "Brief explanation of why the correct answer is right (1-2 sentences)",
                "topic": "${funFact.topic}"
            }

            Make the question practical and relevant to developers, testing their understanding of the concept.`;

            const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
                model: this.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9
                }
            });

            const content = response.data.response;
            
            // Try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonContent = JSON.parse(jsonMatch[0]);
                return jsonContent as LearningContent;
            } else {
                // Fallback if JSON parsing fails
                return this.createFallbackQuiz(funFact.topic);
            }

        } catch (error) {
            console.error('Error generating quiz:', error);
            // Return fallback content if Ollama is not available
            return this.createFallbackQuiz(funFact.topic);
        }
    }

    async generateLearningContent(topics: string[]): Promise<LearningContent | null> {
        // This method is kept for backward compatibility
        return this.generateFunFact(topics);
    }

    private createFallbackFunFact(topic: string): LearningContent {
        const fallbackContent: { [key: string]: LearningContent } = {
            'JavaScript': {
                funFact: "JavaScript was created in just 10 days by Brendan Eich in 1995 while working at Netscape.",
                question: "",
                options: [],
                correctAnswer: 0,
                explanation: "",
                topic: 'JavaScript'
            },
            'TypeScript': {
                funFact: "TypeScript was created by Microsoft and first released in 2012, but it only became widely adopted around 2017-2018.",
                question: "",
                options: [],
                correctAnswer: 0,
                explanation: "",
                topic: 'TypeScript'
            },
            'React': {
                funFact: "React was created by Jordan Walke at Facebook and was first used in Facebook's newsfeed in 2011.",
                question: "",
                options: [],
                correctAnswer: 0,
                explanation: "",
                topic: 'React'
            },
            'Node.js': {
                funFact: "Node.js was created by Ryan Dahl in 2009 and is built on Chrome's V8 JavaScript engine.",
                question: "",
                options: [],
                correctAnswer: 0,
                explanation: "",
                topic: 'Node.js'
            },
            'AI/ML': {
                funFact: "The term 'machine learning' was coined by Arthur Samuel in 1959, making it over 60 years old.",
                question: "",
                options: [],
                correctAnswer: 0,
                explanation: "",
                topic: 'AI/ML'
            }
        };

        return fallbackContent[topic] || fallbackContent['JavaScript'];
    }

    private createFallbackQuiz(topic: string): LearningContent {
        const fallbackContent: { [key: string]: LearningContent } = {
            'JavaScript': {
                funFact: "",
                question: "What is the result of typeof null in JavaScript?",
                options: ["'object'", "'null'", "'undefined'", "'string'"],
                correctAnswer: 0,
                explanation: "typeof null returns 'object' due to a historical bug in JavaScript that has been preserved for backward compatibility.",
                topic: 'JavaScript'
            },
            'TypeScript': {
                funFact: "",
                question: "What is the main benefit of using TypeScript over JavaScript?",
                options: ["Better performance", "Static type checking", "Smaller file sizes", "Faster execution"],
                correctAnswer: 1,
                explanation: "TypeScript's main benefit is static type checking, which helps catch errors at compile time rather than runtime.",
                topic: 'TypeScript'
            },
            'React': {
                funFact: "",
                question: "What is the correct way to update state in a React functional component?",
                options: ["this.setState()", "useState() hook", "this.state = newValue", "state = newValue"],
                correctAnswer: 1,
                explanation: "In functional components, you use the useState() hook to manage state, not this.setState() which is for class components.",
                topic: 'React'
            },
            'Node.js': {
                funFact: "",
                question: "What does Node.js use for handling asynchronous operations?",
                options: ["Threads", "Event loop", "Processes", "Web workers"],
                correctAnswer: 1,
                explanation: "Node.js uses an event loop to handle asynchronous operations efficiently in a single-threaded environment.",
                topic: 'Node.js'
            },
            'AI/ML': {
                funFact: "",
                question: "What is the main difference between supervised and unsupervised learning?",
                options: ["Speed of training", "Use of labeled data", "Type of algorithms", "Hardware requirements"],
                correctAnswer: 1,
                explanation: "Supervised learning uses labeled training data, while unsupervised learning finds patterns in data without labels.",
                topic: 'AI/ML'
            }
        };

        return fallbackContent[topic] || fallbackContent['JavaScript'];
    }

    private createFallbackContent(topic: string): LearningContent {
        // This method is kept for backward compatibility
        return this.createFallbackFunFact(topic);
    }

    async checkOllamaConnection(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.ollamaUrl}/api/tags`);
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }
}

