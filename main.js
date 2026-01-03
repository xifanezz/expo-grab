const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const pty = require('node-pty-prebuilt-multiarch');
const os = require('os');
const fs = require('fs');

let mainWindow;
let ptyProcesses = new Map(); // Map of tabId -> { pty, cwd }
let currentProjectPath = null;
let currentBrowserUrl = 'http://localhost:8081';
let nextTabId = 0;

// State file for MCP server communication
const STATE_FILE = path.join(os.homedir(), '.expo-grab-state.json');

function updateState(updates) {
  let state = {};
  try {
    if (fs.existsSync(STATE_FILE)) {
      state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (e) {}

  state = { ...state, ...updates };
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function readState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (e) {}
  return {};
}

// Create skill files for React Native/Expo projects
function createSkillFiles(projectPath) {
  const skillsDir = path.join(projectPath, 'skills');
  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }

  const skillFiles = {
    'components.md': `# React Native Components Skill

## Core Components
- Use View, Text, Image, ScrollView as building blocks
- All text MUST be wrapped in <Text> components
- Use SafeAreaView for iOS notch handling

## Best Practices
- Use FlatList for lists (not ScrollView with map)
- Use Pressable over TouchableOpacity
- Define styles with StyleSheet.create()
- Use unique keys in lists (never array index)

## Anti-Patterns to AVOID
- Nested ScrollViews
- Inline styles (recreates objects every render)
- Missing keyExtractor in FlatList
- Using index as key`,

    'navigation.md': `# React Navigation Skill

## Setup
\`\`\`bash
npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
\`\`\`

## Type-Safe Navigation
\`\`\`tsx
type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
};
navigation.navigate('Profile', { userId: '123' });
\`\`\`

## Best Practices
- Always define ParamList types
- Use useNavigation hook with proper typing
- Handle Android back button
- Implement deep linking for sharing

## Anti-Patterns to AVOID
- Navigation in useEffect without deps
- Untyped navigation
- Forgetting Android back button`,

    'styling.md': `# React Native Styling Skill

## Always Use StyleSheet
\`\`\`tsx
// GOOD
const styles = StyleSheet.create({ container: { flex: 1 } });

// BAD - recreates object every render
<View style={{ flex: 1 }} />
\`\`\`

## Flexbox Defaults
- flexDirection: 'column' (not row like web)
- Use flex: 1 to fill space
- justifyContent for main axis, alignItems for cross axis

## Platform-Specific
\`\`\`tsx
const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 } },
    android: { elevation: 4 },
  }),
});
\`\`\`

## Anti-Patterns to AVOID
- Percentage dimensions (use flex instead)
- Missing elevation on Android for shadows
- Hardcoded colors (use theme/constants)`,

    'api.md': `# API Integration Skill

## Fetch Pattern
\`\`\`tsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  async function fetchData() {
    try {
      const res = await fetch(API_URL);
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, []);
\`\`\`

## Best Practices
- Always handle loading state
- Always handle error state
- Use TypeScript interfaces for responses
- Store tokens securely with expo-secure-store

## Anti-Patterns to AVOID
- Storing tokens in AsyncStorage (not secure)
- Missing error handling
- Not showing loading indicators`,

    'performance.md': `# React Native Performance Skill

## FlatList Optimization
\`\`\`tsx
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={item => item.id}
  maxToRenderPerBatch={10}
  windowSize={10}
  removeClippedSubviews={true}
/>
\`\`\`

## Memoization
\`\`\`tsx
const MemoizedItem = React.memo(ListItem);
const handlePress = useCallback(() => {}, [deps]);
const sorted = useMemo(() => items.sort(), [items]);
\`\`\`

## Best Practices
- Use React.memo for list items
- Use useCallback for event handlers
- Avoid anonymous functions in render
- Use getItemLayout for fixed-height items

## Anti-Patterns to AVOID
- Re-creating functions in render
- Missing memo on list items
- Heavy computation in render`,

    'auth.md': `# Authentication Skill

## Secure Token Storage
\`\`\`tsx
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('token', token);
const token = await SecureStore.getItemAsync('token');
await SecureStore.deleteItemAsync('token');
\`\`\`

## Auth Context Pattern
\`\`\`tsx
const AuthContext = createContext<{
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}>({});
\`\`\`

## Best Practices
- Use expo-secure-store for tokens (NOT AsyncStorage)
- Check session on app start
- Handle token refresh
- Clear all data on logout

## Anti-Patterns to AVOID
- Storing tokens in AsyncStorage
- Missing session check on app start
- Not handling token expiration`,

    'ui-patterns.md': `# Premium UI Patterns Skill

Patterns from top apps: Monzo, DoorDash, Airbnb, Shop, Spotify, Luma, Clubhouse.

## Core Principles
1. **Restraint** - One accent color, let whitespace breathe
2. **Elevation** - Subtle shadows create hierarchy, not colored backgrounds
3. **Consistency** - Same spacing, radii, typography everywhere

## Spacing System
\`\`\`tsx
// Screen padding: 16-24px
<View style={{ paddingHorizontal: 16 }}>
// Card padding: 16-20px
// Section spacing: 24-32px between sections
\`\`\`

## Card Pattern (Elevated, not colored)
\`\`\`tsx
const Card = ({ children }) => (
  <View style={{
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  }}>
    {children}
  </View>
);
\`\`\`

## Button Patterns
\`\`\`tsx
// Primary - Black pill
const PrimaryButton = ({ title }) => (
  <Pressable style={{
    backgroundColor: '#000',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  }}>
    <Text style={{ color: '#FFF', fontWeight: '600' }}>{title}</Text>
  </Pressable>
);

// Secondary - Gray background
const SecondaryButton = ({ title }) => (
  <Pressable style={{
    backgroundColor: '#F5F5F5',
    borderRadius: 100,
    paddingVertical: 16,
  }}>
    <Text style={{ fontWeight: '600' }}>{title}</Text>
  </Pressable>
);
\`\`\`

## Typography Scale
\`\`\`tsx
h1: { fontSize: 32, fontWeight: '700' }
h2: { fontSize: 24, fontWeight: '700' }
h3: { fontSize: 20, fontWeight: '600' }
body: { fontSize: 14, color: '#666' }
caption: { fontSize: 12, color: '#999' }
\`\`\`

## Section Header
\`\`\`tsx
<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
  <Text style={{ fontSize: 20, fontWeight: '700' }}>Popular</Text>
  <Text style={{ color: '#007AFF' }}>See all</Text>
</View>
\`\`\`

## Avatar with Badge
\`\`\`tsx
<View>
  <Image style={{ width: 40, height: 40, borderRadius: 20 }} />
  <View style={{
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#34C759', borderWidth: 2, borderColor: '#FFF'
  }} />
</View>
\`\`\`

## Filter Chips (Horizontal scroll)
\`\`\`tsx
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16 }}>
    <Chip label="All" active />
    <Chip label="Popular" />
    <Chip label="New" />
  </View>
</ScrollView>
\`\`\`

## Image Card with Badge (Airbnb style)
\`\`\`tsx
<View>
  <Image style={{ borderRadius: 12, height: 180 }} />
  <View style={{
    position: 'absolute', top: 12, left: 12,
    backgroundColor: '#FFF', borderRadius: 100, padding: 8
  }}>
    <Text>Guest favorite</Text>
  </View>
</View>
\`\`\`

## Color Palette
\`\`\`tsx
const colors = {
  background: '#FFFFFF',
  backgroundSecondary: '#F8F8F8',
  cream: '#FDF8F3', // Clubhouse style alternative
  text: '#000000',
  textSecondary: '#666666',
  border: '#E5E5E5',
  accent: '#007AFF', // Pick ONE
};
\`\`\`

## DO's
- Use 16-24px padding
- Use borderRadius 12-20px
- Use subtle shadows (opacity 0.08)
- Use ONE accent color
- Use pill buttons (borderRadius: 100)
- Use cream/beige as white alternative

## DON'Ts
- Colored background cards (looks dated)
- Heavy shadows (opacity > 0.15)
- Sharp corners (< 8px radius)
- Multiple competing colors
- Text smaller than 12px`,

    'layout.md': `# React Native Layout Patterns

Layout patterns for NativeWind (Tailwind CSS for React Native).

## Screen Template
\`\`\`tsx
<SafeAreaView className="flex-1 bg-background">
  <ScrollView contentContainerClassName="pb-32">
    <View className="p-6">
      <Heading level="h2">Title</Heading>
    </View>
    <View className="px-6 gap-4">
      {/* Content */}
    </View>
  </ScrollView>
</SafeAreaView>
\`\`\`

## Two-Column Grid
\`\`\`tsx
<View className="flex-row flex-wrap gap-4 px-6">
  {items.map((item) => (
    <View key={item.id} className="basis-[48%]">
      <Card>{/* Content */}</Card>
    </View>
  ))}
</View>
\`\`\`

## Horizontal Scroll
\`\`\`tsx
<FlatList
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerClassName="px-6 gap-4"
  renderItem={({ item }) => <Card className="w-64" />}
/>
\`\`\`

## Section Header
\`\`\`tsx
<View className="flex-row justify-between items-center mb-4">
  <Heading level="h3">Section</Heading>
  <Text className="text-primary">See all</Text>
</View>
\`\`\`

## Common Mistakes
\`\`\`tsx
// ❌ Grid not supported
<View className="grid grid-cols-2">
// ✅ Use flex-wrap
<View className="flex-row flex-wrap gap-4">

// ❌ flex-1 with wrap
<View className="flex-row flex-wrap">
  <View className="flex-1">
// ✅ Use basis
<View className="basis-[48%]">

// ❌ Content behind tab bar
<ScrollView>
// ✅ Add bottom padding
<ScrollView contentContainerClassName="pb-32">

// ❌ Hardcoded colors
<View className="bg-white">
// ✅ Semantic tokens
<View className="bg-background">
\`\`\``,

    'theme.md': `# React Native Theme System

NativeWind CSS variables for light/dark mode.

## Light Theme
\`\`\`typescript
export const lightTheme = vars({
  '--background': '255 255 255',
  '--foreground': '23 23 23',
  '--card': '255 255 255',
  '--card-foreground': '23 23 23',
  '--primary': '24 24 27',
  '--primary-foreground': '250 250 250',
  '--secondary': '244 244 245',
  '--secondary-foreground': '24 24 27',
  '--muted': '244 244 245',
  '--muted-foreground': '113 113 122',
  '--destructive': '220 38 38',
  '--border': '228 228 231',
  '--radius': '10',
});
\`\`\`

## Dark Theme
\`\`\`typescript
export const darkTheme = vars({
  '--background': '23 23 23',
  '--foreground': '250 250 250',
  '--card': '30 30 30',
  '--card-foreground': '250 250 250',
  '--primary': '228 228 231',
  '--primary-foreground': '24 24 27',
  '--secondary': '39 39 42',
  '--secondary-foreground': '250 250 250',
  '--muted': '39 39 42',
  '--muted-foreground': '161 161 170',
  '--destructive': '239 68 68',
  '--border': '39 39 42',
  '--radius': '10',
});
\`\`\`

## Usage
\`\`\`tsx
// Backgrounds
<View className="bg-background">
<View className="bg-card">
<View className="bg-muted">

// Text
<Text className="text-foreground">
<Text className="text-muted-foreground">

// Buttons
<TouchableOpacity className="bg-primary rounded-lg px-6 py-3">
  <Text className="text-primary-foreground">Action</Text>
</TouchableOpacity>
\`\`\`

## DO's
- Use semantic tokens (bg-background, text-foreground)
- Provide both light and dark themes
- Use CSS variable radius

## DON'Ts
- Hardcode colors (bg-white, text-gray-500)
- Mix semantic and hardcoded colors
- Forget dark mode support`,

    'ui-components.md': `# NativeWind UI Components

Production-ready components for React Native with NativeWind.

## Button
\`\`\`tsx
<Pressable className="bg-primary rounded-xl py-3 px-6 items-center">
  <Text className="text-primary-foreground font-semibold">Button</Text>
</Pressable>

// Variants
bg-primary text-primary-foreground    // Primary
bg-secondary text-secondary-foreground // Secondary
bg-transparent border border-border   // Outline
bg-destructive text-white             // Destructive
\`\`\`

## Card
\`\`\`tsx
<View className="bg-card rounded-2xl p-4 shadow-sm">
  <Text className="text-card-foreground font-semibold">Title</Text>
  <Text className="text-muted-foreground">Description</Text>
</View>
\`\`\`

## Input
\`\`\`tsx
<View className="bg-input border border-border rounded-xl px-4 py-3">
  <TextInput
    className="text-foreground"
    placeholderTextColor="rgb(var(--muted-foreground))"
    placeholder="Enter text..."
  />
</View>
\`\`\`

## Avatar
\`\`\`tsx
<Image
  source={{ uri: avatarUrl }}
  className="w-10 h-10 rounded-full bg-muted"
/>

// With badge
<View className="relative">
  <Image className="w-10 h-10 rounded-full" />
  <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
</View>
\`\`\`

## Badge
\`\`\`tsx
<View className="bg-primary px-3 py-1 rounded-full">
  <Text className="text-primary-foreground text-sm font-medium">Badge</Text>
</View>
\`\`\`

## Chip/Filter
\`\`\`tsx
<Pressable className={cn(
  "px-4 py-2 rounded-full border",
  active ? "bg-primary border-primary" : "bg-transparent border-border"
)}>
  <Text className={active ? "text-primary-foreground" : "text-foreground"}>
    Label
  </Text>
</Pressable>
\`\`\`

## Menu Item
\`\`\`tsx
<Pressable className="flex-row items-center py-3 px-4 bg-card rounded-xl">
  <View className="w-10 h-10 rounded-full bg-muted items-center justify-center mr-3">
    <Icon />
  </View>
  <View className="flex-1">
    <Text className="text-foreground font-medium">Title</Text>
    <Text className="text-muted-foreground text-sm">Subtitle</Text>
  </View>
  <ChevronRight className="text-muted-foreground" />
</Pressable>
\`\`\`

## Empty State
\`\`\`tsx
<View className="flex-1 items-center justify-center p-8">
  <Icon className="text-muted-foreground mb-4" size={48} />
  <Text className="text-xl font-semibold text-center">No Items</Text>
  <Text className="text-muted-foreground text-center mt-2">
    Description here
  </Text>
  <Button className="mt-6">Action</Button>
</View>
\`\`\`

## cn() Helper
\`\`\`tsx
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs) => twMerge(clsx(inputs));
\`\`\``
  };

  for (const [filename, content] of Object.entries(skillFiles)) {
    const filePath = path.join(skillsDir, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content);
    }
  }
}

// Watch for MCP commands (like navigate requests)
function startStateWatcher() {
  let lastAction = null;

  setInterval(() => {
    const state = readState();
    if (state.action && state.action !== lastAction) {
      lastAction = state.action;

      if (state.action === 'navigate' && state.browserUrl) {
        mainWindow?.webContents.send('navigate-browser', state.browserUrl);
        currentBrowserUrl = state.browserUrl;
      } else if (state.action === 'refresh') {
        mainWindow?.webContents.send('refresh-browser');
      } else if (state.action === 'screenshot') {
        mainWindow?.webContents.send('take-screenshot');
      } else if (state.action === 'hot_reload') {
        mainWindow?.webContents.send('trigger-hot-reload');
      } else if (state.action === 'set_viewport' && state.viewport) {
        mainWindow?.webContents.send('set-viewport', state.viewport);
      }

      // Clear the action
      updateState({ action: null });
    }
  }, 500);
}

// CLAUDE.md content for Expo Grab integration
const EXPO_GRAB_CLAUDE_MD = `# Expo Grab Integration

You are running inside **Expo Grab**, a development environment with an embedded web preview.

## MCP Server
You have access to the \`expo-grab\` MCP server with these tools:

### Browser Control
- \`get_browser_url\` - Get current browser preview URL
- \`set_browser_url\` - Navigate browser to a URL (use this when Expo starts on a different port!)
- \`refresh_browser\` - Refresh the preview
- \`get_expo_grab_status\` - Check Expo Grab status

### Visual Debugging
- \`get_selected_element\` - Get info about user-selected element
- \`take_screenshot\` - Take a screenshot of the browser preview (returns base64 PNG)
- \`get_console_logs\` - Get recent console logs (errors, warnings, logs)
  - \`limit\`: Max entries (default: 50)
  - \`level\`: Filter by 'all', 'error', 'warn', 'log', 'info'

### Development Tools
- \`trigger_hot_reload\` - Trigger hot reload/fast refresh in the Expo app
- \`set_viewport_size\` - Simulate different device sizes
  - Presets: 'iphone-se', 'iphone-14', 'iphone-14-pro-max', 'ipad', 'android-small', 'android-medium', 'desktop', 'custom'
  - For 'custom': provide \`width\` and \`height\` in pixels

**IMPORTANT**: When you start Expo and it runs on a different port (e.g., 8083 instead of 8081),
use \`set_browser_url\` to update the browser preview!

## Element Selection
The user can visually select UI elements in the browser preview:
1. User presses **Cmd+Shift+C** or clicks "Inspect"
2. User hovers to see element highlights (like Chrome DevTools)
3. User clicks on any element to select it
4. Use \`get_selected_element\` to get the element info

When you see a comment block like:
\`\`\`
# ====== EXPO GRAB: Selected Element ======
# Element: <Button>
# Class: "primary-btn"
# Selector: button.primary-btn
# ==========================================
\`\`\`

This means the user selected that element and wants you to work on it.

## Workflow
1. Run \`npx expo start --web\` to start the dev server
2. **If Expo uses a different port**, call \`set_browser_url\` to update preview
3. Use \`take_screenshot\` to see the current state of the app
4. Use \`get_console_logs\` to debug errors
5. User can select elements to give you visual context
6. Make changes and use \`trigger_hot_reload\` to see updates instantly

## Tips
- Always check the port Expo is running on and update the browser if needed
- When user selects an element, focus on that specific component
- Use \`take_screenshot\` after making UI changes to verify they look correct
- Check \`get_console_logs\` with \`level: 'error'\` when something isn't working
`;

function ensureClaudeMd(projectPath) {
  const claudeMdPath = path.join(projectPath, 'CLAUDE.md');

  if (fs.existsSync(claudeMdPath)) {
    const existing = fs.readFileSync(claudeMdPath, 'utf-8');
    if (!existing.includes('Expo Grab Integration')) {
      fs.appendFileSync(claudeMdPath, '\n\n' + EXPO_GRAB_CLAUDE_MD);
    }
  } else {
    fs.writeFileSync(claudeMdPath, EXPO_GRAB_CLAUDE_MD);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
    },
  });

  mainWindow.loadFile('renderer/index.html');

  // Open DevTools in development (comment out for production)
  // mainWindow.webContents.openDevTools();

  // Start terminal in home directory on launch
  mainWindow.webContents.once('did-finish-load', () => {
    const { tabId } = startTerminal(process.env.HOME, 0, 'Claude');
    mainWindow.webContents.send('terminal-ready', { tabId, name: 'Claude' });
  });
}

function startTerminal(cwd, tabId = null, tabName = null) {
  let shell = process.env.SHELL;
  if (!shell || !fs.existsSync(shell)) {
    shell = fs.existsSync('/bin/zsh') ? '/bin/zsh' : '/bin/bash';
  }
  const workingDir = cwd || process.env.HOME;

  console.log('startTerminal called:', {
    shell,
    workingDir,
    dirExists: fs.existsSync(workingDir),
    tabId,
    tabName,
  });

  const id = tabId !== null ? tabId : nextTabId;
  nextTabId = Math.max(nextTabId, id + 1);

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: workingDir,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      EXPO_GRAB: 'true',
      EXPO_GRAB_PROJECT: workingDir,
      EXPO_GRAB_BROWSER: 'http://localhost:8081',
    },
  });

  console.log('PTY spawned with pid:', ptyProcess.pid);

  ptyProcess.onData((data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('terminal-data', { tabId: id, data });
    }

    // Auto-detect Expo URL from Metro bundler output
    const cleanData = data.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\][^\x07]*\x07/g, '');

    const metroPatterns = [
      /Waiting on (http:\/\/localhost:\d+)/,
      /Metro waiting on (http:\/\/localhost:\d+)/,
      /Web is waiting on (http:\/\/localhost:\d+)/,
      /Bundler is running on (http:\/\/localhost:\d+)/,
    ];

    for (const pattern of metroPatterns) {
      const match = cleanData.match(pattern);
      if (match && match[1]) {
        const url = match[1];
        if (url !== currentBrowserUrl) {
          currentBrowserUrl = url;
          updateState({ browserUrl: url });
          mainWindow?.webContents.send('navigate-browser', url);
          console.log('Auto-detected Expo URL:', url);
        }
        break;
      }
    }
  });

  const ptyPid = ptyProcess.pid;
  ptyProcesses.set(id, { pty: ptyProcess, cwd: workingDir, name: tabName || 'Terminal', pid: ptyPid });

  ptyProcess.onExit(({ exitCode }) => {
    console.log(`PTY ${id} (pid ${ptyPid}) exited with code:`, exitCode);
    const current = ptyProcesses.get(id);
    if (current && current.pid === ptyPid) {
      ptyProcesses.delete(id);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal-closed', id);
      }
    }
  });

  currentProjectPath = workingDir;
  return { tabId: id, cwd: workingDir };
}

// IPC Handlers
ipcMain.on('terminal-input', (event, { tabId, data }) => {
  const proc = ptyProcesses.get(tabId);
  if (proc) {
    proc.pty.write(data);
  }
});

// Send text to terminal and return result
ipcMain.handle('send-to-terminal', (event, { tabId, text }) => {
  let proc = ptyProcesses.get(tabId);
  if (!proc && ptyProcesses.size > 0) {
    proc = ptyProcesses.values().next().value;
  }

  if (!proc) {
    return { success: false, error: 'No terminal available' };
  }

  proc.pty.write(text);
  return { success: true };
});

ipcMain.on('terminal-resize', (event, { tabId, cols, rows }) => {
  const proc = ptyProcesses.get(tabId);
  if (proc) {
    proc.pty.resize(cols, rows);
  }
});

ipcMain.handle('create-terminal-tab', (event, { cwd, name }) => {
  const workingDir = cwd || currentProjectPath || process.env.HOME;
  return startTerminal(workingDir, null, name);
});

ipcMain.handle('close-terminal-tab', (event, tabId) => {
  const proc = ptyProcesses.get(tabId);
  if (proc) {
    proc.pty.kill();
    ptyProcesses.delete(tabId);
    return true;
  }
  return false;
});

ipcMain.on('element-selected', (event, elementInfo) => {
  console.log('Element selected:', elementInfo);
  updateState({ selectedElement: elementInfo });

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('element-context', elementInfo);
  }
});

ipcMain.on('screenshot-data', (event, base64Data) => {
  updateState({
    screenshotData: base64Data,
    screenshotReady: true,
  });
});

ipcMain.on('console-log', (event, logEntry) => {
  const state = readState();
  const logs = state.consoleLogs || [];
  logs.push(logEntry);
  if (logs.length > 200) {
    logs.shift();
  }
  updateState({ consoleLogs: logs });
});

ipcMain.handle('open-project', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Expo Project Folder',
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const projectPath = result.filePaths[0];
    const mcpServerPath = path.join(__dirname, 'mcp-server', 'index.js');

    // Set the current project path
    currentProjectPath = projectPath;

    ensureClaudeMd(projectPath);

    const mcpJsonPath = path.join(projectPath, '.mcp.json');
    if (!fs.existsSync(mcpJsonPath)) {
      fs.writeFileSync(mcpJsonPath, JSON.stringify({
        mcpServers: {
          'expo-grab': {
            command: 'node',
            args: [mcpServerPath]
          }
        }
      }, null, 2));
    }

    for (const [id, proc] of ptyProcesses) {
      proc.pty.kill();
    }
    ptyProcesses.clear();
    nextTabId = 0;

    const { tabId } = startTerminal(projectPath, 0, 'Claude');
    mainWindow.webContents.send('terminal-ready', { tabId, name: 'Claude' });

    // Notify file browser to refresh
    mainWindow.webContents.send('project-changed');

    return { projectPath };
  }
  return null;
});

ipcMain.handle('start-terminal', (event, cwd) => {
  return startTerminal(cwd);
});

ipcMain.handle('get-project-path', () => {
  return currentProjectPath;
});

ipcMain.handle('start-claude', (event, { tabId }) => {
  if (!currentProjectPath) {
    return { success: false, error: 'No project selected. Open or create a project first.' };
  }

  let proc = ptyProcesses.get(tabId);
  if (!proc && ptyProcesses.size > 0) {
    proc = ptyProcesses.values().next().value;
  }

  if (!proc) {
    return { success: false, error: 'No terminal available. Please open or create a project first.' };
  }

  const mcpServerPath = path.join(__dirname, 'mcp-server', 'index.js');
  const mcpJsonPath = path.join(currentProjectPath, '.mcp.json');

  let mcpAlreadyConfigured = false;
  if (fs.existsSync(mcpJsonPath)) {
    try {
      const mcpConfig = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf8'));
      mcpAlreadyConfigured = mcpConfig.mcpServers && mcpConfig.mcpServers['expo-grab'];
    } catch (e) {}
  }

  if (mcpAlreadyConfigured) {
    proc.pty.write(`cd "${currentProjectPath}" && claude --dangerously-skip-permissions\n`);
  } else {
    proc.pty.write(`cd "${currentProjectPath}" && claude mcp add expo-grab -- node ${mcpServerPath} && claude --dangerously-skip-permissions\n`);
  }

  return { success: true };
});

ipcMain.handle('start-expo', (event, { tabId }) => {
  if (!currentProjectPath) {
    return { success: false, error: 'No project selected. Open or create a project first.' };
  }

  let proc = ptyProcesses.get(tabId);
  if (!proc && ptyProcesses.size > 0) {
    proc = ptyProcesses.values().next().value;
  }

  if (!proc) {
    return { success: false, error: 'No terminal available. Please open or create a project first.' };
  }

  // Start Expo in web mode
  proc.pty.write(`cd "${currentProjectPath}" && BROWSER=none npx expo start --web\n`);
  return { success: true };
});

ipcMain.handle('create-convex', (event, { tabId }) => {
  if (!currentProjectPath) {
    return { success: false, error: 'No project selected. Open or create a project first.' };
  }

  let proc = ptyProcesses.get(tabId);
  if (!proc && ptyProcesses.size > 0) {
    proc = ptyProcesses.values().next().value;
  }

  if (!proc) {
    return { success: false, error: 'No terminal available. Please open or create a project first.' };
  }

  // Initialize Convex in the current project
  proc.pty.write(`cd "${currentProjectPath}" && npm create convex@latest\n`);
  return { success: true };
});

// Ralph handlers
ipcMain.handle('check-ralph-installed', async () => {
  const { execFile } = require('child_process');
  const os = require('os');
  const ralphPath = path.join(os.homedir(), '.local', 'bin', 'ralph');

  return new Promise((resolve) => {
    // Check if ralph exists at ~/.local/bin/ralph
    if (fs.existsSync(ralphPath)) {
      execFile(ralphPath, ['--help'], (error, stdout) => {
        if (error) {
          resolve({ installed: false });
        } else {
          resolve({ installed: true, version: 'installed' });
        }
      });
    } else {
      resolve({ installed: false });
    }
  });
});

// Check if current project has Ralph files (PROMPT.md)
ipcMain.handle('check-ralph-project', async () => {
  if (!currentProjectPath) {
    return { hasProject: false, hasRalph: false };
  }

  const promptPath = path.join(currentProjectPath, 'PROMPT.md');
  const hasRalph = fs.existsSync(promptPath);
  const projectName = path.basename(currentProjectPath);

  return { hasProject: true, hasRalph, projectName };
});

// Read PROMPT.md content from current project
ipcMain.handle('read-prompt-file', async () => {
  if (!currentProjectPath) return null;

  const promptPath = path.join(currentProjectPath, 'PROMPT.md');
  if (fs.existsSync(promptPath)) {
    try {
      return fs.readFileSync(promptPath, 'utf-8');
    } catch (e) {
      return null;
    }
  }
  return null;
});

ipcMain.handle('install-ralph', async () => {
  const { exec } = require('child_process');
  const os = require('os');

  return new Promise((resolve) => {
    // Step 1: Download from GitHub via npm
    exec('npm install -g github:frankbria/ralph-claude-code', (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: stderr || error.message });
        return;
      }

      // Step 2: Get npm global root and run install.sh
      exec('npm root -g', (err, npmRoot) => {
        if (err) {
          resolve({ success: false, error: 'Could not find npm global root' });
          return;
        }

        const installScript = path.join(npmRoot.trim(), 'ralph-claude-code', 'install.sh');

        // Run the install.sh script
        exec(`bash "${installScript}"`, (installErr, installOut, installStderr) => {
          if (installErr) {
            resolve({ success: false, error: installStderr || installErr.message });
          } else {
            // Ensure ~/.local/bin is in PATH for future commands
            resolve({ success: true, message: 'Ralph installed! You may need to add ~/.local/bin to your PATH' });
          }
        });
      });
    });
  });
});

ipcMain.handle('select-file', async (event, options) => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: options.filters || []
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('run-ralph', (event, options) => {
  if (!currentProjectPath) {
    return { success: false, error: 'No project selected. Open or create a project first.' };
  }

  let proc = ptyProcesses.get(options.tabId);
  if (!proc && ptyProcesses.size > 0) {
    proc = ptyProcesses.values().next().value;
  }

  if (!proc) {
    return { success: false, error: 'No terminal available. Please open or create a project first.' };
  }

  // Ralph is installed in ~/.local/bin
  const ralphBin = '$HOME/.local/bin';
  let cmd = `cd "${currentProjectPath}" && `;

  switch (options.command) {
    case 'start':
      // Create PROMPT.md with the user's prompt
      if (options.prompt) {
        let promptContent = options.prompt;

        // Append skill references if skills are selected
        if (options.skills && options.skills.length > 0) {
          promptContent += '\n\n---\n\n## Required Skills\n';
          promptContent += '**IMPORTANT:** Before implementing, read these skill files for best practices:\n\n';
          options.skills.forEach(skill => {
            promptContent += `- \`skills/${skill}.md\` - Read this for ${skill} patterns and anti-patterns\n`;
          });
          promptContent += '\nFollow the patterns and AVOID the anti-patterns described in these files.\n';
        }

        const promptPath = path.join(currentProjectPath, options.promptFile || 'PROMPT.md');
        fs.writeFileSync(promptPath, promptContent);
      }

      cmd += `${ralphBin}/ralph`;
      if (options.monitorMode) cmd += ' --monitor';
      if (options.verbose) cmd += ' --verbose';
      if (options.rateLimit && options.rateLimit !== 100) cmd += ` --calls ${options.rateLimit}`;
      if (options.timeout && options.timeout !== 15) cmd += ` --timeout ${options.timeout}`;
      if (options.promptFile && options.promptFile !== 'PROMPT.md') cmd += ` --prompt ${options.promptFile}`;
      break;

    case 'init':
      // Initialize Ralph in current project (create files without new folder)
      const promptMdPath = path.join(currentProjectPath, 'PROMPT.md');
      const agentMdPath = path.join(currentProjectPath, '@AGENT.md');

      // Create PROMPT.md if it doesn't exist
      if (!fs.existsSync(promptMdPath)) {
        fs.writeFileSync(promptMdPath, `# Project Task

## Objective
[Describe what you want Ralph/Claude to build or accomplish]

## Requirements
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

## Technical Details
[Any specific technologies, patterns, or constraints]

## Success Criteria
[How to know when the task is complete]
`);
      }

      // Create @AGENT.md if it doesn't exist
      if (!fs.existsSync(agentMdPath)) {
        fs.writeFileSync(agentMdPath, `# Agent Instructions

## Project Context
This is a React Native/Expo project using Ralph for autonomous development.

## Guidelines
- Follow existing code patterns and conventions
- Use TypeScript for type safety
- Use StyleSheet.create() for styles, not inline
- Handle loading and error states
- Keep components focused and reusable

## Skills Available
Check the \`skills/\` folder for best practices on:
- Components, Navigation, Styling, API, Performance, Auth

Read the relevant skill file BEFORE implementing related features.
`);
      }

      // Create skills folder with skill files
      createSkillFiles(currentProjectPath);

      cmd = `echo "✅ Ralph initialized in ${path.basename(currentProjectPath)}!" && echo "Created: PROMPT.md, @AGENT.md, skills/" && echo "Select skills in Ralph dialog, then Start Loop"`;
      break;

    case 'import':
      cmd += `${ralphBin}/ralph-import "${options.prdFile}" .`;
      break;

    case 'status':
      cmd += `${ralphBin}/ralph --status`;
      break;

    case 'monitor':
      cmd += `${ralphBin}/ralph-monitor`;
      break;

    default:
      return { success: false, error: 'Unknown command' };
  }

  proc.pty.write(cmd + '\n');
  return { success: true };
});

ipcMain.on('send-element-to-claude', (event, { tabId, elementInfo }) => {
  const targetTabId = tabId !== undefined ? tabId : 0;
  const proc = ptyProcesses.get(targetTabId);
  if (!proc) return;

  const lines = [
    '',
    '# ====== EXPO GRAB: Selected Element ======',
    `# Component: <${elementInfo.componentName}>`,
  ];

  // Selector is the most important - put it prominently
  if (elementInfo.selector) {
    lines.push(`# Selector: ${elementInfo.selector}`);
  }

  if (elementInfo.id) {
    lines.push(`# ID: #${elementInfo.id}`);
  }

  if (elementInfo.className) {
    const classes = elementInfo.className.trim().split(/\s+/).filter(c => c && !c.startsWith('css-')).slice(0, 3);
    if (classes.length) {
      lines.push(`# Classes: .${classes.join(' .')}`);
    }
  }

  if (elementInfo.text) {
    lines.push(`# Text: "${elementInfo.text}"`);
  }

  if (elementInfo.dimensions) {
    lines.push(`# Size: ${elementInfo.dimensions.width} × ${elementInfo.dimensions.height}`);
  }

  if (elementInfo.reactProps && Object.keys(elementInfo.reactProps).length > 0) {
    lines.push(`# React Props: ${JSON.stringify(elementInfo.reactProps)}`);
  }

  lines.push('# ==========================================');
  lines.push('');

  proc.pty.write(lines.join('\n'));
});

ipcMain.handle('browse-location', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Location for New Project',
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('create-project', async (event, { name, template, location }) => {
  const projectPath = path.join(location, name);
  const mcpServerPath = path.join(__dirname, 'mcp-server', 'index.js');

  if (fs.existsSync(projectPath)) {
    return { success: false, error: 'A folder with this name already exists' };
  }

  for (const [id, proc] of ptyProcesses) {
    proc.pty.kill();
  }
  ptyProcesses.clear();
  nextTabId = 0;

  const { tabId } = startTerminal(location, 0, 'Claude');
  mainWindow.webContents.send('terminal-ready', { tabId, name: 'Claude' });

  // Create expo app with web support
  const createCommand = `bunx create-expo-app@latest ${name} --template ${template} && cd ${name} && bunx expo install react-dom react-native-web @expo/metro-runtime && claude mcp add expo-grab -- node ${mcpServerPath} && claude --dangerously-skip-permissions\n`;

  setTimeout(() => {
    const proc = ptyProcesses.get(tabId);
    if (proc) {
      proc.pty.write(createCommand);
    }
  }, 100);

  setTimeout(() => {
    if (fs.existsSync(projectPath)) {
      ensureClaudeMd(projectPath);
      createSkillFiles(projectPath); // Auto-create skills for new Expo projects
      const mcpJsonPath = path.join(projectPath, '.mcp.json');
      if (!fs.existsSync(mcpJsonPath)) {
        fs.writeFileSync(mcpJsonPath, JSON.stringify({
          mcpServers: {
            'expo-grab': {
              command: 'node',
              args: [mcpServerPath]
            }
          }
        }, null, 2));
      }
    }
  }, 15000);

  currentProjectPath = projectPath;

  // Notify file browser (will show empty until project is created)
  mainWindow.webContents.send('project-changed');

  return { success: true, projectPath };
});

// ============================================
// File Browser Operations
// ============================================

ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const targetPath = dirPath || currentProjectPath;
    if (!targetPath || !fs.existsSync(targetPath)) {
      return { success: false, error: 'No project open' };
    }

    const items = [];
    const entries = fs.readdirSync(targetPath, { withFileTypes: true });

    // Sort: folders first, then files, both alphabetically
    const sorted = entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of sorted) {
      // Skip hidden files and node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      items.push({
        name: entry.name,
        path: path.join(targetPath, entry.name),
        isDirectory: entry.isDirectory(),
      });
    }

    return { success: true, items, rootPath: targetPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('read-subdirectory', async (event, dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      return { success: false, error: 'Directory not found' };
    }

    const items = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    const sorted = entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of sorted) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      items.push({
        name: entry.name,
        path: path.join(dirPath, entry.name),
        isDirectory: entry.isDirectory(),
      });
    }

    return { success: true, items };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content, filename: path.basename(filePath) };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('write-file', async (event, { filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('read-image', async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }

    // Use file:// URL for better performance with large images
    const fileUrl = `file://${filePath}`;

    return { success: true, fileUrl, filename: path.basename(filePath) };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('upload-files', async (event, { files, targetDir }) => {
  try {
    const target = targetDir || currentProjectPath;
    if (!target) {
      return { success: false, error: 'No project open' };
    }

    const results = [];
    for (const file of files) {
      const destPath = path.join(target, file.name);
      fs.writeFileSync(destPath, Buffer.from(file.data));
      results.push({ name: file.name, path: destPath });
    }

    return { success: true, files: results };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('rename-file', async (event, { oldPath, newName }) => {
  try {
    if (!fs.existsSync(oldPath)) {
      return { success: false, error: 'File not found' };
    }

    const dir = path.dirname(oldPath);
    const newPath = path.join(dir, newName);

    if (fs.existsSync(newPath)) {
      return { success: false, error: 'A file with this name already exists' };
    }

    fs.renameSync(oldPath, newPath);
    return { success: true, newPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      fs.rmSync(filePath, { recursive: true });
    } else {
      fs.unlinkSync(filePath);
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Move file/folder to a new location
ipcMain.handle('move-file', async (event, { sourcePath, targetDir }) => {
  try {
    if (!fs.existsSync(sourcePath)) {
      return { success: false, error: 'Source file not found' };
    }

    if (!fs.existsSync(targetDir)) {
      return { success: false, error: 'Target directory not found' };
    }

    const stat = fs.statSync(targetDir);
    if (!stat.isDirectory()) {
      return { success: false, error: 'Target is not a directory' };
    }

    const fileName = path.basename(sourcePath);
    const newPath = path.join(targetDir, fileName);

    // Check if file already exists in target
    if (fs.existsSync(newPath)) {
      return { success: false, error: 'A file with this name already exists in the target folder' };
    }

    // Move the file
    fs.renameSync(sourcePath, newPath);
    return { success: true, newPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  createWindow();
  startStateWatcher();

  updateState({
    browserUrl: currentBrowserUrl,
    projectPath: currentProjectPath,
    selectedElement: null,
  });
});

app.on('window-all-closed', () => {
  for (const [id, proc] of ptyProcesses) {
    proc.pty.kill();
  }
  ptyProcesses.clear();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
