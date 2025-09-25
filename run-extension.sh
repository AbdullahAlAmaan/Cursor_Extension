#!/bin/bash

# Cursor Learning Overlay - Run Extension Script for Mac

echo "🚀 Starting Cursor Learning Overlay Extension..."

# Compile the extension first
echo "📦 Compiling TypeScript..."
npm run compile

if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
    echo "🎯 Opening extension in Cursor..."
    
    # Open the extension in Cursor
    cursor --extensionDevelopmentPath=. .
    
    echo "🎉 Extension should now be running in a new Cursor window!"
    echo "📝 Check the Debug Console for extension logs"
else
    echo "❌ Compilation failed! Please check the errors above."
    exit 1
fi
