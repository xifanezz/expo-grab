/**
 * Screen Capture Service - Captures screen from iOS Simulator and Android Emulator
 *
 * For iOS Simulator: Uses window capture (like Radon IDE) to embed simulator
 * For Android: Uses scrcpy for high-performance streaming or ADB fallback
 */

const { execFile, spawn } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const EventEmitter = require('events');
const { WindowCapture } = require('./windowCapture');

const execFileAsync = util.promisify(execFile);

class ScreenCaptureService extends EventEmitter {
  constructor() {
    super();
    this.captures = new Map(); // deviceId -> capture instance
    this.tmpDir = path.join(os.tmpdir(), 'expo-grab-capture');
    this.windowCapture = new WindowCapture(); // For iOS window-based capture
    this.simulatorHidden = false;

    // Ensure temp directory exists
    if (!fs.existsSync(this.tmpDir)) {
      fs.mkdirSync(this.tmpDir, { recursive: true });
    }

    // Find scrcpy
    this.scrcpyPath = this.findScrcpy();

    // Android SDK paths
    this.androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
                       path.join(os.homedir(), 'Library/Android/sdk');
    this.adbPath = path.join(this.androidHome, 'platform-tools', 'adb');
  }

  /**
   * Find scrcpy binary
   */
  findScrcpy() {
    const locations = [
      '/opt/homebrew/bin/scrcpy',
      '/usr/local/bin/scrcpy',
      '/usr/bin/scrcpy',
      path.join(os.homedir(), 'scrcpy', 'scrcpy')
    ];

    for (const loc of locations) {
      if (fs.existsSync(loc)) {
        return loc;
      }
    }

    // Try to find via which
    try {
      const result = require('child_process').execFileSync('which', ['scrcpy']).toString().trim();
      if (result && fs.existsSync(result)) {
        return result;
      }
    } catch (e) {}

    return null;
  }

  /**
   * Start capturing iOS Simulator screen using window capture (Radon IDE approach)
   * This captures the Simulator window directly and hides the external window
   */
  async startIosCapture(udid, options = {}) {
    const { fps = 30, deviceName = '' } = options;

    console.log(`Starting iOS window capture for ${udid} (${deviceName}) at ${fps} fps`);

    const captureState = {
      udid,
      platform: 'ios',
      running: true,
      fps,
      currentFrame: null,
      frameCount: 0,
      lastFrameTime: 0,
      interval: null,
      windowId: null,
      deviceName
    };

    const framePath = path.join(this.tmpDir, `ios-${udid}-frame.png`);

    // Find the Simulator window
    const findWindow = async () => {
      // Wait a bit for window to appear
      await new Promise(resolve => setTimeout(resolve, 1000));

      const windowInfo = await this.windowCapture.findSimulatorWindow(deviceName || udid);
      if (windowInfo) {
        captureState.windowId = windowInfo.id;
        console.log(`Found Simulator window ID: ${windowInfo.id} for "${windowInfo.title}"`);

        // Hide the external Simulator window after a short delay
        setTimeout(async () => {
          if (!this.simulatorHidden) {
            await this.windowCapture.hideSimulatorWindow();
            this.simulatorHidden = true;
            console.log('External Simulator window hidden');
          }
        }, 500);

        return true;
      }
      return false;
    };

    // Try to find window with retries
    let found = false;
    for (let i = 0; i < 10 && !found; i++) {
      found = await findWindow();
      if (!found) {
        console.log(`Waiting for Simulator window... (attempt ${i + 1}/10)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const captureFrame = async () => {
      if (!captureState.running) return;

      try {
        let frameData = null;

        // Try window capture first (faster, no external window flash)
        if (captureState.windowId) {
          frameData = await this.windowCapture.captureWindow(captureState.windowId, framePath);
        }

        // Fallback to simctl if window capture fails
        if (!frameData) {
          await execFileAsync('xcrun', ['simctl', 'io', udid, 'screenshot', framePath, '--type=png']);
          if (fs.existsSync(framePath)) {
            frameData = fs.readFileSync(framePath);
          }
        }

        if (frameData) {
          captureState.currentFrame = frameData;
          captureState.frameCount++;
          captureState.lastFrameTime = Date.now();

          this.emit('frame', {
            deviceId: udid,
            platform: 'ios',
            data: frameData,
            frameNumber: captureState.frameCount,
            timestamp: captureState.lastFrameTime
          });
        }
      } catch (error) {
        if (captureState.running) {
          console.error('iOS capture error:', error.message);
          // Try to find window again if capture failed
          if (!captureState.windowId) {
            const windowInfo = await this.windowCapture.findSimulatorWindow(deviceName || udid);
            if (windowInfo) {
              captureState.windowId = windowInfo.id;
            }
          }
        }
      }
    };

    const interval = 1000 / fps;
    captureState.interval = setInterval(captureFrame, interval);
    captureFrame();

    this.captures.set(udid, captureState);
    return captureState;
  }

  /**
   * Show the Simulator window (when stopping capture)
   */
  async showSimulatorWindow() {
    if (this.simulatorHidden) {
      await this.windowCapture.showSimulatorWindow();
      this.simulatorHidden = false;
    }
  }

  /**
   * Start capturing Android Emulator screen using scrcpy
   */
  async startAndroidCapture(serial, options = {}) {
    const {
      port = 8099,
      maxFps = 30,
      bitRate = 8000000
    } = options;

    console.log(`Starting Android capture for ${serial}`);

    if (!this.scrcpyPath) {
      console.log('scrcpy not found, using screenshot fallback');
      return this.startAndroidScreenshotCapture(serial, options);
    }

    const captureState = {
      serial,
      platform: 'android',
      running: true,
      port,
      process: null,
      currentFrame: null,
      frameCount: 0
    };

    // Start scrcpy for display
    const scrcpyProcess = spawn(this.scrcpyPath, [
      '-s', serial,
      '--max-fps', maxFps.toString(),
      '--bit-rate', bitRate.toString(),
      '--window-title', `Expo Grab - ${serial}`,
      '--stay-awake',
      '--no-audio'
    ], {
      stdio: 'ignore',
      detached: false
    });

    captureState.process = scrcpyProcess;

    scrcpyProcess.on('error', (error) => {
      console.error('scrcpy error:', error);
      this.startAndroidScreenshotCapture(serial, { ...options, captureState });
    });

    scrcpyProcess.on('close', (code) => {
      console.log(`scrcpy exited with code ${code}`);
      captureState.running = false;
    });

    // Also capture frames via ADB for our preview
    this.startAndroidScreenshotCapture(serial, { ...options, captureState });

    this.captures.set(serial, captureState);
    return captureState;
  }

  /**
   * Start Android capture using ADB screenshots (fallback)
   */
  startAndroidScreenshotCapture(serial, options = {}) {
    const { fps = 10, captureState = null } = options;

    const state = captureState || {
      serial,
      platform: 'android',
      running: true,
      fps,
      currentFrame: null,
      frameCount: 0,
      lastFrameTime: 0,
      interval: null
    };

    const captureFrame = async () => {
      if (!state.running) return;

      try {
        // Use execFile with buffer encoding for binary data
        const { stdout } = await execFileAsync(
          this.adbPath,
          ['-s', serial, 'exec-out', 'screencap', '-p'],
          { encoding: 'buffer', maxBuffer: 10 * 1024 * 1024 }
        );

        state.currentFrame = stdout;
        state.frameCount++;
        state.lastFrameTime = Date.now();

        this.emit('frame', {
          deviceId: serial,
          platform: 'android',
          data: stdout,
          frameNumber: state.frameCount,
          timestamp: state.lastFrameTime
        });
      } catch (error) {
        if (state.running) {
          console.error('Android screenshot error:', error.message);
        }
      }
    };

    const interval = 1000 / fps;
    state.interval = setInterval(captureFrame, interval);
    captureFrame();

    if (!captureState) {
      this.captures.set(serial, state);
    }

    return state;
  }

  /**
   * Stop capturing
   */
  stopCapture(deviceId) {
    const captureState = this.captures.get(deviceId);
    if (!captureState) return;

    captureState.running = false;

    if (captureState.interval) {
      clearInterval(captureState.interval);
    }

    if (captureState.process) {
      captureState.process.kill();
    }

    this.captures.delete(deviceId);
    console.log(`Stopped capture for ${deviceId}`);
  }

  /**
   * Get current frame for a device
   */
  getCurrentFrame(deviceId) {
    const captureState = this.captures.get(deviceId);
    return captureState?.currentFrame || null;
  }

  /**
   * Get capture info
   */
  getCaptureInfo(deviceId) {
    const captureState = this.captures.get(deviceId);
    if (!captureState) return null;

    return {
      deviceId,
      platform: captureState.platform,
      running: captureState.running,
      fps: captureState.fps,
      frameCount: captureState.frameCount,
      lastFrameTime: captureState.lastFrameTime
    };
  }

  /**
   * Create HTTP server for MJPEG streaming
   */
  createMjpegServer(port = 8765) {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${port}`);

      if (url.pathname.startsWith('/stream/')) {
        const deviceId = url.pathname.replace('/stream/', '');
        this.handleMjpegStream(deviceId, res);
      } else if (url.pathname.startsWith('/frame/')) {
        const deviceId = url.pathname.replace('/frame/', '');
        this.handleSingleFrame(deviceId, res);
      } else if (url.pathname === '/devices') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([...this.captures.keys()]));
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(port, () => {
      console.log(`MJPEG server listening on port ${port}`);
    });

    return server;
  }

  /**
   * Handle MJPEG stream request
   */
  handleMjpegStream(deviceId, res) {
    const captureState = this.captures.get(deviceId);
    if (!captureState) {
      res.writeHead(404);
      res.end('Device not found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const sendFrame = (frameData) => {
      if (frameData.deviceId !== deviceId) return;

      try {
        res.write('--frame\r\n');
        res.write('Content-Type: image/png\r\n');
        res.write(`Content-Length: ${frameData.data.length}\r\n`);
        res.write('\r\n');
        res.write(frameData.data);
        res.write('\r\n');
      } catch (error) {
        this.removeListener('frame', sendFrame);
      }
    };

    this.on('frame', sendFrame);

    res.on('close', () => {
      this.removeListener('frame', sendFrame);
    });
  }

  /**
   * Handle single frame request
   */
  handleSingleFrame(deviceId, res) {
    const frame = this.getCurrentFrame(deviceId);
    if (!frame) {
      res.writeHead(404);
      res.end('No frame available');
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': frame.length,
      'Cache-Control': 'no-cache'
    });
    res.end(frame);
  }

  /**
   * Cleanup
   */
  cleanup() {
    for (const [deviceId] of this.captures) {
      this.stopCapture(deviceId);
    }

    try {
      const files = fs.readdirSync(this.tmpDir);
      for (const file of files) {
        fs.unlinkSync(path.join(this.tmpDir, file));
      }
    } catch (e) {}
  }
}

module.exports = { ScreenCaptureService };
