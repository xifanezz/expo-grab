/**
 * Device Manager - Lists and manages iOS Simulators and Android Emulators
 */

const { execFile, spawn } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');
const os = require('os');

const execFileAsync = util.promisify(execFile);

const DevicePlatform = {
  IOS: 'ios',
  ANDROID: 'android'
};

const DeviceState = {
  BOOTED: 'Booted',
  SHUTDOWN: 'Shutdown',
  BOOTING: 'Booting'
};

class DeviceManager {
  constructor() {
    this.androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
                       path.join(os.homedir(), 'Library/Android/sdk');
    this.emulatorPath = path.join(this.androidHome, 'emulator', 'emulator');
    this.adbPath = path.join(this.androidHome, 'platform-tools', 'adb');
    this.runningProcesses = new Map();
  }

  /**
   * List all available iOS Simulators
   */
  async listIosSimulators() {
    try {
      const { stdout } = await execFileAsync('xcrun', ['simctl', 'list', 'devices', '-j']);
      const data = JSON.parse(stdout);
      const devices = [];

      for (const [runtime, deviceList] of Object.entries(data.devices)) {
        const runtimeMatch = runtime.match(/iOS[- ](\d+[- ]\d+)/i);
        const runtimeName = runtimeMatch ? `iOS ${runtimeMatch[1].replace('-', '.')}` : runtime;

        for (const device of deviceList) {
          if (device.isAvailable) {
            devices.push({
              id: device.udid,
              name: device.name,
              platform: DevicePlatform.IOS,
              runtime: runtimeName,
              state: device.state,
              isBooted: device.state === DeviceState.BOOTED,
              available: device.isAvailable
            });
          }
        }
      }

      return devices;
    } catch (error) {
      console.error('Failed to list iOS simulators:', error.message);
      return [];
    }
  }

  /**
   * List all available Android Emulators (AVDs)
   */
  async listAndroidEmulators() {
    try {
      if (!fs.existsSync(this.emulatorPath)) {
        console.log('Android emulator not found at:', this.emulatorPath);
        return [];
      }

      const { stdout } = await execFileAsync(this.emulatorPath, ['-list-avds']);
      const avdNames = stdout.trim().split('\n').filter(name => name.trim());
      const runningDevices = await this.getRunningAndroidDevices();

      const devices = avdNames.map(name => {
        const running = runningDevices.find(d => d.avdName === name);
        return {
          id: name,
          name: name,
          platform: DevicePlatform.ANDROID,
          runtime: 'Android',
          state: running ? DeviceState.BOOTED : DeviceState.SHUTDOWN,
          isBooted: !!running,
          available: true,
          serial: running?.serial || null
        };
      });

      return devices;
    } catch (error) {
      console.error('Failed to list Android emulators:', error.message);
      return [];
    }
  }

  /**
   * Get running Android emulators via ADB
   */
  async getRunningAndroidDevices() {
    try {
      const { stdout } = await execFileAsync(this.adbPath, ['devices']);
      const lines = stdout.trim().split('\n').slice(1);
      const devices = [];

      for (const line of lines) {
        const match = line.match(/^(emulator-\d+)\s+device$/);
        if (match) {
          const serial = match[1];
          try {
            const { stdout: avdName } = await execFileAsync(
              this.adbPath, ['-s', serial, 'emu', 'avd', 'name']
            );
            devices.push({ serial, avdName: avdName.trim().split('\n')[0] });
          } catch (e) {
            devices.push({ serial, avdName: null });
          }
        }
      }

      return devices;
    } catch (error) {
      return [];
    }
  }

  /**
   * List all devices (iOS + Android)
   */
  async listAllDevices() {
    const [iosDevices, androidDevices] = await Promise.all([
      this.listIosSimulators(),
      this.listAndroidEmulators()
    ]);

    return {
      ios: iosDevices,
      android: androidDevices,
      all: [...iosDevices, ...androidDevices]
    };
  }

  /**
   * Boot an iOS Simulator
   */
  async bootIosSimulator(udid) {
    try {
      const devices = await this.listIosSimulators();
      const device = devices.find(d => d.id === udid);

      if (device?.isBooted) {
        console.log(`iOS Simulator ${udid} is already booted`);
        return { success: true, alreadyBooted: true };
      }

      console.log(`Booting iOS Simulator: ${udid}`);
      await execFileAsync('xcrun', ['simctl', 'boot', udid]);

      // Open Simulator.app in background - required for screenshot capture to work
      // The simulator GUI needs to be running even though we display it in our own window
      await execFileAsync('open', ['-a', 'Simulator', '--background', '--hide']);

      return { success: true, alreadyBooted: false };
    } catch (error) {
      console.error('Failed to boot iOS simulator:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Boot an Android Emulator
   */
  async bootAndroidEmulator(avdName) {
    try {
      const runningDevices = await this.getRunningAndroidDevices();
      const running = runningDevices.find(d => d.avdName === avdName);

      if (running) {
        console.log(`Android Emulator ${avdName} is already running`);
        return { success: true, alreadyBooted: true, serial: running.serial };
      }

      console.log(`Booting Android Emulator: ${avdName}`);

      const emulatorProcess = spawn(this.emulatorPath, [
        '-avd', avdName,
        '-no-boot-anim',
        '-no-audio',
        '-gpu', 'auto'
      ], {
        detached: true,
        stdio: 'ignore'
      });

      emulatorProcess.unref();
      this.runningProcesses.set(avdName, emulatorProcess);

      const serial = await this.waitForAndroidBoot(avdName);
      return { success: true, alreadyBooted: false, serial };
    } catch (error) {
      console.error('Failed to boot Android emulator:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Wait for Android emulator to boot
   */
  async waitForAndroidBoot(avdName, timeout = 60000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const runningDevices = await this.getRunningAndroidDevices();
      const device = runningDevices.find(d => d.avdName === avdName);

      if (device) {
        try {
          const { stdout } = await execFileAsync(
            this.adbPath, ['-s', device.serial, 'shell', 'getprop', 'sys.boot_completed']
          );
          if (stdout.trim() === '1') {
            return device.serial;
          }
        } catch (e) {}
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Android emulator boot timeout');
  }

  /**
   * Boot a device (auto-detect platform)
   */
  async bootDevice(deviceId, platform) {
    if (platform === DevicePlatform.IOS) {
      return this.bootIosSimulator(deviceId);
    } else if (platform === DevicePlatform.ANDROID) {
      return this.bootAndroidEmulator(deviceId);
    }
    throw new Error(`Unknown platform: ${platform}`);
  }

  /**
   * Shutdown an iOS Simulator
   */
  async shutdownIosSimulator(udid) {
    try {
      await execFileAsync('xcrun', ['simctl', 'shutdown', udid]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Shutdown an Android Emulator
   */
  async shutdownAndroidEmulator(serial) {
    try {
      await execFileAsync(this.adbPath, ['-s', serial, 'emu', 'kill']);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Install app on iOS Simulator
   */
  async installIosApp(udid, appPath) {
    try {
      await execFileAsync('xcrun', ['simctl', 'install', udid, appPath]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Install app on Android Emulator
   */
  async installAndroidApp(serial, apkPath) {
    try {
      await execFileAsync(this.adbPath, ['-s', serial, 'install', '-r', apkPath]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Launch app on iOS Simulator
   */
  async launchIosApp(udid, bundleId) {
    try {
      await execFileAsync('xcrun', ['simctl', 'launch', udid, bundleId]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Launch app on Android Emulator
   */
  async launchAndroidApp(serial, packageName, activityName) {
    try {
      const component = activityName ? `${packageName}/${activityName}` : packageName;
      await execFileAsync(this.adbPath, ['-s', serial, 'shell', 'am', 'start', '-n', component]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Take screenshot of iOS Simulator
   */
  async screenshotIosSimulator(udid, outputPath) {
    try {
      await execFileAsync('xcrun', ['simctl', 'io', udid, 'screenshot', outputPath]);
      return { success: true, path: outputPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Take screenshot of Android Emulator
   */
  async screenshotAndroidEmulator(serial, outputPath) {
    try {
      const tmpPath = '/sdcard/screenshot.png';
      await execFileAsync(this.adbPath, ['-s', serial, 'shell', 'screencap', '-p', tmpPath]);
      await execFileAsync(this.adbPath, ['-s', serial, 'pull', tmpPath, outputPath]);
      await execFileAsync(this.adbPath, ['-s', serial, 'shell', 'rm', tmpPath]);
      return { success: true, path: outputPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send touch event to Android Emulator
   */
  async sendTouchAndroid(serial, x, y, action = 'tap') {
    try {
      if (action === 'tap') {
        await execFileAsync(this.adbPath, ['-s', serial, 'shell', 'input', 'tap', x.toString(), y.toString()]);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send text input to Android Emulator
   */
  async sendTextAndroid(serial, text) {
    try {
      await execFileAsync(this.adbPath, ['-s', serial, 'shell', 'input', 'text', text]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send key event to Android Emulator
   */
  async sendKeyAndroid(serial, keyCode) {
    try {
      await execFileAsync(this.adbPath, ['-s', serial, 'shell', 'input', 'keyevent', keyCode.toString()]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = { DeviceManager, DevicePlatform, DeviceState };
