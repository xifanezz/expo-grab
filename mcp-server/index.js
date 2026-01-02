#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const http = require('http');
const fs = require('fs');
const path = require('path');

// State file for communication with Expo Grab app
const STATE_FILE = path.join(process.env.HOME, '.expo-grab-state.json');

function readState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading state:', e);
  }
  return {
    browserUrl: 'http://localhost:8081',
    selectedElement: null,
    projectPath: null,
  };
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Create MCP server
const server = new Server(
  {
    name: 'expo-grab',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_browser_url',
        description: 'Get the current URL loaded in the Expo Grab browser preview panel',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'set_browser_url',
        description: 'Navigate the Expo Grab browser preview to a specific URL (e.g., http://localhost:8083)',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to navigate to',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'get_selected_element',
        description: 'Get information about the element the user selected in the browser preview using the inspector tool',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'refresh_browser',
        description: 'Refresh/reload the browser preview panel to see latest changes',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_expo_grab_status',
        description: 'Check if running inside Expo Grab and get current status',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'take_screenshot',
        description: 'Take a screenshot of the browser preview. Returns base64-encoded image data.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_console_logs',
        description: 'Get recent console logs from the browser preview (errors, warnings, logs from the React Native app)',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of log entries to return (default: 50)',
            },
            level: {
              type: 'string',
              enum: ['all', 'error', 'warn', 'log', 'info'],
              description: 'Filter by log level (default: all)',
            },
          },
          required: [],
        },
      },
      {
        name: 'trigger_hot_reload',
        description: 'Trigger a hot reload/fast refresh in the Expo app',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'set_viewport_size',
        description: 'Change the browser preview viewport size to simulate different devices',
        inputSchema: {
          type: 'object',
          properties: {
            preset: {
              type: 'string',
              enum: ['iphone-se', 'iphone-14', 'iphone-14-pro-max', 'ipad', 'android-small', 'android-medium', 'desktop', 'custom'],
              description: 'Device preset or "custom" for specific dimensions',
            },
            width: {
              type: 'number',
              description: 'Custom width in pixels (only used when preset is "custom")',
            },
            height: {
              type: 'number',
              description: 'Custom height in pixels (only used when preset is "custom")',
            },
          },
          required: ['preset'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'get_browser_url': {
      const state = readState();
      return {
        content: [
          {
            type: 'text',
            text: `Browser preview URL: ${state.browserUrl}`,
          },
        ],
      };
    }

    case 'set_browser_url': {
      const state = readState();
      state.browserUrl = args.url;
      state.action = 'navigate';
      writeState(state);
      return {
        content: [
          {
            type: 'text',
            text: `Browser will navigate to: ${args.url}. The Expo Grab app will pick up this change.`,
          },
        ],
      };
    }

    case 'get_selected_element': {
      const state = readState();
      if (state.selectedElement) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(state.selectedElement, null, 2),
            },
          ],
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: 'No element selected. Ask the user to select an element using Cmd+Shift+C in the browser preview.',
          },
        ],
      };
    }

    case 'refresh_browser': {
      const state = readState();
      state.action = 'refresh';
      writeState(state);
      return {
        content: [
          {
            type: 'text',
            text: 'Browser refresh requested. The Expo Grab app will refresh the preview.',
          },
        ],
      };
    }

    case 'get_expo_grab_status': {
      const isExpoGrab = process.env.EXPO_GRAB === 'true';
      const state = readState();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              isExpoGrab,
              browserUrl: state.browserUrl,
              projectPath: state.projectPath || process.env.EXPO_GRAB_PROJECT,
              hasSelectedElement: !!state.selectedElement,
            }, null, 2),
          },
        ],
      };
    }

    case 'take_screenshot': {
      const state = readState();
      state.action = 'screenshot';
      state.screenshotReady = false;
      writeState(state);

      // Wait for screenshot to be captured by Electron app
      let attempts = 0;
      while (attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 250));
        const updatedState = readState();
        if (updatedState.screenshotReady && updatedState.screenshotData) {
          return {
            content: [
              {
                type: 'image',
                data: updatedState.screenshotData,
                mimeType: 'image/png',
              },
            ],
          };
        }
        attempts++;
      }

      return {
        content: [
          {
            type: 'text',
            text: 'Screenshot capture timed out. Make sure the Expo Grab app is running.',
          },
        ],
      };
    }

    case 'get_console_logs': {
      const state = readState();
      const limit = args.limit || 50;
      const level = args.level || 'all';

      const logs = state.consoleLogs || [];
      let filteredLogs = logs;

      if (level !== 'all') {
        filteredLogs = logs.filter(log => log.level === level);
      }

      const recentLogs = filteredLogs.slice(-limit);

      return {
        content: [
          {
            type: 'text',
            text: recentLogs.length > 0
              ? JSON.stringify(recentLogs, null, 2)
              : 'No console logs captured. Make sure the Expo app is running in the browser preview.',
          },
        ],
      };
    }

    case 'trigger_hot_reload': {
      const state = readState();
      state.action = 'hot_reload';
      writeState(state);
      return {
        content: [
          {
            type: 'text',
            text: 'Hot reload triggered. The Expo Grab app will send a reload signal to Metro.',
          },
        ],
      };
    }

    case 'set_viewport_size': {
      const presets = {
        'iphone-se': { width: 375, height: 667 },
        'iphone-14': { width: 390, height: 844 },
        'iphone-14-pro-max': { width: 430, height: 932 },
        'ipad': { width: 768, height: 1024 },
        'android-small': { width: 360, height: 640 },
        'android-medium': { width: 412, height: 915 },
        'desktop': { width: 1280, height: 800 },
      };

      let width, height;
      if (args.preset === 'custom') {
        width = args.width || 375;
        height = args.height || 667;
      } else {
        const preset = presets[args.preset];
        if (!preset) {
          return {
            content: [
              {
                type: 'text',
                text: `Unknown preset: ${args.preset}. Available: ${Object.keys(presets).join(', ')}, custom`,
              },
            ],
          };
        }
        width = preset.width;
        height = preset.height;
      }

      const state = readState();
      state.action = 'set_viewport';
      state.viewport = { width, height, preset: args.preset };
      writeState(state);

      return {
        content: [
          {
            type: 'text',
            text: `Viewport set to ${args.preset} (${width}x${height}). The browser preview will resize.`,
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Expo Grab MCP server running');
}

main().catch(console.error);
