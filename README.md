# Expo Grab

A modern Electron-based development environment for building React Native/Expo apps with AI assistance.

![Expo Grab Screenshot](https://img.shields.io/badge/Platform-macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

## Features

- **Integrated Terminal** - Full terminal with Claude Code AI assistant built-in
- **Expo Web Preview** - Live preview of your Expo app with hot reload
- **Ralph Agent** - Autonomous development agent for hands-free coding
- **Skills System** - Best practices for React Native (components, navigation, styling, API, performance, auth)
- **Convex Integration** - One-click backend setup with Convex
- **File Browser** - Drag files to terminal, quick navigation
- **MCP Server** - Model Context Protocol for Claude communication

## Quick Start

```bash
# Clone the repo
git clone https://github.com/xifanezz/expo-grab.git
cd expo-grab

# Install dependencies
bun install

# Run the app
bun start
```

## Requirements

- **macOS or Linux** (Windows not supported - Claude Code CLI requires Unix)
- [Bun](https://bun.sh) (recommended) or Node.js 18+
- [Claude Code CLI](https://claude.ai/claude-code) for AI features

## Usage

1. **New Project** - Click "+ New" to create a new Expo project with skills pre-configured
2. **Open Project** - Click "Open" to work with an existing project
3. **Claude Code** - Click "Claude" button to start AI-assisted development
4. **Ralph Agent** - Click "Ralph" for autonomous development loops
5. **Expo Preview** - Click "Expo" to start the development server

## Architecture

```
expo-grab/
├── main.js              # Electron main process
├── preload.js           # Preload scripts
├── renderer/
│   ├── index.html       # Main UI
│   ├── renderer.js      # Renderer process logic
│   └── styles.css       # Styling
├── mcp-server/          # MCP server for Claude
│   └── index.js
└── lib/                 # Utilities
    ├── elementInspector.js
    └── screenCapture.js
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Priority Areas

1. **UI/UX Improvements**
   - Modern, polished interface
   - Better responsive design
   - Accessibility improvements
   - Dark/light theme support

2. **Convex Backend Integration**
   - Real-time data sync
   - User authentication
   - Project templates with Convex
   - Convex function generation

3. **Features**
   - More skill files (testing, animations, etc.)
   - Plugin system
   - Project templates
   - Better error handling

### Getting Started with Development

```bash
# Fork and clone the repo
git clone https://github.com/YOUR_USERNAME/expo-grab.git

# Create a feature branch
git checkout -b feature/your-feature

# Make changes and test
bun start

# Submit a PR
```

## Tech Stack

- **Electron** - Desktop app framework
- **xterm.js** - Terminal emulator
- **node-pty** - PTY handling
- **Bun** - JavaScript runtime
- **Convex** - Backend platform (planned deep integration)

## Roadmap

- [ ] Convex backend integration
- [ ] Plugin/extension system
- [ ] Project templates gallery
- [ ] Collaborative features
- [ ] Mobile companion app
- [ ] VS Code extension

## License

MIT License - see [LICENSE](LICENSE)

## Community

- [GitHub Issues](https://github.com/xifanezz/expo-grab/issues) - Bug reports & feature requests
- [Discussions](https://github.com/xifanezz/expo-grab/discussions) - Questions & ideas

---

Built with Claude Code and the Expo/React Native community in mind.
