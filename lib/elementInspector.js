/**
 * Element Inspector for Native Simulators
 *
 * Uses accessibility APIs and view hierarchy dumps to inspect elements:
 * - iOS: xcrun simctl accessibility / Accessibility Inspector
 * - Android: uiautomator dump / view hierarchy
 */

const { execFile } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { parseStringPromise } = require('xml2js');

const execFileAsync = util.promisify(execFile);

class ElementInspector {
  constructor() {
    this.androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
                       path.join(os.homedir(), 'Library/Android/sdk');
    this.adbPath = path.join(this.androidHome, 'platform-tools', 'adb');
    this.tmpDir = path.join(os.tmpdir(), 'expo-grab-inspector');

    // Ensure temp directory exists
    if (!fs.existsSync(this.tmpDir)) {
      fs.mkdirSync(this.tmpDir, { recursive: true });
    }

    // Cache for view hierarchy
    this.hierarchyCache = new Map();
  }

  /**
   * Get element at coordinates for iOS Simulator
   */
  async getIosElementAtPoint(udid, x, y, screenWidth, screenHeight) {
    try {
      // Get the view hierarchy
      const hierarchy = await this.getIosViewHierarchy(udid);
      if (!hierarchy) return null;

      // Find element at point
      const element = this.findElementAtPoint(hierarchy, x, y, screenWidth, screenHeight);
      return element;
    } catch (error) {
      console.error('iOS element inspection failed:', error.message);
      return null;
    }
  }

  /**
   * Get iOS view hierarchy using simctl
   */
  async getIosViewHierarchy(udid) {
    try {
      // Try to get accessibility hierarchy
      // Note: This requires the app to be running with accessibility enabled
      const { stdout } = await execFileAsync('xcrun', [
        'simctl', 'ui', udid, 'describe'
      ], { maxBuffer: 10 * 1024 * 1024 });

      return this.parseIosHierarchy(stdout);
    } catch (error) {
      // Fallback: try to get window info
      try {
        const { stdout } = await execFileAsync('xcrun', [
          'simctl', 'spawn', udid, 'launchctl', 'list'
        ]);
        console.log('iOS app list:', stdout.substring(0, 500));
      } catch (e) {}

      console.error('Failed to get iOS hierarchy:', error.message);
      return null;
    }
  }

  /**
   * Parse iOS hierarchy output
   */
  parseIosHierarchy(output) {
    // Parse the simctl ui describe output
    // Format varies by iOS version
    const elements = [];
    const lines = output.split('\n');

    let currentElement = null;
    let indentLevel = 0;
    const stack = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // Detect indent level
      const indent = line.match(/^(\s*)/)[1].length;
      const content = line.trim();

      // Parse element info
      const typeMatch = content.match(/^(\w+)(?:\s*\(([^)]+)\))?/);
      if (typeMatch) {
        const element = {
          type: typeMatch[1],
          label: typeMatch[2] || '',
          children: [],
          frame: null,
          accessibilityLabel: '',
          accessibilityIdentifier: ''
        };

        // Parse frame if present: {{x, y}, {w, h}}
        const frameMatch = content.match(/\{\{(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\},\s*\{(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)\}\}/);
        if (frameMatch) {
          element.frame = {
            x: parseFloat(frameMatch[1]),
            y: parseFloat(frameMatch[2]),
            width: parseFloat(frameMatch[3]),
            height: parseFloat(frameMatch[4])
          };
        }

        // Parse accessibility label
        const labelMatch = content.match(/label:\s*'([^']+)'/);
        if (labelMatch) {
          element.accessibilityLabel = labelMatch[1];
        }

        // Parse identifier
        const idMatch = content.match(/identifier:\s*'([^']+)'/);
        if (idMatch) {
          element.accessibilityIdentifier = idMatch[1];
        }

        // Build hierarchy based on indent
        while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
          stack.pop();
        }

        if (stack.length > 0) {
          stack[stack.length - 1].element.children.push(element);
        } else {
          elements.push(element);
        }

        stack.push({ indent, element });
      }
    }

    return elements;
  }

  /**
   * Get element at coordinates for Android Emulator
   */
  async getAndroidElementAtPoint(serial, x, y, screenWidth, screenHeight) {
    try {
      // Get the view hierarchy
      const hierarchy = await this.getAndroidViewHierarchy(serial);
      if (!hierarchy) return null;

      // Scale coordinates to device resolution
      const deviceInfo = await this.getAndroidScreenSize(serial);
      const scaleX = deviceInfo.width / screenWidth;
      const scaleY = deviceInfo.height / screenHeight;
      const deviceX = Math.round(x * scaleX);
      const deviceY = Math.round(y * scaleY);

      // Find element at point
      const element = this.findAndroidElementAtPoint(hierarchy, deviceX, deviceY);
      return element;
    } catch (error) {
      console.error('Android element inspection failed:', error.message);
      return null;
    }
  }

  /**
   * Get Android screen size
   */
  async getAndroidScreenSize(serial) {
    try {
      const { stdout } = await execFileAsync(this.adbPath, [
        '-s', serial, 'shell', 'wm', 'size'
      ]);
      const match = stdout.match(/(\d+)x(\d+)/);
      if (match) {
        return { width: parseInt(match[1]), height: parseInt(match[2]) };
      }
    } catch (error) {
      console.error('Failed to get Android screen size:', error.message);
    }
    return { width: 1080, height: 1920 }; // Default
  }

  /**
   * Get Android view hierarchy using uiautomator
   */
  async getAndroidViewHierarchy(serial) {
    try {
      const dumpPath = '/sdcard/window_dump.xml';
      const localPath = path.join(this.tmpDir, `android-${serial}-hierarchy.xml`);

      // Dump UI hierarchy
      await execFileAsync(this.adbPath, [
        '-s', serial, 'shell', 'uiautomator', 'dump', dumpPath
      ]);

      // Pull the dump file
      await execFileAsync(this.adbPath, [
        '-s', serial, 'pull', dumpPath, localPath
      ]);

      // Parse XML
      const xmlContent = fs.readFileSync(localPath, 'utf-8');
      const parsed = await parseStringPromise(xmlContent);

      return parsed;
    } catch (error) {
      console.error('Failed to get Android hierarchy:', error.message);
      return null;
    }
  }

  /**
   * Find Android element at point
   */
  findAndroidElementAtPoint(hierarchy, x, y, elements = null) {
    if (!elements) {
      elements = hierarchy?.hierarchy?.node || [];
    }

    let bestMatch = null;
    let smallestArea = Infinity;

    const processNode = (node) => {
      if (!node || !node.$) return;

      const bounds = node.$.bounds;
      if (bounds) {
        // Parse bounds: [x1,y1][x2,y2]
        const match = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
        if (match) {
          const x1 = parseInt(match[1]);
          const y1 = parseInt(match[2]);
          const x2 = parseInt(match[3]);
          const y2 = parseInt(match[4]);

          // Check if point is within bounds
          if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
            const area = (x2 - x1) * (y2 - y1);
            if (area < smallestArea && area > 0) {
              smallestArea = area;
              bestMatch = {
                type: node.$.class || 'View',
                text: node.$['text'] || '',
                contentDescription: node.$['content-desc'] || '',
                resourceId: node.$['resource-id'] || '',
                bounds: { x1, y1, x2, y2, width: x2 - x1, height: y2 - y1 },
                clickable: node.$.clickable === 'true',
                focusable: node.$.focusable === 'true',
                enabled: node.$.enabled === 'true',
                selected: node.$.selected === 'true',
                package: node.$.package || ''
              };
            }
          }
        }
      }

      // Process children
      if (node.node) {
        const children = Array.isArray(node.node) ? node.node : [node.node];
        for (const child of children) {
          processNode(child);
        }
      }
    };

    if (Array.isArray(elements)) {
      for (const el of elements) {
        processNode(el);
      }
    } else {
      processNode(elements);
    }

    return bestMatch;
  }

  /**
   * Find element at point in iOS hierarchy
   */
  findElementAtPoint(hierarchy, x, y, screenWidth, screenHeight) {
    let bestMatch = null;
    let smallestArea = Infinity;

    const processElement = (element) => {
      if (element.frame) {
        const frame = element.frame;

        // Check if point is within frame
        if (x >= frame.x && x <= frame.x + frame.width &&
            y >= frame.y && y <= frame.y + frame.height) {
          const area = frame.width * frame.height;
          if (area < smallestArea && area > 0) {
            smallestArea = area;
            bestMatch = {
              type: element.type,
              label: element.label,
              accessibilityLabel: element.accessibilityLabel,
              accessibilityIdentifier: element.accessibilityIdentifier,
              bounds: {
                x: frame.x,
                y: frame.y,
                width: frame.width,
                height: frame.height
              }
            };
          }
        }
      }

      // Process children
      if (element.children) {
        for (const child of element.children) {
          processElement(child);
        }
      }
    };

    if (Array.isArray(hierarchy)) {
      for (const el of hierarchy) {
        processElement(el);
      }
    }

    return bestMatch;
  }

  /**
   * Get full view hierarchy for display
   */
  async getFullHierarchy(deviceId, platform, serial) {
    if (platform === 'ios') {
      return this.getIosViewHierarchy(deviceId);
    } else if (platform === 'android') {
      return this.getAndroidViewHierarchy(serial);
    }
    return null;
  }

  /**
   * Get element at point (unified API)
   */
  async getElementAtPoint(deviceId, platform, x, y, screenWidth, screenHeight, serial) {
    if (platform === 'ios') {
      return this.getIosElementAtPoint(deviceId, x, y, screenWidth, screenHeight);
    } else if (platform === 'android') {
      return this.getAndroidElementAtPoint(serial, x, y, screenWidth, screenHeight);
    }
    return null;
  }

  /**
   * Alternative: Use React DevTools to get component info
   * This requires connecting to Metro bundler's DevTools WebSocket
   */
  async connectToReactDevTools(metroPort = 8081) {
    // Metro bundler exposes DevTools at ws://localhost:8081/devtools/page/1
    // This would allow getting React component tree
    // Implementation would require WebSocket client
    console.log('React DevTools connection not yet implemented');
    return null;
  }
}

module.exports = { ElementInspector };
