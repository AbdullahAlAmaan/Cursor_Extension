#!/usr/bin/env node

/**
 * Cursor Agent Log Monitor
 *
 * Watches Cursor logs in real time to detect when the AI agent
 * starts and finishes generating.
 *
 * Works on macOS, Linux, and Windows.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const EventEmitter = require("events");

// 🔌 Event emitter so you can hook into `agentStart` and `agentEnd`
class LogMonitor extends EventEmitter {
  constructor() {
    super();
    this.fileSizes = {};
    this.logFiles = [
      "main.log",
      "window9/renderer.log",
      "window9/views.log",
      "window9/exthost/exthost.log",
    ];
  }

  // Detect base log path by platform
  getLogBasePath() {
    switch (process.platform) {
      case "darwin":
        return path.join(os.homedir(), "Library/Application Support/Cursor/logs");
      case "win32":
        return path.join(process.env.APPDATA, "Cursor", "logs");
      default:
        // Linux and others
        return path.join(os.homedir(), ".config/Cursor/logs");
    }
  }

  // Find the most recent log directory with actual content
  getLatestLogDir(basePath) {
    if (!fs.existsSync(basePath)) {
      throw new Error(`Log directory not found: ${basePath}`);
    }
    const dirs = fs
      .readdirSync(basePath)
      .filter((name) => fs.statSync(path.join(basePath, name)).isDirectory())
      .sort()
      .reverse(); // Get most recent first
    
    // Find the first directory that has actual log files
    for (const dir of dirs) {
      const dirPath = path.join(basePath, dir);
      const files = fs.readdirSync(dirPath);
      if (files.some(file => file.endsWith('.log'))) {
        return dirPath;
      }
    }
    
    throw new Error("No log subdirectories with content found in " + basePath);
  }

  start() {
    const logBasePath = this.getLogBasePath();
    const latestLogDir = this.getLatestLogDir(logBasePath);

    console.log(`Monitoring logs in: ${latestLogDir}\n`);

    // Initialize file sizes
    this.logFiles.forEach((file) => {
      const filePath = path.join(latestLogDir, file);
      if (fs.existsSync(filePath)) {
        this.fileSizes[file] = fs.statSync(filePath).size;
        console.log(`Monitoring: ${file}`);
      }
    });

    // Poll files for changes
    setInterval(() => {
      this.logFiles.forEach((file) => {
        const filePath = path.join(latestLogDir, file);
        if (!fs.existsSync(filePath)) return;

        try {
          const currentSize = fs.statSync(filePath).size;
          const lastSize = this.fileSizes[file] || 0;

          if (currentSize > lastSize) {
            const fd = fs.openSync(filePath, "r");
            const buffer = Buffer.alloc(currentSize - lastSize);
            fs.readSync(fd, buffer, 0, buffer.length, lastSize);
            fs.closeSync(fd);

            const newContent = buffer.toString();
            const lines = newContent.split("\n").filter((l) => l.trim());

            lines.forEach((line) => {
              // 🔎 Look for various AI activity patterns
              if (/sending completion/i.test(line) || 
                  /agent request/i.test(line) ||
                  /cursor.*completion/i.test(line) ||
                  /ai.*request/i.test(line) ||
                  /chat.*request/i.test(line) ||
                  /prompt.*sent/i.test(line) ||
                  /generating.*response/i.test(line)) {
                console.log(`[${file}] ${new Date().toISOString()} [Agent START] ${line}`);
                this.emit("agentStart", line);
              }
              if (/received completion/i.test(line) || 
                  /agent finished/i.test(line) ||
                  /completion.*received/i.test(line) ||
                  /response.*generated/i.test(line) ||
                  /ai.*finished/i.test(line) ||
                  /chat.*response/i.test(line)) {
                console.log(`[${file}] ${new Date().toISOString()} [Agent END] ${line}`);
                this.emit("agentEnd", line);
              }
            });

            this.fileSizes[file] = currentSize;
          }
        } catch (err) {
          // Ignore read errors for files that rotate quickly
        }
      });
    }, 500);
  }
}

// 🔹 Standalone usage
if (require.main === module) {
  console.log("Starting Cursor Agent Log Monitor...");
  console.log("Go to Cursor and start a chat with the AI.\n");

  const monitor = new LogMonitor();

  monitor.on("agentStart", () => {
    console.log("➡️  Detected agent start, overlay could be shown here");
  });

  monitor.on("agentEnd", () => {
    console.log("✅ Detected agent end, overlay could be hidden here");
  });

  monitor.start();
}

// 🔹 Export for integration in a VS Code extension
module.exports = LogMonitor;
