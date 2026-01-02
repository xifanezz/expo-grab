// Renderer loaded

const { Terminal } = require('@xterm/xterm');
const { FitAddon } = require('@xterm/addon-fit');
const { ipcRenderer } = require('electron');
const path = require('path');
const os = require('os');

// ============================================
// Terminal Tabs Management
// ============================================
const terminals = new Map();
let activeTabId = 0;

// Project management
const openProjectBtn = document.getElementById('open-project-btn');
const newProjectBtn = document.getElementById('new-project-btn');
const projectPathSpan = document.getElementById('project-path');

// New Project Modal
const newProjectModal = document.getElementById('new-project-modal');
const closeModalBtn = document.getElementById('close-modal');
const projectNameInput = document.getElementById('project-name');
const projectLocationInput = document.getElementById('project-location');
const browseLocationBtn = document.getElementById('browse-location');
const cancelProjectBtn = document.getElementById('cancel-project');
const createProjectBtn = document.getElementById('create-project');
const templateOptions = document.querySelectorAll('.template-option');

// Set default location
projectLocationInput.value = os.homedir();

// Template selection
templateOptions.forEach(option => {
  option.addEventListener('click', () => {
    templateOptions.forEach(o => o.classList.remove('selected'));
    option.classList.add('selected');
  });
});

// Open project
openProjectBtn.addEventListener('click', async () => {
  const result = await ipcRenderer.invoke('open-project');
  if (result && result.projectPath) {
    projectPathSpan.textContent = path.basename(result.projectPath);
    projectPathSpan.title = result.projectPath;
  }
});

// New project modal
newProjectBtn.addEventListener('click', () => {
  newProjectModal.classList.remove('hidden');
  projectNameInput.focus();
});

closeModalBtn.addEventListener('click', () => {
  newProjectModal.classList.add('hidden');
});

cancelProjectBtn.addEventListener('click', () => {
  newProjectModal.classList.add('hidden');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !newProjectModal.classList.contains('hidden')) {
    newProjectModal.classList.add('hidden');
  }
});

newProjectModal.addEventListener('click', (e) => {
  if (e.target === newProjectModal) {
    newProjectModal.classList.add('hidden');
  }
});

browseLocationBtn.addEventListener('click', async () => {
  const location = await ipcRenderer.invoke('browse-location');
  if (location) {
    projectLocationInput.value = location;
  }
});

createProjectBtn.addEventListener('click', async () => {
  const name = projectNameInput.value.trim();
  const location = projectLocationInput.value.trim();
  const template = document.querySelector('input[name="template"]:checked').value;

  if (!name) {
    projectNameInput.focus();
    return;
  }

  if (!location) {
    browseLocationBtn.click();
    return;
  }

  createProjectBtn.disabled = true;
  createProjectBtn.textContent = 'Creating...';

  const result = await ipcRenderer.invoke('create-project', { name, template, location });

  if (result.success) {
    newProjectModal.classList.add('hidden');
    projectPathSpan.textContent = name;
    projectPathSpan.title = result.projectPath;
    // Terminal is created via 'terminal-ready' event from main.js
    projectNameInput.value = '';
    // Refresh file tree to show new project files
    setTimeout(loadFiles, 500);
  } else {
    alert(result.error);
  }

  createProjectBtn.disabled = false;
  createProjectBtn.textContent = 'Create Project';
});

// Start Claude button
const startClaudeBtn = document.getElementById('start-claude-btn');
startClaudeBtn.addEventListener('click', async () => {
  const result = await ipcRenderer.invoke('start-claude', { tabId: activeTabId });
  if (!result.success) {
    alert(result.error || 'Failed to start Claude');
  }
});

// Start Expo button
const startExpoBtn = document.getElementById('start-expo-btn');
startExpoBtn.addEventListener('click', async () => {
  const result = await ipcRenderer.invoke('start-expo', { tabId: activeTabId });
  if (!result.success) {
    alert(result.error || 'Failed to start Expo');
  }
});

// Create Convex button
const createConvexBtn = document.getElementById('create-convex-btn');
createConvexBtn.addEventListener('click', async () => {
  const result = await ipcRenderer.invoke('create-convex', { tabId: activeTabId });
  if (!result.success) {
    alert(result.error || 'Failed to create Convex project');
  }
});

// Ralph Modal
const ralphBtn = document.getElementById('ralph-btn');
const ralphModal = document.getElementById('ralph-modal');
const closeRalphModal = document.getElementById('close-ralph-modal');
const cancelRalph = document.getElementById('cancel-ralph');
const startRalphBtn = document.getElementById('start-ralph');
const ralphPrompt = document.getElementById('ralph-prompt');
const ralphRateLimit = document.getElementById('ralph-rate-limit');
const ralphTimeout = document.getElementById('ralph-timeout');
const ralphPromptFile = document.getElementById('ralph-prompt-file');
const ralphMonitorMode = document.getElementById('ralph-monitor-mode');
const ralphAutoAccept = document.getElementById('ralph-auto-accept');
const ralphVerbose = document.getElementById('ralph-verbose');
const ralphStatus = document.getElementById('ralph-status');
const ralphProjectStatus = document.getElementById('ralph-project-status');
const ralphStartOptions = document.getElementById('ralph-start-options');
const ralphImportOptions = document.getElementById('ralph-import-options');
const ralphCommandPreview = document.getElementById('ralph-command-preview');
const ralphPrdFile = document.getElementById('ralph-prd-file');
const browsePrd = document.getElementById('browse-prd');
const ralphTemplate = document.getElementById('ralph-template');
const promptFileStatus = document.getElementById('prompt-file-status');

let selectedRalphCommand = 'start';
let projectHasRalph = false;

// Ralph prompt templates - Expo/React Native focused
const RALPH_TEMPLATES = {
  screen: `# Create New Screen

## Screen Name
[ScreenName] (e.g., ProfileScreen, SettingsScreen)

## Purpose
[What this screen does]

## UI Components Needed
- [ ] Header/Navigation bar
- [ ] Main content area
- [ ] Bottom action buttons
- [ ] Loading state
- [ ] Error state

## Navigation
- Accessible from: [which screens/tabs]
- Can navigate to: [which screens]

## Data Requirements
- Props: [what props it receives]
- State: [local state needed]
- API calls: [endpoints to fetch]

## Design Notes
[Any specific styling, layout, or UX requirements]`,

  component: `# Build UI Component

## Component Name
[ComponentName] (e.g., CustomButton, UserCard, ListItem)

## Purpose
[What this component displays/does]

## Props Interface
\`\`\`typescript
interface Props {
  // Define props here
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}
\`\`\`

## Styling
- Use StyleSheet or NativeWind/Tailwind
- Support dark/light mode
- Responsive sizing

## States to Handle
- Default
- Pressed/Active
- Disabled
- Loading (if applicable)

## Usage Example
[How this component will be used]`,

  api: `# API Integration

## Endpoint(s)
- GET/POST/PUT/DELETE [endpoint URL]

## Purpose
[What data we're fetching/sending]

## Data Structure
\`\`\`typescript
// Expected response/request type
interface ApiResponse {
  // Define structure
}
\`\`\`

## Implementation
- [ ] Create API service function
- [ ] Add TypeScript types
- [ ] Handle loading state
- [ ] Handle error state
- [ ] Cache/store response (if needed)

## Where to Use
- Screen: [which screen calls this]
- Trigger: [button press, on mount, etc.]`,

  auth: `# Authentication Flow

## Auth Type
[Email/Password, OAuth, Phone, etc.]

## Screens Needed
- [ ] Login screen
- [ ] Register screen (if needed)
- [ ] Forgot password (if needed)

## Implementation
- [ ] Auth context/provider
- [ ] Secure token storage (expo-secure-store)
- [ ] Protected routes
- [ ] Auto-login on app start
- [ ] Logout functionality

## API Endpoints
- Login: POST /auth/login
- Register: POST /auth/register
- Refresh: POST /auth/refresh

## User State
\`\`\`typescript
interface User {
  id: string;
  email: string;
  // other fields
}
\`\`\``,

  fix: `# Fix Issue

## Problem Description
[Describe what's broken or not working]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [See error/wrong behavior]

## Expected Behavior
[What should happen]

## Current Behavior
[What actually happens]

## Affected Files (if known)
- [file1.tsx]
- [file2.ts]

## Error Messages (if any)
\`\`\`
[Paste error message here]
\`\`\`

## Environment
- Expo SDK: [version]
- Platform: iOS / Android / Both
- Device: Simulator / Physical`,

  navigation: `# Setup Navigation

## Navigation Type
- [ ] Stack Navigator
- [ ] Tab Navigator (bottom tabs)
- [ ] Drawer Navigator
- [ ] Combination

## Screens to Include
1. [Screen1] - [description]
2. [Screen2] - [description]
3. [Screen3] - [description]

## Tab Bar (if using tabs)
- Tab 1: [icon] [label] → [Screen]
- Tab 2: [icon] [label] → [Screen]
- Tab 3: [icon] [label] → [Screen]

## Deep Linking (optional)
- /home → HomeScreen
- /profile/:id → ProfileScreen

## Auth Flow
- Unauthenticated: [which screens]
- Authenticated: [which screens]`
};

// Update command preview
function updateRalphCommandPreview() {
  let cmd = '';

  switch (selectedRalphCommand) {
    case 'start':
      cmd = 'ralph';
      if (ralphMonitorMode.checked) cmd += ' --monitor';
      if (ralphVerbose.checked) cmd += ' --verbose';
      if (ralphRateLimit.value !== '100') cmd += ` --calls ${ralphRateLimit.value}`;
      if (ralphTimeout.value !== '15') cmd += ` --timeout ${ralphTimeout.value}`;
      if (ralphPromptFile.value !== 'PROMPT.md') cmd += ` --prompt ${ralphPromptFile.value}`;
      break;
    case 'init':
      cmd = '# Creates PROMPT.md, @AGENT.md in current project';
      break;
    case 'import':
      cmd = 'ralph-import ' + (ralphPrdFile.value || '<prd-file>') + ' .';
      break;
    case 'status':
      cmd = 'ralph --status';
      break;
    case 'monitor':
      cmd = 'ralph-monitor';
      break;
  }

  ralphCommandPreview.textContent = cmd;
}

// Command selection
document.querySelectorAll('input[name="ralph-command"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    selectedRalphCommand = e.target.value;

    // Update selected style
    document.querySelectorAll('.ralph-pill').forEach(el => el.classList.remove('selected'));
    e.target.closest('.ralph-pill').classList.add('selected');

    // Show/hide relevant options
    ralphStartOptions.classList.toggle('hidden', selectedRalphCommand !== 'start');
    ralphImportOptions.classList.toggle('hidden', selectedRalphCommand !== 'import');

    updateRalphCommandPreview();
  });
});

// Update preview on option changes
[ralphRateLimit, ralphTimeout, ralphPromptFile, ralphPrdFile].forEach(el => {
  el?.addEventListener('input', updateRalphCommandPreview);
});
[ralphMonitorMode, ralphVerbose, ralphAutoAccept].forEach(el => {
  el?.addEventListener('change', updateRalphCommandPreview);
});

// Browse PRD file
browsePrd?.addEventListener('click', async () => {
  const result = await ipcRenderer.invoke('select-file', {
    filters: [{ name: 'Markdown', extensions: ['md', 'txt'] }]
  });
  if (result) {
    ralphPrdFile.value = result;
    updateRalphCommandPreview();
  }
});

// Template selection handler
ralphTemplate.addEventListener('change', () => {
  const template = RALPH_TEMPLATES[ralphTemplate.value];
  if (template) {
    ralphPrompt.value = template;
    promptFileStatus.textContent = 'Template loaded';
    promptFileStatus.className = 'prompt-status new';
  }
  ralphTemplate.value = ''; // Reset dropdown
});

// Open Ralph modal and check installation + project status
ralphBtn.addEventListener('click', async () => {
  ralphModal.classList.remove('hidden');
  ralphStatus.className = 'ralph-status checking';
  ralphStatus.textContent = 'Checking...';
  ralphProjectStatus.className = 'ralph-status-badge';
  ralphProjectStatus.textContent = '';
  promptFileStatus.textContent = '';
  promptFileStatus.className = 'prompt-status';
  updateRalphCommandPreview();

  // Check Ralph CLI installation
  const result = await ipcRenderer.invoke('check-ralph-installed');
  if (result.installed) {
    ralphStatus.className = 'ralph-status';
    ralphStatus.textContent = ''; // Hide when installed - project badge shows status
    startRalphBtn.disabled = false;
  } else {
    ralphStatus.className = 'ralph-status not-installed';
    ralphStatus.innerHTML = 'CLI not found. <a href="#" id="install-ralph-link">Install</a>';
    startRalphBtn.disabled = true;

    document.getElementById('install-ralph-link')?.addEventListener('click', async (e) => {
      e.preventDefault();
      ralphStatus.textContent = 'Installing...';
      const installResult = await ipcRenderer.invoke('install-ralph');
      if (installResult.success) {
        ralphStatus.textContent = '';
        startRalphBtn.disabled = false;
      } else {
        ralphStatus.textContent = 'Failed: ' + installResult.error;
      }
    });
  }

  // Check if current project has Ralph files
  const projectResult = await ipcRenderer.invoke('check-ralph-project');
  projectHasRalph = projectResult.hasRalph;

  if (!projectResult.hasProject) {
    ralphProjectStatus.className = 'ralph-status-badge';
    ralphProjectStatus.textContent = 'No Project';
    startRalphBtn.disabled = true;
    ralphPrompt.value = '';
  } else if (projectResult.hasRalph) {
    ralphProjectStatus.className = 'ralph-status-badge ready';
    ralphProjectStatus.textContent = '✓ Ready';

    // Load PROMPT.md content
    const promptContent = await ipcRenderer.invoke('read-prompt-file');
    if (promptContent) {
      ralphPrompt.value = promptContent;
      promptFileStatus.textContent = 'loaded';
      promptFileStatus.className = 'prompt-status loaded';
    }
  } else {
    ralphProjectStatus.className = 'ralph-status-badge needs-init';
    ralphProjectStatus.textContent = 'Init Required';
    ralphPrompt.value = '';
  }
});

// Close modal handlers
closeRalphModal.addEventListener('click', () => ralphModal.classList.add('hidden'));
cancelRalph.addEventListener('click', () => ralphModal.classList.add('hidden'));
ralphModal.addEventListener('click', (e) => {
  if (e.target === ralphModal) ralphModal.classList.add('hidden');
});

// Collect selected skills
function getSelectedSkills() {
  const skills = [];
  document.querySelectorAll('.skill-checkbox:checked').forEach(cb => {
    const skillName = cb.id.replace('skill-', '');
    skills.push(skillName);
  });
  return skills;
}

// Add listeners to skill checkboxes (visual feedback is handled by CSS)
document.querySelectorAll('.skill-checkbox').forEach(cb => {
  cb.addEventListener('change', () => {
    // Pills update visually via CSS, no extra logic needed
  });
});

// Run Ralph command
startRalphBtn.addEventListener('click', async () => {
  const selectedSkills = getSelectedSkills();

  const options = {
    command: selectedRalphCommand,
    prompt: ralphPrompt.value.trim(),
    rateLimit: parseInt(ralphRateLimit.value) || 100,
    timeout: parseInt(ralphTimeout.value) || 15,
    promptFile: ralphPromptFile.value || 'PROMPT.md',
    monitorMode: ralphMonitorMode.checked,
    autoAccept: ralphAutoAccept.checked,
    verbose: ralphVerbose.checked,
    prdFile: ralphPrdFile?.value || '',
    skills: selectedSkills,
    tabId: activeTabId
  };

  // Validation
  if (selectedRalphCommand === 'start' && !options.prompt) {
    alert('Please enter a prompt/task description');
    return;
  }
  if (selectedRalphCommand === 'import' && !options.prdFile) {
    alert('Please select a PRD file to import');
    return;
  }

  ralphModal.classList.add('hidden');

  const result = await ipcRenderer.invoke('run-ralph', options);
  if (!result.success) {
    alert(result.error || 'Failed to run Ralph command');
  } else if (selectedRalphCommand === 'init') {
    // Refresh file browser to show new PROMPT.md and @AGENT.md
    setTimeout(() => refreshFiles(), 500);
  }
});

// Send Skills directly to Claude (without Ralph)
const sendSkillsClaudeBtn = document.getElementById('send-skills-claude');
sendSkillsClaudeBtn.addEventListener('click', async () => {
  const selectedSkills = getSelectedSkills();

  if (selectedSkills.length === 0) {
    alert('Please select at least one skill to send to Claude');
    return;
  }

  // Build the skill instruction message
  let message = '\n# Expo/React Native Skills Reference\n\n';
  message += 'Before proceeding with my next request, please read and follow the best practices from these skill files:\n\n';
  selectedSkills.forEach(skill => {
    message += `- Read \`skills/${skill}.md\` for ${skill} patterns\n`;
  });
  message += '\nFollow the patterns and AVOID the anti-patterns described. Let me know when you\'ve reviewed them.\n';

  // Send to terminal
  const result = await ipcRenderer.invoke('send-to-terminal', {
    tabId: activeTabId,
    text: message
  });

  if (result.success) {
    ralphModal.classList.add('hidden');
  } else {
    alert(result.error || 'Failed to send to Claude');
  }
});

// ============================================
// Expo Web Preview (Webview)
// ============================================
const webview = document.getElementById('expo-webview');
const webviewWelcome = document.getElementById('webview-welcome');
const urlInput = document.getElementById('url-input');
const refreshBtn = document.getElementById('refresh-btn');
const devtoolsBtn = document.getElementById('devtools-btn');
const connectionStatus = document.getElementById('connection-status');
const inspectorToggle = document.getElementById('inspector-toggle');
const inspectorOverlay = document.getElementById('inspector-overlay');
const inspectorTooltip = document.getElementById('inspector-tooltip');
const elementPanel = document.getElementById('element-panel');
const elementPanelContent = document.getElementById('element-panel-content');
const closeElementPanel = document.getElementById('close-element-panel');
const copyElementInfo = document.getElementById('copy-element-info');
const sendElementToClaude = document.getElementById('send-element-to-claude');

let currentUrl = 'http://localhost:8081';
let isInspectorActive = false;
let selectedElementInfo = null;

// Navigate to URL
function navigateToUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'http://' + url;
  }
  currentUrl = url;
  urlInput.value = url;
  webview.src = url;
  webviewWelcome.classList.add('hidden');
  webview.classList.remove('hidden');
}

// URL input handlers
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    navigateToUrl(urlInput.value);
  }
});

refreshBtn.addEventListener('click', () => {
  if (webview.src && webview.src !== 'about:blank') {
    webview.reload();
  } else {
    navigateToUrl(urlInput.value);
  }
});

devtoolsBtn.addEventListener('click', () => {
  if (webview.isDevToolsOpened()) {
    webview.closeDevTools();
  } else {
    webview.openDevTools();
  }
});

// Webview events
webview.addEventListener('did-start-loading', () => {
  connectionStatus.textContent = 'Loading...';
  connectionStatus.className = 'connection-status';
});

webview.addEventListener('did-finish-load', () => {
  connectionStatus.textContent = 'Connected';
  connectionStatus.className = 'connection-status connected';

  // Inject the inspector script into the webview
  injectInspectorScript();
});

webview.addEventListener('did-fail-load', (e) => {
  if (e.errorCode !== -3) { // Ignore aborted loads
    connectionStatus.textContent = 'Disconnected';
    connectionStatus.className = 'connection-status disconnected';
  }
});

webview.addEventListener('dom-ready', () => {
  // Webview is ready
  console.log('Webview DOM ready');
});

// Listen for navigation events from main process
ipcRenderer.on('navigate-browser', (event, url) => {
  navigateToUrl(url);
});

ipcRenderer.on('refresh-browser', () => {
  webview.reload();
});

ipcRenderer.on('take-screenshot', async () => {
  try {
    if (webview && !webview.classList.contains('hidden')) {
      const image = await webview.capturePage();
      const base64 = image.toDataURL().replace(/^data:image\/png;base64,/, '');
      ipcRenderer.send('screenshot-data', base64);
    } else {
      ipcRenderer.send('screenshot-data', null);
    }
  } catch (err) {
    console.error('Screenshot error:', err);
    ipcRenderer.send('screenshot-data', null);
  }
});

ipcRenderer.on('trigger-hot-reload', () => {
  if (webview && !webview.classList.contains('hidden')) {
    // Try Expo hot reload endpoint, fallback to page reload
    webview.executeJavaScript(`
      if (window.__EXPO_DEV_SERVER_ORIGIN__) {
        fetch(window.__EXPO_DEV_SERVER_ORIGIN__ + '/_expo/reload');
      } else {
        location.reload();
      }
    `).catch(() => webview.reload());
  }
});

ipcRenderer.on('set-viewport', (event, viewport) => {
  if (webview) {
    webview.style.width = viewport.width + 'px';
    webview.style.height = viewport.height + 'px';
  }
});

// ============================================
// Chrome-style Element Inspector
// ============================================

// Inject inspector script into webview
function injectInspectorScript() {
  const inspectorScript = `
    (function() {
      if (window.__expoGrabInspector) return;
      window.__expoGrabInspector = true;

      let highlightEl = null;
      let tooltipEl = null;
      let isActive = false;
      let selectedElement = null;

      // Create highlight overlay
      function createHighlight() {
        if (highlightEl) return;
        highlightEl = document.createElement('div');
        highlightEl.id = '__expo-grab-highlight';
        highlightEl.style.cssText = \`
          position: fixed;
          pointer-events: none;
          z-index: 2147483647;
          border: 2px solid #d946ef;
          background: rgba(217, 70, 239, 0.1);
          transition: all 0.05s ease-out;
          display: none;
        \`;
        document.body.appendChild(highlightEl);

        tooltipEl = document.createElement('div');
        tooltipEl.id = '__expo-grab-tooltip';
        tooltipEl.style.cssText = \`
          position: fixed;
          z-index: 2147483647;
          background: #1a1a1a;
          border: 1px solid #3a3a3a;
          border-radius: 4px;
          padding: 4px 8px;
          font-family: monospace;
          font-size: 11px;
          color: #e5e5e5;
          white-space: nowrap;
          pointer-events: none;
          display: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        \`;
        document.body.appendChild(tooltipEl);
      }

      // Generate unique CSS selector like Chrome DevTools
      function getUniqueSelector(el) {
        if (!el || el === document.body) return 'body';
        if (el === document.documentElement) return 'html';

        // If element has ID, use it (most specific)
        if (el.id) {
          return '#' + CSS.escape(el.id);
        }

        const path = [];
        let current = el;

        while (current && current !== document.body && current !== document.documentElement) {
          let selector = current.tagName.toLowerCase();

          // Add classes if available (filter out React/framework noise)
          if (current.className && typeof current.className === 'string') {
            const classes = current.className.trim().split(/\\s+/)
              .filter(c => c && !c.startsWith('css-') && !c.startsWith('_') && c.length < 30)
              .slice(0, 2);
            if (classes.length > 0) {
              selector += '.' + classes.map(c => CSS.escape(c)).join('.');
            }
          }

          // Check if selector is unique among siblings
          const parent = current.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children);
            const sameTagSiblings = siblings.filter(s => s.tagName === current.tagName);
            if (sameTagSiblings.length > 1) {
              const index = sameTagSiblings.indexOf(current) + 1;
              selector += ':nth-of-type(' + index + ')';
            }
          }

          path.unshift(selector);

          // Check if current path is unique
          const testSelector = path.join(' > ');
          try {
            if (document.querySelectorAll(testSelector).length === 1) {
              return testSelector;
            }
          } catch (e) {}

          current = current.parentElement;
        }

        return path.join(' > ');
      }

      function getElementInfo(el) {
        if (!el || el === document.body || el === document.documentElement) return null;

        const rect = el.getBoundingClientRect();
        const tagName = el.tagName.toLowerCase();

        // Get computed styles
        const styles = window.getComputedStyle(el);

        // Try to get React component name
        let componentName = tagName;
        let reactProps = {};
        const reactKey = Object.keys(el).find(key => key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance'));
        if (reactKey) {
          let fiber = el[reactKey];
          while (fiber) {
            if (fiber.type && typeof fiber.type === 'function') {
              componentName = fiber.type.displayName || fiber.type.name || componentName;
              // Try to get props
              if (fiber.memoizedProps) {
                const props = fiber.memoizedProps;
                ['testID', 'accessibilityLabel', 'role', 'aria-label', 'data-testid'].forEach(key => {
                  if (props[key]) reactProps[key] = props[key];
                });
              }
              break;
            }
            if (fiber.type && typeof fiber.type === 'string') {
              componentName = fiber.type;
            }
            fiber = fiber.return;
          }
        }

        // Generate unique selector
        const uniqueSelector = getUniqueSelector(el);

        // Simple selector for display
        let simpleSelector = tagName;
        if (el.id) simpleSelector += '#' + el.id;
        else if (el.className && typeof el.className === 'string') {
          const classes = el.className.trim().split(/\\s+/).filter(c => c && !c.startsWith('css-')).slice(0, 2);
          if (classes.length) simpleSelector += '.' + classes.join('.');
        }

        return {
          tagName,
          componentName,
          id: el.id || '',
          className: el.className || '',
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
          },
          text: el.innerText ? el.innerText.substring(0, 100) : '',
          selector: simpleSelector,
          uniqueSelector: uniqueSelector,
          reactProps: reactProps,
          attributes: Array.from(el.attributes || []).reduce((acc, attr) => {
            if (!attr.name.startsWith('__') && attr.name !== 'style') {
              acc[attr.name] = attr.value;
            }
            return acc;
          }, {}),
          computedStyle: {
            display: styles.display,
            position: styles.position,
            width: styles.width,
            height: styles.height,
            padding: styles.padding,
            margin: styles.margin,
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            fontSize: styles.fontSize,
            flexDirection: styles.flexDirection,
            justifyContent: styles.justifyContent,
            alignItems: styles.alignItems
          }
        };
      }

      function updateHighlight(el) {
        if (!el || !highlightEl) return;

        const rect = el.getBoundingClientRect();
        highlightEl.style.display = 'block';
        highlightEl.style.left = rect.left + 'px';
        highlightEl.style.top = rect.top + 'px';
        highlightEl.style.width = rect.width + 'px';
        highlightEl.style.height = rect.height + 'px';

        // Update tooltip
        const info = getElementInfo(el);
        if (info && tooltipEl) {
          let html = '<span style="color:#e879f9">' + info.componentName + '</span>';
          if (info.id) html += '<span style="color:#f97316">#' + info.id + '</span>';
          if (info.className && typeof info.className === 'string') {
            const classes = info.className.trim().split(/\\s+/).slice(0, 2).join('.');
            if (classes) html += '<span style="color:#60a5fa">.' + classes + '</span>';
          }
          html += '<span style="color:#888;margin-left:8px">' + Math.round(info.rect.width) + ' × ' + Math.round(info.rect.height) + '</span>';

          tooltipEl.innerHTML = html;
          tooltipEl.style.display = 'block';

          // Position tooltip above or below element
          let tooltipTop = rect.top - tooltipEl.offsetHeight - 8;
          if (tooltipTop < 0) {
            tooltipTop = rect.bottom + 8;
          }
          let tooltipLeft = rect.left;
          if (tooltipLeft + tooltipEl.offsetWidth > window.innerWidth) {
            tooltipLeft = window.innerWidth - tooltipEl.offsetWidth - 8;
          }

          tooltipEl.style.left = Math.max(0, tooltipLeft) + 'px';
          tooltipEl.style.top = Math.max(0, tooltipTop) + 'px';
        }
      }

      function hideHighlight() {
        if (highlightEl) highlightEl.style.display = 'none';
        if (tooltipEl) tooltipEl.style.display = 'none';
      }

      function handleMouseMove(e) {
        if (!isActive) return;
        e.stopPropagation();

        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (el && el.id !== '__expo-grab-highlight' && el.id !== '__expo-grab-tooltip') {
          updateHighlight(el);
        }
      }

      function handleClick(e) {
        if (!isActive) return;

        // Block all click behavior aggressively
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (el && el.id !== '__expo-grab-highlight' && el.id !== '__expo-grab-tooltip') {
          selectedElement = el;
          const info = getElementInfo(el);

          // Store for polling
          window.__expoGrabSelectedElement = info;

          // Send to parent
          window.postMessage({ type: 'expo-grab-element-selected', element: info }, '*');
        }

        return false;
      }

      // Block all click-related events when inspector is active
      function blockEvent(e) {
        if (!isActive) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }

      // Listen for activation messages
      window.addEventListener('message', (e) => {
        if (e.data.type === 'expo-grab-inspector-activate') {
          isActive = true;
          createHighlight();
          document.body.style.cursor = 'crosshair';
        } else if (e.data.type === 'expo-grab-inspector-deactivate') {
          isActive = false;
          hideHighlight();
          document.body.style.cursor = '';
        }
      });

      // Capture phase listeners to intercept before React/framework handlers
      document.addEventListener('mousemove', handleMouseMove, true);
      document.addEventListener('click', handleClick, true);
      document.addEventListener('mousedown', blockEvent, true);
      document.addEventListener('mouseup', blockEvent, true);
      document.addEventListener('pointerdown', blockEvent, true);
      document.addEventListener('pointerup', blockEvent, true);
      document.addEventListener('touchstart', blockEvent, true);
      document.addEventListener('touchend', blockEvent, true);

      console.log('[Expo Grab] Inspector script injected');
    })();
  `;

  webview.executeJavaScript(inspectorScript).catch(err => {
    console.log('Failed to inject inspector script:', err.message);
  });
}

// Toggle inspector mode
function toggleInspector() {
  isInspectorActive = !isInspectorActive;
  inspectorToggle.classList.toggle('active', isInspectorActive);

  if (isInspectorActive) {
    elementPanel.classList.remove('hidden');
    elementPanelContent.innerHTML = '<div class="element-placeholder">Hover over elements and click to select</div>';
    webview.executeJavaScript(`window.postMessage({ type: 'expo-grab-inspector-activate' }, '*')`);
  } else {
    webview.executeJavaScript(`window.postMessage({ type: 'expo-grab-inspector-deactivate' }, '*')`);
  }
}

inspectorToggle.addEventListener('click', toggleInspector);

// Close element panel
closeElementPanel.addEventListener('click', () => {
  elementPanel.classList.add('hidden');
  if (isInspectorActive) {
    toggleInspector();
  }
});

// Listen for element selection from webview
webview.addEventListener('ipc-message', (event) => {
  if (event.channel === 'element-selected') {
    handleElementSelected(event.args[0]);
  }
});

// ============================================
// Console Panel
// ============================================

const consolePanel = document.getElementById('console-panel');
const consoleContent = document.getElementById('console-content');
const consoleCount = document.getElementById('console-count');
const toggleConsoleBtn = document.getElementById('toggle-console');
const clearConsoleBtn = document.getElementById('clear-console');
const consoleHeader = document.getElementById('console-header');

let consoleLogs = [];
let errorCount = 0;
let warnCount = 0;

function addConsoleEntry(level, message, timestamp) {
  // Remove empty placeholder
  const empty = consoleContent.querySelector('.console-empty');
  if (empty) empty.remove();

  // Create entry
  const entry = document.createElement('div');
  entry.className = `console-entry ${level}`;

  const time = new Date(timestamp);
  const timeStr = time.toLocaleTimeString('en-US', { hour12: false });

  entry.innerHTML = `
    <span class="console-time">${timeStr}</span>
    <span class="console-level">${level}</span>
    <span class="console-message">${escapeHtml(message)}</span>
  `;

  consoleContent.appendChild(entry);

  // Auto-scroll to bottom
  consoleContent.scrollTop = consoleContent.scrollHeight;

  // Update counts
  consoleLogs.push({ level, message, timestamp });
  if (level === 'error') errorCount++;
  if (level === 'warn') warnCount++;
  updateConsoleCount();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateConsoleCount() {
  consoleCount.textContent = consoleLogs.length;
  consoleCount.classList.remove('has-errors', 'has-warnings');
  if (errorCount > 0) {
    consoleCount.classList.add('has-errors');
  } else if (warnCount > 0) {
    consoleCount.classList.add('has-warnings');
  }
}

function clearConsole() {
  consoleLogs = [];
  errorCount = 0;
  warnCount = 0;
  consoleContent.innerHTML = '<div class="console-empty">No console logs yet</div>';
  updateConsoleCount();
}

function toggleConsole() {
  consolePanel.classList.toggle('collapsed');
}

// Event listeners
consoleHeader.addEventListener('click', toggleConsole);
clearConsoleBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  clearConsole();
});
toggleConsoleBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleConsole();
});

// Start collapsed
consolePanel.classList.add('collapsed');

// Listen for console messages and display in UI + forward to main process
webview.addEventListener('console-message', (e) => {
  // Filter out Electron security warnings (not relevant to user's app)
  if (e.message.includes('Electron Security Warning') ||
      e.message.includes('Content-Security-Policy') ||
      e.message.includes('%c') || // Filter console styling markers
      e.message.startsWith('DevTools')) {
    return;
  }

  // Map Electron console levels to names: 0=verbose, 1=info, 2=warning, 3=error
  const levelMap = { 0: 'log', 1: 'info', 2: 'warn', 3: 'error' };
  const level = levelMap[e.level] || 'log';
  const timestamp = new Date().toISOString();

  // Add to UI
  addConsoleEntry(level, e.message, timestamp);

  // Forward to main process for MCP
  ipcRenderer.send('console-log', { level, message: e.message, timestamp });
});

// Handle postMessage from webview
webview.addEventListener('dom-ready', () => {
  // Set up message listener via executeJavaScript
  webview.executeJavaScript(`
    window.addEventListener('message', (e) => {
      if (e.data.type === 'expo-grab-element-selected') {
        // Use IPC to send back to renderer
        const { ipcRenderer } = require('electron');
        if (ipcRenderer) {
          ipcRenderer.sendToHost('element-selected', e.data.element);
        }
      }
    });
  `).catch(() => {
    // Webview might not have node integration, use alternative method
  });
});

// Poll for element selection (fallback)
let pollInterval = null;
function startPolling() {
  if (pollInterval) return;
  pollInterval = setInterval(async () => {
    if (!isInspectorActive) return;
    try {
      const result = await webview.executeJavaScript(`
        window.__expoGrabSelectedElement ? JSON.stringify(window.__expoGrabSelectedElement) : null
      `);
      if (result) {
        const element = JSON.parse(result);
        handleElementSelected(element);
        await webview.executeJavaScript('window.__expoGrabSelectedElement = null');
      }
    } catch (e) {}
  }, 100);
}

function handleElementSelected(elementInfo) {
  if (!elementInfo) return;

  selectedElementInfo = elementInfo;
  displayElementInfo(elementInfo);
}

function displayElementInfo(element) {
  let html = '';

  // Component/Tag name
  html += `<div class="element-type">&lt;${element.componentName || element.tagName}&gt;</div>`;

  // Unique Selector (copyable) - prominent display
  if (element.uniqueSelector) {
    html += `<div class="selector-box">
      <div class="selector-label">CSS Selector</div>
      <div class="selector-value" id="unique-selector-value">${escapeHtml(element.uniqueSelector)}</div>
      <button class="copy-selector-btn" id="copy-selector-btn" title="Copy selector">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
      </button>
    </div>`;
  }

  // ID
  if (element.id) {
    html += `<div class="element-prop">id: <span class="element-prop-value">"${escapeHtml(element.id)}"</span></div>`;
  }

  // Classes
  if (element.className) {
    const classStr = typeof element.className === 'string' ? element.className : '';
    html += `<div class="element-prop">class: <span class="element-prop-value">"${escapeHtml(classStr.substring(0, 80))}${classStr.length > 80 ? '...' : ''}"</span></div>`;
  }

  // Text content
  if (element.text) {
    const text = element.text.replace(/\s+/g, ' ').trim().substring(0, 50);
    if (text) {
      html += `<div class="element-prop">text: <span class="element-prop-value">"${escapeHtml(text)}${element.text.length > 50 ? '...' : ''}"</span></div>`;
    }
  }

  // Dimensions
  if (element.rect) {
    html += `<div class="element-bounds">${Math.round(element.rect.width)} × ${Math.round(element.rect.height)} at (${Math.round(element.rect.x)}, ${Math.round(element.rect.y)})</div>`;
  }

  // React Props (if any)
  if (element.reactProps && Object.keys(element.reactProps).length > 0) {
    html += '<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">';
    html += '<div style="color: var(--text-secondary); font-size: 10px; margin-bottom: 8px;">REACT PROPS</div>';
    for (const [key, value] of Object.entries(element.reactProps)) {
      html += `<div class="element-prop">${key}: <span class="element-prop-value">"${escapeHtml(String(value))}"</span></div>`;
    }
    html += '</div>';
  }

  // Computed styles
  if (element.computedStyle) {
    html += '<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">';
    html += '<div style="color: var(--text-secondary); font-size: 10px; margin-bottom: 8px;">COMPUTED STYLES</div>';
    const styles = element.computedStyle;
    if (styles.display) html += `<div class="element-prop">display: <span class="element-prop-value">${styles.display}</span></div>`;
    if (styles.position && styles.position !== 'static') html += `<div class="element-prop">position: <span class="element-prop-value">${styles.position}</span></div>`;
    if (styles.flexDirection) html += `<div class="element-prop">flex-direction: <span class="element-prop-value">${styles.flexDirection}</span></div>`;
    if (styles.justifyContent && styles.justifyContent !== 'normal') html += `<div class="element-prop">justify-content: <span class="element-prop-value">${styles.justifyContent}</span></div>`;
    if (styles.alignItems && styles.alignItems !== 'normal') html += `<div class="element-prop">align-items: <span class="element-prop-value">${styles.alignItems}</span></div>`;
    if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') html += `<div class="element-prop">background: <span class="element-prop-value">${styles.backgroundColor}</span></div>`;
    if (styles.color) html += `<div class="element-prop">color: <span class="element-prop-value">${styles.color}</span></div>`;
    if (styles.fontSize) html += `<div class="element-prop">font-size: <span class="element-prop-value">${styles.fontSize}</span></div>`;
    html += '</div>';
  }

  elementPanelContent.innerHTML = html;

  // Add click handler for copy selector button
  const copySelectorBtn = document.getElementById('copy-selector-btn');
  if (copySelectorBtn) {
    copySelectorBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(element.uniqueSelector);
      copySelectorBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
      setTimeout(() => {
        copySelectorBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
      }, 1500);
    });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Copy element info
copyElementInfo.addEventListener('click', () => {
  if (!selectedElementInfo) return;
  const text = formatElementInfoForCopy(selectedElementInfo);
  navigator.clipboard.writeText(text);

  // Visual feedback
  const originalText = copyElementInfo.textContent;
  copyElementInfo.textContent = 'Copied!';
  setTimeout(() => {
    copyElementInfo.textContent = originalText;
  }, 1500);
});

// Send to Claude (uses active terminal tab)
sendElementToClaude.addEventListener('click', () => {
  if (!selectedElementInfo) return;

  const elementContext = {
    componentName: selectedElementInfo.componentName || selectedElementInfo.tagName,
    id: selectedElementInfo.id,
    className: typeof selectedElementInfo.className === 'string' ? selectedElementInfo.className : '',
    selector: selectedElementInfo.uniqueSelector || selectedElementInfo.selector,
    text: selectedElementInfo.text ? selectedElementInfo.text.replace(/\s+/g, ' ').trim().substring(0, 50) : '',
    reactProps: selectedElementInfo.reactProps,
    dimensions: selectedElementInfo.rect ? {
      width: Math.round(selectedElementInfo.rect.width),
      height: Math.round(selectedElementInfo.rect.height)
    } : null
  };

  // Send to currently active terminal tab
  ipcRenderer.send('send-element-to-claude', { tabId: activeTabId, elementInfo: elementContext });

  // Visual feedback
  const originalText = sendElementToClaude.textContent;
  sendElementToClaude.textContent = 'Sent!';
  setTimeout(() => {
    sendElementToClaude.textContent = originalText;
  }, 1500);

  // Close inspector
  if (isInspectorActive) {
    toggleInspector();
  }
  elementPanel.classList.add('hidden');
});

function formatElementInfoForCopy(element) {
  const lines = [];
  lines.push(`Element: <${element.componentName || element.tagName}>`);
  if (element.uniqueSelector) lines.push(`Selector: ${element.uniqueSelector}`);
  if (element.id) lines.push(`ID: #${element.id}`);
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.trim().split(/\s+/).filter(c => c && !c.startsWith('css-')).slice(0, 5);
    if (classes.length) lines.push(`Classes: .${classes.join(' .')}`);
  }
  if (element.text) {
    const text = element.text.replace(/\s+/g, ' ').trim().substring(0, 80);
    if (text) lines.push(`Text: "${text}"`);
  }
  if (element.rect) {
    lines.push(`Size: ${Math.round(element.rect.width)} × ${Math.round(element.rect.height)}`);
  }
  if (element.reactProps && Object.keys(element.reactProps).length > 0) {
    lines.push(`React Props: ${JSON.stringify(element.reactProps)}`);
  }
  return lines.join('\n');
}

// Keyboard shortcut for inspector (Cmd+Shift+C)
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'c') {
    e.preventDefault();
    if (webview.src && webview.src !== 'about:blank') {
      toggleInspector();
    }
  }
});

// ============================================
// Terminal Management
// ============================================

const terminalTheme = {
  background: '#0a0a0a',
  foreground: '#e5e5e5',
  cursor: '#d946ef',
  cursorAccent: '#0a0a0a',
  selectionBackground: 'rgba(217, 70, 239, 0.3)',
  black: '#1a1a1a',
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#eab308',
  blue: '#3b82f6',
  magenta: '#d946ef',
  cyan: '#06b6d4',
  white: '#e5e5e5',
  brightBlack: '#525252',
  brightRed: '#f87171',
  brightGreen: '#4ade80',
  brightYellow: '#facc15',
  brightBlue: '#60a5fa',
  brightMagenta: '#e879f9',
  brightCyan: '#22d3ee',
  brightWhite: '#ffffff',
};

function createTerminalTab(tabId, name, isActive = false) {
  const terminal = new Terminal({
    theme: terminalTheme,
    fontSize: 13,
    fontFamily: "'SF Mono', Monaco, 'Cascadia Code', 'Fira Code', monospace",
    cursorBlink: true,
    cursorStyle: 'bar',
    scrollback: 10000,
  });

  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);

  const container = document.createElement('div');
  container.className = 'terminal-instance' + (isActive ? ' active' : '');
  container.dataset.tabId = tabId;
  document.getElementById('terminals-wrapper').appendChild(container);

  terminal.open(container);
  fitAddon.fit();

  terminal.onData((data) => {
    ipcRenderer.send('terminal-input', { tabId, data });
  });

  terminals.set(tabId, { terminal, fitAddon, container, name });

  const tabsContainer = document.getElementById('terminal-tabs');
  const newTabBtn = document.getElementById('new-tab-btn');

  const tab = document.createElement('div');
  tab.className = 'terminal-tab' + (isActive ? ' active' : '');
  tab.dataset.tabId = tabId;
  tab.innerHTML = `
    <span class="tab-title">${name}</span>
    <button class="tab-close" title="Close tab">×</button>
  `;

  tabsContainer.insertBefore(tab, newTabBtn);

  tab.addEventListener('click', (e) => {
    if (!e.target.classList.contains('tab-close')) {
      switchToTab(tabId);
    }
  });

  tab.querySelector('.tab-close').addEventListener('click', (e) => {
    e.stopPropagation();
    closeTab(tabId);
  });

  if (isActive) {
    activeTabId = tabId;
    setTimeout(() => terminal.focus(), 100);
  }

  return { terminal, fitAddon, container };
}

function switchToTab(tabId) {
  document.querySelectorAll('.terminal-tab').forEach(t => {
    t.classList.toggle('active', parseInt(t.dataset.tabId) === tabId);
  });

  terminals.forEach((t, id) => {
    t.container.classList.toggle('active', id === tabId);
  });

  activeTabId = tabId;

  const activeTerminal = terminals.get(tabId);
  if (activeTerminal) {
    setTimeout(() => {
      activeTerminal.fitAddon.fit();
      activeTerminal.terminal.focus();
    }, 0);
  }
}

async function closeTab(tabId) {
  if (terminals.size <= 1) return;

  await ipcRenderer.invoke('close-terminal-tab', tabId);

  const tab = document.querySelector(`.terminal-tab[data-tab-id="${tabId}"]`);
  if (tab) tab.remove();

  const termData = terminals.get(tabId);
  if (termData) {
    termData.terminal.dispose();
    termData.container.remove();
    terminals.delete(tabId);
  }

  if (activeTabId === tabId) {
    const firstTab = terminals.keys().next().value;
    if (firstTab !== undefined) {
      switchToTab(firstTab);
    }
  }
}

function clearAllTabs() {
  terminals.forEach((t) => {
    t.terminal.dispose();
    t.container.remove();
  });
  terminals.clear();
  document.querySelectorAll('.terminal-tab').forEach(t => t.remove());
}

// Terminal IPC handlers
ipcRenderer.on('terminal-data', (event, { tabId, data }) => {
  const termData = terminals.get(tabId);
  if (termData) {
    termData.terminal.write(data);
  }
});

ipcRenderer.on('terminal-ready', (event, { tabId, name }) => {
  clearAllTabs();
  createTerminalTab(tabId, name, true);
});

ipcRenderer.on('terminal-closed', (event, tabId) => {
  closeTab(tabId);
});

document.getElementById('new-tab-btn').addEventListener('click', async () => {
  const result = await ipcRenderer.invoke('create-terminal-tab', { name: 'Terminal' });
  if (result) {
    createTerminalTab(result.tabId, 'Terminal', true);
    switchToTab(result.tabId);
  }
});

// Handle resize
const terminalsWrapper = document.getElementById('terminals-wrapper');
const resizeObserver = new ResizeObserver(() => {
  terminals.forEach((t, id) => {
    t.fitAddon.fit();
    if (id === activeTabId) {
      ipcRenderer.send('terminal-resize', { tabId: id, cols: t.terminal.cols, rows: t.terminal.rows });
    }
  });
});
resizeObserver.observe(terminalsWrapper);


// ============================================
// Panel Resizer
// ============================================
const resizer = document.getElementById('resizer');
const resizeOverlay = document.getElementById('resize-overlay');
const terminalPanel = document.getElementById('terminal-panel');
let isResizing = false;

function stopResizing() {
  if (isResizing) {
    isResizing = false;
    resizer.classList.remove('dragging');
    document.body.classList.remove('resizing');
    document.body.style.cursor = '';
  }
}

function handleResize(e) {
  if (!isResizing) return;

  const containerRect = document.querySelector('.main-content').getBoundingClientRect();
  const newWidth = e.clientX - containerRect.left;
  const minWidth = 300;
  const maxWidth = containerRect.width - 300;

  if (newWidth >= minWidth && newWidth <= maxWidth) {
    terminalPanel.style.width = newWidth + 'px';
    terminals.forEach((t) => {
      t.fitAddon.fit();
    });
  }
}

resizer.addEventListener('mousedown', (e) => {
  isResizing = true;
  resizer.classList.add('dragging');
  document.body.classList.add('resizing');
  document.body.style.cursor = 'col-resize';
  e.preventDefault();
  e.stopPropagation();
});

document.addEventListener('mousemove', handleResize);
resizeOverlay.addEventListener('mousemove', handleResize);
document.addEventListener('mouseup', stopResizing);
resizeOverlay.addEventListener('mouseup', stopResizing);
document.addEventListener('mouseleave', stopResizing);
window.addEventListener('blur', stopResizing);

// ============================================
// File Browser
// ============================================

const filesPanel = document.getElementById('files-panel');
const filesTree = document.getElementById('files-tree');
const expandFilesBtn = document.getElementById('expand-files-btn');
const refreshFilesBtn = document.getElementById('refresh-files-btn');
const uploadFileBtn = document.getElementById('upload-file-btn');
const fileUploadInput = document.getElementById('file-upload-input');
const filesResizer = document.getElementById('files-resizer');
const contextMenu = document.getElementById('context-menu');

let contextMenuTarget = null;

// File Editor
const fileEditorModal = document.getElementById('file-editor-modal');
const editorFilename = document.getElementById('editor-filename');
const editorModified = document.getElementById('editor-modified');
const codemirrorContainer = document.getElementById('codemirror-container');
const closeEditorBtn = document.getElementById('close-editor');
const cancelEditorBtn = document.getElementById('cancel-editor');
const saveFileBtn = document.getElementById('save-file');

// Image Preview
const imagePreviewModal = document.getElementById('image-preview-modal');
const imageFilename = document.getElementById('image-filename');
const imagePreview = document.getElementById('image-preview');
const closeImageBtn = document.getElementById('close-image');
let currentImagePath = null; // Track current image path for renaming

// Markdown Preview
const markdownPreviewModal = document.getElementById('markdown-preview-modal');
const markdownFilename = document.getElementById('markdown-filename');
const markdownContent = document.getElementById('markdown-content');
const closeMarkdownBtn = document.getElementById('close-markdown');
const editMarkdownBtn = document.getElementById('edit-markdown');

// CodeMirror imports
const { EditorView, basicSetup } = require('codemirror');
const { EditorState } = require('@codemirror/state');
const { javascript } = require('@codemirror/lang-javascript');
const { json } = require('@codemirror/lang-json');
const { css } = require('@codemirror/lang-css');
const { html } = require('@codemirror/lang-html');
const { oneDark } = require('@codemirror/theme-one-dark');
const { keymap } = require('@codemirror/view');
const { marked } = require('marked');

let currentEditingFile = null;
let currentMarkdownFile = null;
let originalContent = '';
let expandedFolders = new Set();
let editorView = null;

// Image file extensions
const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp'];
// Markdown file extensions
const markdownExtensions = ['md', 'markdown', 'mdx'];

// Get file extension
function getFileExtension(filename) {
  const parts = filename.split('.');
  if (parts.length === 1) return '';
  const ext = parts.pop().toLowerCase();
  // Handle dotfiles like .gitignore, .env
  if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) {
    return filename.slice(1).toLowerCase();
  }
  return ext;
}

// Toggle files panel
function toggleFilesPanel() {
  filesPanel.classList.toggle('collapsed');
  const isCollapsed = filesPanel.classList.contains('collapsed');

  // Clear inline width so CSS can take effect
  if (isCollapsed) {
    filesPanel.style.width = '';
    expandFilesBtn.classList.remove('hidden');
  } else {
    expandFilesBtn.classList.add('hidden');
  }
}

// Folder button toggles the files panel
expandFilesBtn.addEventListener('click', toggleFilesPanel);

// Double-click on resizer to collapse
filesResizer.addEventListener('dblclick', toggleFilesPanel);

// Refresh files
refreshFilesBtn.addEventListener('click', loadFiles);

// Upload files
uploadFileBtn.addEventListener('click', () => fileUploadInput.click());

fileUploadInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;
  await uploadFiles(files);
  fileUploadInput.value = '';
});

// Shared upload function
async function uploadFiles(files) {
  const fileData = await Promise.all(files.map(async (file) => {
    const buffer = await file.arrayBuffer();
    return {
      name: file.name,
      data: Array.from(new Uint8Array(buffer)),
    };
  }));

  const result = await ipcRenderer.invoke('upload-files', { files: fileData });
  if (result.success) {
    loadFiles();
  } else {
    console.error('Upload failed:', result.error);
  }
}

// Drag and drop state
let draggedItem = null;
let isDragging = false;

// Helper to clear all drop indicators
function clearDropIndicators() {
  document.querySelectorAll('.file-item.drop-above, .file-item.drop-below, .file-item.drop-inside, .file-item.drop-target').forEach(el => {
    el.classList.remove('drop-above', 'drop-below', 'drop-inside', 'drop-target');
    delete el.dataset.dropPosition;
  });
}

// CRITICAL: Prevent Electron/browser from handling drags at document level
// This stops Electron from trying to open dropped files
// But allow drops on specific targets (terminal, file tree)
document.addEventListener('dragover', (e) => {
  e.preventDefault();
}, false);

document.addEventListener('dragenter', (e) => {
  e.preventDefault();
}, false);

document.addEventListener('drop', (e) => {
  // Only prevent if not dropping on terminal or file tree
  const terminalsWrapper = document.getElementById('terminals-wrapper');
  if (!terminalsWrapper?.contains(e.target) && !filesTree?.contains(e.target)) {
    e.preventDefault();
  }
}, false);

// Drag-and-drop files to terminal
const terminalsWrapperForDrop = document.getElementById('terminals-wrapper');
let isOverTerminal = false;
let lastDragPosition = { x: 0, y: 0 };

terminalsWrapperForDrop.addEventListener('dragover', (e) => {
  e.preventDefault();
  if (draggedItem) {
    e.dataTransfer.dropEffect = 'copy';
    terminalsWrapperForDrop.classList.add('terminal-drop-target');
    isOverTerminal = true;
    lastDragPosition = { x: e.clientX, y: e.clientY };
  }
});

terminalsWrapperForDrop.addEventListener('dragleave', (e) => {
  // Only remove visual feedback on dragleave, don't reset isOverTerminal
  // (dragend will reset it, and dragleave fires right before dragend with undefined relatedTarget)
  if (!terminalsWrapperForDrop.contains(e.relatedTarget)) {
    terminalsWrapperForDrop.classList.remove('terminal-drop-target');
    // Note: isOverTerminal is reset in dragend handler, not here
  }
});

// Terminal drop detection via dragend (capture phase - fires first)
document.addEventListener('dragend', (e) => {
  if (isOverTerminal && draggedItem?.path && activeTabId !== null) {
    const escapedPath = draggedItem.path.replace(/ /g, '\\ ');
    ipcRenderer.send('terminal-input', { tabId: activeTabId, data: escapedPath });
    terminals.get(activeTabId)?.terminal.focus();
  }

  terminalsWrapperForDrop?.classList.remove('terminal-drop-target');
  isOverTerminal = false;
}, true);

// File drag and drop handlers (external uploads + internal moves to root)
filesTree.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  // Show drag-over for external files OR internal moves to root
  if (!draggedItem && e.dataTransfer.types.includes('Files')) {
    filesTree.classList.add('drag-over');
  } else if (draggedItem && e.target === filesTree) {
    // Internal move to root folder
    const rootPath = projectPathSpan.title;
    const draggedDir = path.dirname(draggedItem.path);
    if (rootPath && draggedDir !== rootPath) {
      e.dataTransfer.dropEffect = 'move';
      filesTree.classList.add('drag-over');
    }
  }
});

filesTree.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  // Only remove if leaving the filesTree entirely
  if (!filesTree.contains(e.relatedTarget)) {
    filesTree.classList.remove('drag-over');
  }
});

filesTree.addEventListener('drop', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  filesTree.classList.remove('drag-over');

  // Handle external file drops (upload)
  if (!draggedItem && e.dataTransfer.files.length > 0) {
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
    return;
  }

  // Handle internal moves to root folder
  if (draggedItem && e.target === filesTree) {
    const rootPath = projectPathSpan.title;
    if (rootPath) {
      const itemToMove = draggedItem;
      const draggedDir = path.dirname(itemToMove.path);

      // Only move if not already in root
      if (draggedDir !== rootPath) {
        try {
          await ipcRenderer.invoke('move-file', { sourcePath: itemToMove.path, targetDir: rootPath });
          await loadFiles();
        } catch (err) {
          console.error('Failed to move file to root:', err);
        }
      }
    }
  }
});

// Context menu
function showContextMenu(e, item) {
  e.preventDefault();
  e.stopPropagation();
  contextMenuTarget = item;

  // First show to get dimensions
  contextMenu.classList.remove('hidden');

  // Position the menu
  let x = e.clientX;
  let y = e.clientY;

  // Adjust if menu goes off screen
  const rect = contextMenu.getBoundingClientRect();
  if (x + rect.width > window.innerWidth) {
    x = window.innerWidth - rect.width - 10;
  }
  if (y + rect.height > window.innerHeight) {
    y = window.innerHeight - rect.height - 10;
  }

  // Ensure not negative
  x = Math.max(10, x);
  y = Math.max(10, y);

  contextMenu.style.left = x + 'px';
  contextMenu.style.top = y + 'px';
}

function hideContextMenu() {
  contextMenu.classList.add('hidden');
  contextMenu.style.left = '-9999px';
  contextMenu.style.top = '-9999px';
  contextMenuTarget = null;
}

// Hide context menu immediately
hideContextMenu();

// Hide context menu on any click outside the menu
document.addEventListener('mousedown', (e) => {
  if (!contextMenu.contains(e.target)) {
    hideContextMenu();
  }
});

// Hide on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideContextMenu();
  }
});

// Hide on scroll
filesTree.addEventListener('scroll', hideContextMenu);

// Context menu actions
contextMenu.addEventListener('click', async (e) => {
  const action = e.target.closest('.context-item')?.dataset.action;
  if (!action || !contextMenuTarget) return;

  const filePath = contextMenuTarget.path;
  const fileName = contextMenuTarget.name;

  hideContextMenu();

  switch (action) {
    case 'rename':
      startRename(filePath, fileName);
      break;
    case 'delete':
      if (confirm(`Delete "${fileName}"?`)) {
        const result = await ipcRenderer.invoke('delete-file', filePath);
        if (result.success) {
          loadFiles();
        } else {
          alert('Failed to delete: ' + result.error);
        }
      }
      break;
    case 'copy-path':
      navigator.clipboard.writeText(filePath);
      break;
  }
});

// Rename functionality
async function startRename(filePath, oldName) {
  const fileItem = filesTree.querySelector(`[data-path="${filePath}"]`);
  if (!fileItem) return;

  const nameSpan = fileItem.querySelector('.file-name');
  const originalHTML = fileItem.innerHTML;

  // Create input for renaming
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'rename-input';
  input.value = oldName;

  // Replace name span with input
  nameSpan.replaceWith(input);
  input.focus();
  input.select();

  // Handle rename completion
  const finishRename = async () => {
    const newName = input.value.trim();
    if (newName && newName !== oldName) {
      const result = await ipcRenderer.invoke('rename-file', { oldPath: filePath, newName });
      if (!result.success) {
        alert('Failed to rename: ' + result.error);
      }
    }
    loadFiles();
  };

  input.addEventListener('blur', finishRename);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.blur();
    } else if (e.key === 'Escape') {
      input.value = oldName;
      input.blur();
    }
  });
}

// Load files from project
async function loadFiles() {
  const result = await ipcRenderer.invoke('read-directory');
  if (!result.success) {
    filesTree.innerHTML = '<div class="files-empty">No project open</div>';
    return;
  }

  // Store expanded folders to restore after render
  const foldersToRestore = new Set(expandedFolders);

  renderFileTree(result.items, result.rootPath);

  // Restore expanded folders
  await restoreExpandedFolders(foldersToRestore);
}

async function restoreExpandedFolders(foldersToRestore) {
  // Sort by path length to expand parent folders first
  const sortedPaths = Array.from(foldersToRestore).sort((a, b) => a.length - b.length);

  for (const folderPath of sortedPaths) {
    // Find the folder element in the current tree
    const folderEl = filesTree.querySelector(`.file-item.folder[data-path="${CSS.escape(folderPath)}"]`);
    if (folderEl && !expandedFolders.has(folderPath)) {
      // Get depth from indent spans
      const depth = folderEl.querySelectorAll('.indent').length;
      // Expand this folder
      expandedFolders.add(folderPath);
      const result = await ipcRenderer.invoke('read-subdirectory', folderPath);
      if (result.success && result.items.length > 0) {
        let insertAfter = folderEl;
        result.items.forEach(child => {
          const childEl = createFileItem(child, depth + 1);
          insertAfter.after(childEl);
          insertAfter = childEl;
        });
      }
    }
  }
}

function renderFileTree(items, rootPath) {
  filesTree.innerHTML = '';
  expandedFolders.clear(); // Clear since we'll restore them

  if (items.length === 0) {
    filesTree.innerHTML = '<div class="files-empty">Empty project</div>';
    return;
  }

  items.forEach(item => {
    const el = createFileItem(item, 0);
    filesTree.appendChild(el);
  });
}

function createFileItem(item, depth) {
  const div = document.createElement('div');
  const ext = getFileExtension(item.name);
  const isImage = imageExtensions.includes(ext);
  const isMarkdown = markdownExtensions.includes(ext);

  div.className = `file-item ${item.isDirectory ? 'folder' : 'file'}${isImage ? ' image-file' : ''}`;
  div.dataset.path = item.path;
  if (ext) div.dataset.ext = ext;

  // Make all items draggable
  div.draggable = true;

  const indent = '<span class="indent"></span>'.repeat(depth);
  let icon;

  if (item.isDirectory) {
    icon = `<svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
       </svg>`;
  } else if (isImage) {
    icon = `<svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
         <circle cx="8.5" cy="8.5" r="1.5"/>
         <polyline points="21 15 16 10 5 21"/>
       </svg>`;
  } else {
    icon = `<svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
         <polyline points="14 2 14 8 20 8"/>
       </svg>`;
  }

  // Show extension badge for files
  const extBadge = (!item.isDirectory && ext) ? `<span class="file-ext">${ext}</span>` : '';
  div.innerHTML = `${indent}${icon}<span class="file-name">${item.name}</span>${extBadge}`;

  // Drag start - set the item being dragged
  div.addEventListener('dragstart', (e) => {
    draggedItem = item;
    isDragging = true;
    div.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.path);
  });

  // Drag end - cleanup all indicators
  div.addEventListener('dragend', (e) => {
    div.classList.remove('dragging');
    clearDropIndicators();
    setTimeout(() => { draggedItem = null; isDragging = false; }, 200);
  });

  // Unified drag-over handler using thirds approach
  div.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedItem || draggedItem.path === item.path) return;

    // Don't allow dropping folder into its own children
    if (draggedItem.isDirectory && item.path.startsWith(draggedItem.path + '/')) return;

    const rect = div.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const height = rect.height;

    // Clear previous indicators
    clearDropIndicators();

    e.dataTransfer.dropEffect = 'move';

    if (item.isDirectory) {
      // For folders: top third = above, middle third = inside, bottom third = below
      if (offsetY < height * 0.25) {
        div.classList.add('drop-above');
        div.dataset.dropPosition = 'above';
      } else if (offsetY > height * 0.75) {
        div.classList.add('drop-below');
        div.dataset.dropPosition = 'below';
      } else {
        // Middle - drop INTO folder (if not already in it)
        const draggedDir = path.dirname(draggedItem.path);
        if (draggedDir !== item.path) {
          div.classList.add('drop-inside');
          div.dataset.dropPosition = 'inside';
        }
      }
    } else {
      // For files: top half = above, bottom half = below
      if (offsetY < height / 2) {
        div.classList.add('drop-above');
        div.dataset.dropPosition = 'above';
      } else {
        div.classList.add('drop-below');
        div.dataset.dropPosition = 'below';
      }
    }
  });

  div.addEventListener('dragleave', (e) => {
    e.stopPropagation();
    div.classList.remove('drop-above', 'drop-below', 'drop-inside', 'drop-target');
    delete div.dataset.dropPosition;
  });

  div.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const dropPosition = div.dataset.dropPosition;
    clearDropIndicators();

    const itemToMove = draggedItem;
    if (!itemToMove || itemToMove.path === item.path) return;

    // Determine target directory based on drop position
    let targetDir;
    if (dropPosition === 'inside' && item.isDirectory) {
      targetDir = item.path;
    } else {
      targetDir = path.dirname(item.path);
    }

    const draggedDir = path.dirname(itemToMove.path);

    // Only move if target is different
    if (draggedDir !== targetDir) {
      try {
        await ipcRenderer.invoke('move-file', { sourcePath: itemToMove.path, targetDir });
        await loadFiles();
      } catch (err) {
        console.error('Failed to move file:', err);
      }
    }
  });

  // Click and double-click handlers
  if (item.isDirectory) {
    div.addEventListener('click', (e) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      toggleFolder(item, div, depth);
    });
  } else if (isImage) {
    div.addEventListener('dblclick', () => openImage(item));
  } else if (isMarkdown) {
    div.addEventListener('dblclick', () => openMarkdown(item));
  } else {
    div.addEventListener('dblclick', () => openFile(item));
  }

  // Right-click context menu
  div.addEventListener('contextmenu', (e) => showContextMenu(e, item));

  return div;
}

async function toggleFolder(item, element, depth) {
  const isExpanded = expandedFolders.has(item.path);

  if (isExpanded) {
    // Collapse
    expandedFolders.delete(item.path);
    let next = element.nextElementSibling;
    while (next && next.dataset.path?.startsWith(item.path + '/')) {
      const toRemove = next;
      next = next.nextElementSibling;
      toRemove.remove();
    }
  } else {
    // Expand
    expandedFolders.add(item.path);
    const result = await ipcRenderer.invoke('read-subdirectory', item.path);
    if (result.success && result.items.length > 0) {
      let insertAfter = element;
      result.items.forEach(child => {
        const childEl = createFileItem(child, depth + 1);
        insertAfter.after(childEl);
        insertAfter = childEl;
      });
    }
  }
}

// Get language extension for CodeMirror based on file extension
function getLanguageExtension(filename) {
  const ext = getFileExtension(filename);
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'mjs':
      return javascript({ jsx: true });
    case 'ts':
    case 'tsx':
      return javascript({ jsx: true, typescript: true });
    case 'json':
      return json();
    case 'css':
    case 'scss':
    case 'sass':
      return css();
    case 'html':
    case 'htm':
      return html();
    default:
      return [];
  }
}

// Create CodeMirror editor
function createEditor(content, filename) {
  // Destroy existing editor
  if (editorView) {
    editorView.destroy();
  }

  const langExtension = getLanguageExtension(filename);

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      const currentContent = update.state.doc.toString();
      if (currentContent !== originalContent) {
        editorModified.classList.remove('hidden');
      } else {
        editorModified.classList.add('hidden');
      }
    }
  });

  // Save on Cmd/Ctrl+S
  const saveKeymap = keymap.of([{
    key: 'Mod-s',
    run: () => {
      saveFileBtn.click();
      return true;
    }
  }]);

  const state = EditorState.create({
    doc: content,
    extensions: [
      basicSetup,
      oneDark,
      langExtension,
      updateListener,
      saveKeymap,
      EditorView.lineWrapping,
    ]
  });

  editorView = new EditorView({
    state,
    parent: codemirrorContainer
  });

  // Focus the editor
  editorView.focus();
}

async function openFile(item) {
  const result = await ipcRenderer.invoke('read-file', item.path);
  if (!result.success) {
    console.error('Failed to read file:', result.error);
    return;
  }

  currentEditingFile = item.path;
  originalContent = result.content;
  editorFilename.textContent = result.filename;
  editorModified.classList.add('hidden');
  fileEditorModal.classList.remove('hidden');

  // Create CodeMirror editor after modal is visible
  setTimeout(() => createEditor(result.content, result.filename), 0);
}

// Open image preview
async function openImage(item) {
  const result = await ipcRenderer.invoke('read-image', item.path);
  if (!result.success) {
    console.error('Failed to read image:', result.error);
    return;
  }

  currentImagePath = item.path;
  imageFilename.textContent = result.filename;
  imagePreview.src = result.fileUrl;
  imagePreviewModal.classList.remove('hidden');
}

// Close image preview
closeImageBtn.addEventListener('click', () => {
  imagePreviewModal.classList.add('hidden');
  imagePreview.src = '';
  currentImagePath = null;
});

imagePreviewModal.addEventListener('click', (e) => {
  if (e.target === imagePreviewModal) {
    imagePreviewModal.classList.add('hidden');
    imagePreview.src = '';
    currentImagePath = null;
  }
});

// Double-click filename to rename
imageFilename.addEventListener('dblclick', () => {
  if (!currentImagePath) return;

  const currentName = imageFilename.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.className = 'rename-input';
  input.style.cssText = 'background: #333; border: 1px solid #666; color: white; padding: 2px 6px; border-radius: 4px; font-size: inherit; width: auto; min-width: 100px;';

  imageFilename.textContent = '';
  imageFilename.appendChild(input);
  input.focus();

  // Select filename without extension
  const dotIndex = currentName.lastIndexOf('.');
  if (dotIndex > 0) {
    input.setSelectionRange(0, dotIndex);
  } else {
    input.select();
  }

  const finishRename = async () => {
    const newName = input.value.trim();
    if (newName && newName !== currentName) {
      const result = await ipcRenderer.invoke('rename-file', { oldPath: currentImagePath, newName });
      if (result.success) {
        imageFilename.textContent = newName;
        // Update the path
        currentImagePath = result.newPath;
        loadFiles(); // Refresh file browser
      } else {
        alert('Failed to rename: ' + result.error);
        imageFilename.textContent = currentName;
      }
    } else {
      imageFilename.textContent = currentName;
    }
  };

  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await finishRename();
    } else if (e.key === 'Escape') {
      imageFilename.textContent = currentName;
    }
  });

  input.addEventListener('blur', finishRename);
});

// Open markdown preview
async function openMarkdown(item) {
  const result = await ipcRenderer.invoke('read-file', item.path);
  if (!result.success) {
    console.error('Failed to read markdown:', result.error);
    return;
  }

  currentMarkdownFile = item.path;
  markdownFilename.textContent = result.filename;

  // Parse and render markdown
  const htmlContent = marked.parse(result.content);
  markdownContent.innerHTML = htmlContent;
  markdownPreviewModal.classList.remove('hidden');
}

// Close markdown preview
closeMarkdownBtn.addEventListener('click', () => {
  markdownPreviewModal.classList.add('hidden');
  markdownContent.innerHTML = '';
  currentMarkdownFile = null;
});

markdownPreviewModal.addEventListener('click', (e) => {
  if (e.target === markdownPreviewModal) {
    markdownPreviewModal.classList.add('hidden');
    markdownContent.innerHTML = '';
    currentMarkdownFile = null;
  }
});

// Double-click markdown filename to rename
markdownFilename.addEventListener('dblclick', () => {
  if (!currentMarkdownFile) return;

  const currentName = markdownFilename.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.className = 'rename-input';
  input.style.cssText = 'background: #333; border: 1px solid #666; color: white; padding: 2px 6px; border-radius: 4px; font-size: inherit; width: auto; min-width: 100px;';

  markdownFilename.textContent = '';
  markdownFilename.appendChild(input);
  input.focus();

  // Select filename without extension
  const dotIndex = currentName.lastIndexOf('.');
  if (dotIndex > 0) {
    input.setSelectionRange(0, dotIndex);
  } else {
    input.select();
  }

  const finishRename = async () => {
    const newName = input.value.trim();
    if (newName && newName !== currentName) {
      const result = await ipcRenderer.invoke('rename-file', { oldPath: currentMarkdownFile, newName });
      if (result.success) {
        markdownFilename.textContent = newName;
        currentMarkdownFile = result.newPath;
        loadFiles();
      } else {
        alert('Failed to rename: ' + result.error);
        markdownFilename.textContent = currentName;
      }
    } else {
      markdownFilename.textContent = currentName;
    }
  };

  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await finishRename();
    } else if (e.key === 'Escape') {
      markdownFilename.textContent = currentName;
    }
  });

  input.addEventListener('blur', finishRename);
});

// Edit markdown (switch to code editor)
editMarkdownBtn.addEventListener('click', () => {
  if (currentMarkdownFile) {
    markdownPreviewModal.classList.add('hidden');
    openFile({ path: currentMarkdownFile, name: path.basename(currentMarkdownFile) });
    currentMarkdownFile = null;
  }
});

// Get current editor content
function getEditorContent() {
  return editorView ? editorView.state.doc.toString() : '';
}

// Save file
saveFileBtn.addEventListener('click', async () => {
  if (!currentEditingFile || !editorView) return;

  const content = getEditorContent();
  const result = await ipcRenderer.invoke('write-file', {
    filePath: currentEditingFile,
    content: content,
  });

  if (result.success) {
    originalContent = content;
    editorModified.classList.add('hidden');
    fileEditorModal.classList.add('hidden');
    currentEditingFile = null;
    if (editorView) {
      editorView.destroy();
      editorView = null;
    }
  } else {
    console.error('Failed to save:', result.error);
  }
});

// Close editor
function closeEditor() {
  const currentContent = getEditorContent();
  if (currentContent !== originalContent) {
    if (!confirm('Discard unsaved changes?')) return;
  }
  fileEditorModal.classList.add('hidden');
  currentEditingFile = null;
  if (editorView) {
    editorView.destroy();
    editorView = null;
  }
}

closeEditorBtn.addEventListener('click', closeEditor);
cancelEditorBtn.addEventListener('click', closeEditor);

// Close on overlay click
fileEditorModal.addEventListener('click', (e) => {
  if (e.target === fileEditorModal) closeEditor();
});

// Double-click editor filename to rename
editorFilename.addEventListener('dblclick', () => {
  if (!currentEditingFile) return;

  const currentName = editorFilename.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.className = 'rename-input';
  input.style.cssText = 'background: #333; border: 1px solid #666; color: white; padding: 2px 6px; border-radius: 4px; font-size: inherit; width: auto; min-width: 100px;';

  editorFilename.textContent = '';
  editorFilename.appendChild(input);
  input.focus();

  // Select filename without extension
  const dotIndex = currentName.lastIndexOf('.');
  if (dotIndex > 0) {
    input.setSelectionRange(0, dotIndex);
  } else {
    input.select();
  }

  const finishRename = async () => {
    const newName = input.value.trim();
    if (newName && newName !== currentName) {
      const result = await ipcRenderer.invoke('rename-file', { oldPath: currentEditingFile, newName });
      if (result.success) {
        editorFilename.textContent = newName;
        currentEditingFile = result.newPath;
        loadFiles();
      } else {
        alert('Failed to rename: ' + result.error);
        editorFilename.textContent = currentName;
      }
    } else {
      editorFilename.textContent = currentName;
    }
  };

  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await finishRename();
    } else if (e.key === 'Escape') {
      editorFilename.textContent = currentName;
    }
  });

  input.addEventListener('blur', finishRename);
});

// Files panel resizer
let isResizingFiles = false;
let resizeStartX = 0;

filesResizer.addEventListener('mousedown', (e) => {
  isResizingFiles = true;
  resizeStartX = e.clientX;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
  if (!isResizingFiles) return;
  const newWidth = e.clientX;
  if (newWidth >= 150 && newWidth <= 400) {
    filesPanel.style.width = newWidth + 'px';
  }
});

document.addEventListener('mouseup', (e) => {
  if (isResizingFiles) {
    isResizingFiles = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
});

// Load files when project changes
ipcRenderer.on('project-changed', () => {
  loadFiles();
});

// Initial load
setTimeout(loadFiles, 500);

// Start polling for element selection
startPolling();
