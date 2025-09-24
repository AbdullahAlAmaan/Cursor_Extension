# Testing the Cursor Learning Overlay

## 🚀 How to Test in Your Current Cursor Session

### Step 1: Run the Extension
1. **Press `F5`** in Cursor to run the extension
2. **A new Extension Development Host window will open**
3. **The extension will automatically start** in the new window

### Step 2: First-Time Setup
When the extension starts, you'll see:
1. **Welcome message** with "Get Started" button
2. **Topic selection** - choose from 15+ categories like:
   - JavaScript & TypeScript
   - AI/ML & Data Science
   - System Design & Architecture
   - Cooking & Food
   - Science & Technology
   - And more!

### Step 3: Test the Overlay
1. **Use the test command**: `Ctrl+Shift+P` → "Learning: Simulate Agent (Test)"
2. **The overlay should appear** with your selected topics
3. **Content rotates** every 30 seconds automatically
4. **Click "Test me!"** to see quiz functionality

### Step 4: Test Auto-Hide
1. **Start typing** in the editor
2. **Overlay should disappear** instantly
3. **Cursor UI should be restored**

## 🎯 Expected Behavior

✅ **No new window needed** - works in same Cursor session  
✅ **Topic selection** during first setup  
✅ **Only shows when agent working** (not just idle)  
✅ **Dynamic content** from your selected topics  
✅ **Auto-hide** when agent finishes  
✅ **User can interact** with agent results immediately  

## 🔧 Troubleshooting

- **No overlay appears**: Check if Ollama is running (`ollama serve`)
- **Reset setup**: `Ctrl+Shift+P` → "Learning: Reset Setup"
- **Check console**: Look for error messages in Debug Console

## 🎓 What You'll Learn

The extension will show content based on your selected topics:
- **Fun facts** about your interests
- **Quick quizzes** to test your knowledge
- **Explanations** to help you learn
- **Fresh content** every 30 seconds

This creates a productive learning experience while Cursor's AI agent is working! 🚀
