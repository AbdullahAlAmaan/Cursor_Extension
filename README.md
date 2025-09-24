# Cursor Learning Overlay

Transform idle time during AI agent execution into productive microlearning opportunities.

## Features

- **Fullscreen Learning Overlay**: Takes over your IDE screen during AI agent execution
- **Fun Facts & Quizzes**: Engaging microlearning content based on your chosen topics
- **Local LLM Integration**: Uses Ollama for content generation (no external API keys needed)
- **Smart Content**: Avoids repeating questions and personalizes based on your interests
- **Auto-Hide**: Instantly disappears when you return to coding

## Prerequisites

1. **Ollama**: Install and run Ollama locally
   ```bash
   # Install Ollama (macOS)
   brew install ollama
   
   # Start Ollama
   ollama serve
   
   # Pull a model (recommended: wizardlm2:latest)
   ollama pull wizardlm2:latest
   ```

2. **VS Code**: This extension is designed for VS Code/Cursor

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the extension:
   ```bash
   npm run compile
   ```
4. Press `F5` in VS Code to run the extension in a new Extension Development Host window

## Usage

### Basic Usage

1. **Automatic Mode**: The extension will automatically show the learning overlay when you're idle for 30+ seconds
2. **Manual Toggle**: Use `Ctrl+Shift+P` → "Learning: Toggle Learning Overlay"
3. **Test Mode**: Use `Ctrl+Shift+P` → "Learning: Simulate Agent (Test)" to manually trigger the overlay

### Configuration

Open Settings (`Ctrl+,`) and search for "Cursor Learning Overlay" to configure:

- **Topics**: Choose your learning topics (JavaScript, TypeScript, React, etc.)
- **Ollama URL**: Default is `http://localhost:11434`
- **Model**: Default is `wizardlm2:latest`
- **Enabled**: Toggle the extension on/off

### Learning Flow

1. **Fun Fact**: See an interesting fact about your chosen topic
2. **Test Me**: Click to reveal a multiple choice question
3. **Answer**: Select your answer
4. **Explanation**: See the correct answer and explanation
5. **Next**: Continue with more questions or close the overlay

## How It Works

1. **Agent Detection**: Monitors for AI agent activity (currently simulated with idle detection)
2. **Content Generation**: Uses Ollama to generate personalized learning content
3. **Smart Caching**: Avoids repeating questions and tracks your learning history
4. **Seamless Integration**: Overlay appears/disappears automatically

## Development

### Project Structure

```
src/
├── extension.ts              # Main extension entry point
├── learningOverlayManager.ts # Manages the fullscreen overlay
├── ollamaService.ts          # Handles Ollama API integration
├── localStorage.ts           # Manages user preferences and history
└── agentEventDetector.ts     # Detects AI agent lifecycle events
```

### Building

```bash
# Compile TypeScript
npm run compile

# Watch for changes
npm run watch
```

### Testing

1. Run the extension in development mode (`F5`)
2. Use the "Simulate Agent (Test)" command to test the overlay
3. Check the console for debug information

## Future Enhancements

- **Real Agent Integration**: Connect to actual Cursor AI agent events
- **Cloud Sync**: Sync learning progress across devices
- **Gamification**: Add streaks, XP, and achievements
- **More Content Types**: Code snippets, coding challenges, etc.
- **Analytics**: Track learning progress and topic mastery

## Troubleshooting

### Ollama Not Running
- Make sure Ollama is installed and running: `ollama serve`
- Check the Ollama URL in settings (default: `http://localhost:11434`)
- Verify the model is available: `ollama list`

### Overlay Not Appearing
- Check if the extension is enabled in settings
- Try the manual toggle command
- Check the console for error messages

### Content Not Generating
- Verify Ollama is running and accessible
- Check your internet connection (for model downloads)
- Try a different model in settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
