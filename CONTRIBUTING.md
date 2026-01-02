# Contributing to Expo Grab

Thank you for your interest in contributing! We welcome all contributions, from bug fixes to new features.

## How to Contribute

### Reporting Bugs

1. Check if the issue already exists in [GitHub Issues](https://github.com/xifanezz/expo-grab/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment (OS, Node version, etc.)

### Suggesting Features

Open a [GitHub Discussion](https://github.com/xifanezz/expo-grab/discussions) or Issue with:
- Clear description of the feature
- Use case / why it's needed
- Possible implementation approach

### Pull Requests

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/expo-grab.git`
3. **Create a branch**: `git checkout -b feature/your-feature`
4. **Make changes** and test thoroughly
5. **Commit** with clear messages
6. **Push** to your fork
7. **Open a PR** against `main`

## Development Setup

```bash
# Install dependencies
bun install

# Run in development
bun start

# The app will open - test your changes
```

## Priority Contribution Areas

### 1. UI/UX Improvements (High Priority)

We want a modern, polished interface. Ideas:
- **Theme system** - Dark/light mode toggle
- **Responsive layouts** - Better handling of window resizing
- **Animations** - Smooth transitions and micro-interactions
- **Accessibility** - Keyboard navigation, screen reader support
- **Custom components** - Replace basic elements with styled components

Files to focus on:
- `renderer/styles.css` - All styling
- `renderer/index.html` - HTML structure
- `renderer/renderer.js` - UI logic

### 2. Convex Backend Integration (High Priority)

Deep integration with [Convex](https://convex.dev) for:
- **Project sync** - Save/load projects to cloud
- **User auth** - Login with GitHub/Google
- **Templates** - Store and share project templates
- **Collaboration** - Real-time project sharing
- **Analytics** - Usage stats (opt-in)

Start by:
- Adding Convex client setup
- Creating basic schema (projects, users, templates)
- Implementing auth flow

### 3. New Features

- **More skills** - Testing, animations, state management
- **Plugin system** - Allow community extensions
- **Template gallery** - Pre-built project starters
- **Keyboard shortcuts** - Power user features
- **Settings panel** - User preferences

### 4. Code Quality

- TypeScript migration (currently JS)
- Unit tests
- E2E tests with Playwright
- Better error handling
- Code documentation

## Code Style

- Use **Bun** as runtime
- Prefer **const** over let
- Use **async/await** over callbacks
- Keep functions small and focused
- Add comments for complex logic
- Use meaningful variable names

## Commit Messages

Format: `type: description`

Types:
- `feat:` New feature
- `fix:` Bug fix
- `ui:` UI/styling changes
- `refactor:` Code refactoring
- `docs:` Documentation
- `test:` Tests

Examples:
- `feat: add dark mode toggle`
- `fix: terminal not resizing on window change`
- `ui: improve Ralph modal layout`

## Questions?

- Open a [Discussion](https://github.com/xifanezz/expo-grab/discussions)
- Tag maintainers in your PR

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
