/**
 * Window Capture - Captures simulator window directly and hides the external window
 *
 * Uses macOS window APIs to:
 * 1. Find the Simulator window by name
 * 2. Capture just that window's content
 * 3. Hide the Simulator window from view
 */

const { execFile, exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');
const os = require('os');

const execFileAsync = util.promisify(execFile);
const execAsync = util.promisify(exec);

class WindowCapture {
  constructor() {
    this.tmpDir = path.join(os.tmpdir(), 'expo-grab-window');
    this.windowCache = new Map(); // deviceName -> windowId

    if (!fs.existsSync(this.tmpDir)) {
      fs.mkdirSync(this.tmpDir, { recursive: true });
    }
  }

  /**
   * Find Simulator window ID for a specific device
   */
  async findSimulatorWindow(deviceName) {
    try {
      // Use AppleScript to get window info
      const script = `
        tell application "System Events"
          tell process "Simulator"
            set windowList to {}
            repeat with w in windows
              set windowTitle to name of w
              set windowId to id of w
              set end of windowList to windowTitle & "|||" & windowId
            end repeat
            return windowList
          end tell
        end tell
      `;

      const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);

      // Parse the output to find matching window
      const windows = stdout.trim().split(', ');
      for (const win of windows) {
        const [title, id] = win.split('|||');
        if (title && title.includes(deviceName)) {
          console.log(`Found Simulator window: "${title}" with ID: ${id}`);
          return { title, id: parseInt(id) };
        }
      }

      // Fallback: try to get any Simulator window
      if (windows.length > 0 && windows[0].includes('|||')) {
        const [title, id] = windows[0].split('|||');
        console.log(`Using first Simulator window: "${title}" with ID: ${id}`);
        return { title, id: parseInt(id) };
      }

      return null;
    } catch (error) {
      console.error('Failed to find Simulator window via AppleScript:', error.message);

      // Fallback: use CGWindowList via Python
      return this.findWindowViaCGWindowList(deviceName);
    }
  }

  /**
   * Fallback: Find window using CGWindowListCopyWindowInfo
   */
  async findWindowViaCGWindowList(deviceName) {
    try {
      const pythonScript = `
import Quartz
import json

windows = Quartz.CGWindowListCopyWindowInfo(
    Quartz.kCGWindowListOptionOnScreenOnly | Quartz.kCGWindowListExcludeDesktopElements,
    Quartz.kCGNullWindowID
)

result = []
for win in windows:
    owner = win.get('kCGWindowOwnerName', '')
    name = win.get('kCGWindowName', '')
    wid = win.get('kCGWindowNumber', 0)

    if owner == 'Simulator' and name:
        result.append({'title': name, 'id': wid, 'owner': owner})

print(json.dumps(result))
`;

      const { stdout } = await execAsync(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`);
      const windows = JSON.parse(stdout.trim());

      // Find matching window
      for (const win of windows) {
        if (win.title.includes(deviceName)) {
          console.log(`Found Simulator window via CGWindowList: "${win.title}" with ID: ${win.id}`);
          return win;
        }
      }

      // Return first Simulator window if no match
      if (windows.length > 0) {
        console.log(`Using first Simulator window: "${windows[0].title}" with ID: ${windows[0].id}`);
        return windows[0];
      }

      return null;
    } catch (error) {
      console.error('Failed to find window via CGWindowList:', error.message);
      return null;
    }
  }

  /**
   * Capture a specific window by ID
   */
  async captureWindow(windowId, outputPath) {
    try {
      // Use screencapture with window ID
      // -l<windowid> captures specific window
      // -x no sound
      // -o no shadow
      await execFileAsync('screencapture', [
        `-l${windowId}`,
        '-x',
        '-o',
        outputPath
      ]);

      if (fs.existsSync(outputPath)) {
        return fs.readFileSync(outputPath);
      }
      return null;
    } catch (error) {
      console.error('Window capture failed:', error.message);
      return null;
    }
  }

  /**
   * Hide the Simulator window by moving it off-screen
   * Note: We can't use 'set visible to false' because desktopCapturer needs the window visible
   */
  async hideSimulatorWindow() {
    try {
      // Save original position before moving off-screen
      const getPositionScript = `
        tell application "System Events"
          tell process "Simulator"
            if (count of windows) > 0 then
              set w to front window
              set {x, y} to position of w
              return (x as string) & "," & (y as string)
            end if
          end tell
        end tell
      `;

      try {
        const { stdout } = await execAsync(`osascript -e '${getPositionScript}'`);
        const [x, y] = stdout.trim().split(',').map(n => parseInt(n));
        if (!isNaN(x) && !isNaN(y)) {
          this.savedPosition = { x, y };
          console.log('Saved Simulator position:', this.savedPosition);
        }
      } catch (e) {
        console.log('Could not save position:', e.message);
      }

      // Move window off-screen (far to the left)
      const script = `
        tell application "System Events"
          tell process "Simulator"
            if (count of windows) > 0 then
              set position of front window to {-3000, 100}
            end if
          end tell
        end tell
      `;

      await execAsync(`osascript -e '${script}'`);
      console.log('Simulator window moved off-screen');
      return true;
    } catch (error) {
      console.error('Failed to hide Simulator:', error.message);
      return false;
    }
  }

  /**
   * Show the Simulator window by restoring its position
   */
  async showSimulatorWindow() {
    try {
      const x = this.savedPosition?.x ?? 100;
      const y = this.savedPosition?.y ?? 100;

      const script = `
        tell application "System Events"
          tell process "Simulator"
            if (count of windows) > 0 then
              set position of front window to {${x}, ${y}}
            end if
          end tell
        end tell
        tell application "Simulator" to activate
      `;

      await execAsync(`osascript -e '${script}'`);
      console.log('Simulator window restored to position:', x, y);
      return true;
    } catch (error) {
      console.error('Failed to show Simulator:', error.message);
      return false;
    }
  }

  /**
   * Move Simulator window off-screen (alternative to hiding)
   */
  async moveWindowOffScreen(windowId) {
    try {
      const script = `
        tell application "System Events"
          tell process "Simulator"
            repeat with w in windows
              if id of w is ${windowId} then
                set position of w to {-10000, -10000}
              end if
            end repeat
          end tell
        end tell
      `;

      await execAsync(`osascript -e '${script}'`);
      return true;
    } catch (error) {
      console.error('Failed to move window off-screen:', error.message);
      return false;
    }
  }

  /**
   * Get all Simulator windows
   */
  async getAllSimulatorWindows() {
    try {
      const pythonScript = `
import Quartz
import json

windows = Quartz.CGWindowListCopyWindowInfo(
    Quartz.kCGWindowListOptionAll,
    Quartz.kCGNullWindowID
)

result = []
for win in windows:
    owner = win.get('kCGWindowOwnerName', '')
    name = win.get('kCGWindowName', '')
    wid = win.get('kCGWindowNumber', 0)
    bounds = win.get('kCGWindowBounds', {})

    if owner == 'Simulator':
        result.append({
            'title': name or 'Untitled',
            'id': wid,
            'bounds': {
                'x': bounds.get('X', 0),
                'y': bounds.get('Y', 0),
                'width': bounds.get('Width', 0),
                'height': bounds.get('Height', 0)
            }
        })

print(json.dumps(result))
`;

      const { stdout } = await execAsync(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`);
      return JSON.parse(stdout.trim());
    } catch (error) {
      console.error('Failed to get Simulator windows:', error.message);
      return [];
    }
  }
}

module.exports = { WindowCapture };
