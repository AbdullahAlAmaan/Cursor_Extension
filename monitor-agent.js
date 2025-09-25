#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Use the active log directory
const logBasePath = path.join(process.env.HOME, 'Library/Application Support/Cursor/logs');
const latestLogDir = path.join(logBasePath, '20250924T194920');
console.log(`Monitoring logs in: ${latestLogDir}`);

// Monitor multiple log files
const logFiles = [
    'main.log',
    'window9/renderer.log',
    'window9/views.log',
    'window9/exthost/exthost.log'
];

console.log('Starting agent monitoring...');
console.log('Now go to Cursor and start a chat with the AI to see what gets logged!');
console.log('Press Ctrl+C to stop monitoring\n');

// Track file sizes
const fileSizes = {};
logFiles.forEach(file => {
    const filePath = path.join(latestLogDir, file);
    if (fs.existsSync(filePath)) {
        fileSizes[file] = fs.statSync(filePath).size;
        console.log(`Monitoring: ${file}`);
    }
});

setInterval(() => {
    logFiles.forEach(file => {
        try {
            const filePath = path.join(latestLogDir, file);
            if (!fs.existsSync(filePath)) return;
            
            const currentSize = fs.statSync(filePath).size;
            const lastSize = fileSizes[file] || 0;
            
            if (currentSize > lastSize) {
                // Read new content
                const fd = fs.openSync(filePath, 'r');
                const buffer = Buffer.alloc(currentSize - lastSize);
                fs.readSync(fd, buffer, 0, buffer.length, lastSize);
                fs.closeSync(fd);
                
                const newContent = buffer.toString();
                const lines = newContent.split('\n').filter(line => line.trim());
                
                // Look for agent-related activity
                lines.forEach(line => {
                    if (line.toLowerCase().includes('agent') || 
                        line.toLowerCase().includes('completion') ||
                        line.toLowerCase().includes('request') ||
                        line.toLowerCase().includes('ai') ||
                        line.toLowerCase().includes('chat') ||
                        line.toLowerCase().includes('prompt') ||
                        line.toLowerCase().includes('cursor') ||
                        line.toLowerCase().includes('assistant')) {
                        console.log(`[${file}] [${new Date().toISOString()}] ${line}`);
                    }
                });
                
                fileSizes[file] = currentSize;
            }
        } catch (error) {
            // Silently continue if file doesn't exist or can't be read
        }
    });
}, 500); // Check every 500ms for faster detection
