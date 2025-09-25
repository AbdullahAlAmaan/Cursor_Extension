#!/bin/bash

# Install Cursor Learning Overlay Extension in Main Cursor Window

echo "🚀 Installing Cursor Learning Overlay Extension..."

# Compile the extension
echo "📦 Compiling TypeScript..."
npm run compile

if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
    
    # Create .vsix package
    echo "📦 Creating extension package..."
    npx vsce package --no-dependencies
    
    if [ $? -eq 0 ]; then
        echo "✅ Extension package created!"
        echo "📁 Package location: cursor-learning-overlay-0.0.1.vsix"
        echo ""
        echo "🎯 To install the extension:"
        echo "1. Open Cursor"
        echo "2. Press Cmd+Shift+P"
        echo "3. Type 'Extensions: Install from VSIX...'"
        echo "4. Select the .vsix file"
        echo "5. Reload Cursor"
        echo ""
        echo "🎉 Then you can test it in your main Cursor window!"
    else
        echo "❌ Failed to create extension package"
        exit 1
    fi
else
    echo "❌ Compilation failed!"
    exit 1
fi
