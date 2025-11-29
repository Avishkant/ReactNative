/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
// Slider used for color picker + brightness controls
import ColorWheel from './src/components/ColorWheelClean';
import ScreenBrightness from './src/native/ScreenBrightness';
// Load torch module dynamically to avoid crashing when native module
// isn't linked yet. We normalize default vs named export.
let Torch: any = null;
try {
  const _t = require('react-native-torch');
  Torch = _t && _t.default ? _t.default : _t;
} catch {
  // Fallback: try to find the native module directly under several possible names
  try {
    const rn = require('react-native');
    const nm = rn && rn.NativeModules ? rn.NativeModules : {};
    const nativeTorch =
      nm.Torch ||
      nm.RCTTorch ||
      nm.RctTorch ||
      nm.TorchModule ||
      nm.RCTTorchModule;
    if (nativeTorch) {
      // Normalize into a promise-based API similar to the JS wrapper
      Torch = {
        switchState: (newState: boolean) => {
          return new Promise((resolve, reject) => {
            try {
              const fn = nativeTorch.switchState;
              if (typeof fn === 'function') {
                // Some native implementations use callbacks: (state, successCb, failureCb)
                if (fn.length >= 3) {
                  fn(
                    newState,
                    () => resolve(true),
                    (e: any) => reject(e),
                  );
                } else {
                  // Maybe returns a promise or is synchronous
                  const r = fn(newState);
                  if (r && typeof r.then === 'function')
                    r.then(() => resolve(true)).catch(reject);
                  else resolve(true);
                }
              } else {
                reject('nativeTorch.switchState not a function');
              }
            } catch (e) {
              reject(e);
            }
          });
        },
        requestCameraPermission: async (title?: string, message?: string) => {
          if (typeof nativeTorch.requestCameraPermission === 'function') {
            try {
              return await nativeTorch.requestCameraPermission(title, message);
            } catch {
              return false;
            }
          }
          return false;
        },
      };
    } else {
      Torch = null;
    }
  } catch {
    Torch = null;
  }
}
// AsyncStorage is required at runtime and its native module may be null
// if the app binary wasn't rebuilt after installing the package. We
// dynamically require it and fall back to an in-memory shim so the JS
// app doesn't crash while the native linking is fixed.

let AsyncStorage: any | null = null;
try {
  // require at runtime to avoid early crash during module initialization
  // when native module is not present.
  AsyncStorage = require('@react-native-async-storage/async-storage');
} catch {
  AsyncStorage = null;
}

const AUTO_START_KEY = 'auto_start_flashlight_v1';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaView>
  );
}

function AppContent() {
  const [isOn, setIsOn] = useState(false);
  const [sos, setSos] = useState(false);
  const sosInterval = useRef<number | null>(null);
  const [screenLightOn, setScreenLightOn] = useState(false);
  const [screenColor, setScreenColor] = useState('#ffffff');
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  // HSV state for full-range color picking
  const [pickerHue, setPickerHue] = useState(0); // 0-360
  const [pickerSat, setPickerSat] = useState(0); // 0-100
  const prevBrightnessRef = useRef<number | null>(null);
  // Wheel density state: render a low-density wheel immediately, then promote
  // to a high-density wheel after the modal animation to reduce perceived lag.
  const [wheelHighDensity, setWheelHighDensity] = useState(false);
  const wheelTimerRef = useRef<any | null>(null);
  const [autoStart, setAutoStart] = useState(false);
  const [_brightness, _setBrightness] = useState(80);
  const [permissionStatus, setPermissionStatus] = useState<
    'granted' | 'denied' | 'unknown'
  >('unknown');

  // TorchBrightness native module (optional)
  let TorchBrightness: any = null;
  try {
    const rn = require('react-native');
    TorchBrightness =
      rn.NativeModules && rn.NativeModules.TorchBrightness
        ? rn.NativeModules.TorchBrightness
        : null;
  } catch {
    TorchBrightness = null;
  }

  async function _setBrightnessNative(level: number) {
    try {
      if (
        TorchBrightness &&
        typeof TorchBrightness.setTorchBrightness === 'function'
      ) {
        await TorchBrightness.setTorchBrightness(level);
      } else {
        Alert.alert(
          'Brightness not supported',
          'This device does not support adjustable torch brightness.',
        );
      }
    } catch (err) {
      // TorchBrightness module rejected with a reason: show friendly message
      const code = err && err.code ? err.code : null;
      if (code === 'UNSUPPORTED') {
        Alert.alert(
          'Brightness not supported',
          'Adjustable flashlight brightness requires Android 13+ and a compatible device.',
        );
      } else {
        console.warn('setTorchBrightness failed', err);
        Alert.alert(
          'Brightness error',
          'Unable to change flashlight brightness on this device.',
        );
      }
    }
  }

  async function updatePermissionStatus() {
    try {
      if (Platform.OS === 'android') {
        const ok = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.CAMERA,
        );
        setPermissionStatus(ok ? 'granted' : 'denied');
      } else {
        // iOS: cannot reliably check without additional library; show unknown and rely on request flow
        setPermissionStatus('unknown');
      }
    } catch {
      setPermissionStatus('unknown');
    }
  }

  useEffect(() => {
    // load setting (guard AsyncStorage calls)
    const load = async () => {
      try {
        if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
          const value = await AsyncStorage.getItem(AUTO_START_KEY);
          if (value === '1') {
            setAutoStart(true);
            // If auto-start enabled, turn on flashlight when app opens
            setIsOn(true);
            try {
              await safeInvokeTorch(true);
            } catch {
              // ignore
            }
          }
        } else {
          // AsyncStorage native module not available yet — skip loading.
        }
      } catch {
        // ignore storage errors
      }
    };
    load();
    updatePermissionStatus();
    return () => {
      stopSos();
      if (wheelTimerRef.current) {
        clearTimeout(wheelTimerRef.current);
        wheelTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // when the screen light modal is shown, raise window brightness; restore on close
    let cancelled = false;
    (async () => {
      try {
        if (screenLightOn) {
          const sys = await ScreenBrightness.getSystemBrightness();
          if (!cancelled) {
            if (sys != null) prevBrightnessRef.current = sys;
            // set window brightness to max (1.0). Use -1.0 to reset to system default later.
            await ScreenBrightness.setWindowBrightness(1.0);
          }
        } else {
          if (!cancelled) {
            if (prevBrightnessRef.current != null) {
              const v =
                Math.max(0, Math.min(255, prevBrightnessRef.current)) / 255.0;
              await ScreenBrightness.setWindowBrightness(v);
            } else {
              await ScreenBrightness.setWindowBrightness(-1.0);
            }
            prevBrightnessRef.current = null;
          }
        }
      } catch (e) {
        // ignore; module may be missing on some platforms
        prevBrightnessRef.current = null;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [screenLightOn]);

  useEffect(() => {
    // toggle torch when isOn changes (if not using SOS)
    if (!sos) {
      // Use safe invocation to catch promise rejections
      safeInvokeTorch(isOn);
    }
  }, [isOn, sos]);

  function startSos() {
    stopSos();
    setSos(true);
    let on = false;
    sosInterval.current = setInterval(() => {
      on = !on;
      // safe invoke to avoid unhandled promise rejections
      safeInvokeTorch(on);
    }, 400) as unknown as number;
  }

  async function ensureCameraPermission(): Promise<boolean> {
    try {
      if (Torch && typeof Torch.requestCameraPermission === 'function') {
        const granted = await Torch.requestCameraPermission(
          'Camera permission',
          'App needs camera permission to use the flashlight',
        );
        return !!granted;
      }
      // Fallback: request permission from the platform (Android) or open settings on iOS
      return await requestCameraPermissionNative();
    } catch {
      return false;
    }
  }

  async function requestCameraPermissionNative(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera permission',
            message: 'App needs camera permission to use the flashlight',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS: cannot request camera permission directly from RN core here reliably
        // Open app settings so the user can grant permission.
        Alert.alert(
          'Permission required',
          'Please allow camera permission in Settings to use the flashlight',
          [
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
            { text: 'Cancel', style: 'cancel' },
          ],
        );
        return false;
      }
    } catch {
      return false;
    }
  }

  function stopSos() {
    if (sosInterval.current) {
      clearInterval(sosInterval.current as number);
      sosInterval.current = null;
    }
    setSos(false);
  }

  function toggleSos() {
    if (sos) stopSos();
    else startSos();
  }

  function openColorPicker() {
    setColorPickerOpen(true);
    // start with low density to allow modal animation to complete
    setWheelHighDensity(false);
    if (wheelTimerRef.current) {
      clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = null;
    }
    // promote to high density after a short delay
    wheelTimerRef.current = setTimeout(() => {
      setWheelHighDensity(true);
      wheelTimerRef.current = null;
    }, 220) as unknown as number;
  }

  function closeColorPicker() {
    setColorPickerOpen(false);
    setWheelHighDensity(false);
    if (wheelTimerRef.current) {
      clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = null;
    }
  }

  async function toggleAutoStart() {
    const next = !autoStart;
    setAutoStart(next);
    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(AUTO_START_KEY, next ? '1' : '0');
      } else {
        // fallback: no-op (setting won't persist until native module is linked)
      }
    } catch {
      // ignore
    }
  }

  async function safeInvokeTorch(state: boolean) {
    try {
      if (Torch && typeof Torch.switchState === 'function') {
        const r = Torch.switchState(state);
        if (r && typeof r.then === 'function') {
          await r;
        }
        return true;
      } else {
        // Try direct NativeModules fallback (in case wrapper wasn't exported as expected)
        try {
          const rn = require('react-native');
          const nativeTorch =
            rn.NativeModules && rn.NativeModules.Torch
              ? rn.NativeModules.Torch
              : null;
          if (nativeTorch && typeof nativeTorch.switchState === 'function') {
            // the native module uses callbacks; call it and assume success
            nativeTorch.switchState(
              state,
              () => {},
              (e: any) => {
                console.warn('nativeTorch error', e);
              },
            );
            return true;
          }
        } catch {
          // ignore
        }
        console.warn('Torch native module unavailable');
        Alert.alert(
          'Torch unavailable',
          'Native torch module is not linked or not available.',
        );
        return false;
      }
    } catch (err) {
      console.warn('Torch invocation failed', err);
      Alert.alert(
        'Torch error',
        typeof err === 'string'
          ? err
          : err && err.message
          ? err.message
          : 'Unknown error',
      );
      return false;
    }
  }

  // quick swatches removed

  function hsvToHex(h: number, s: number, v: number = 100) {
    // h: 0-360, s: 0-100, v:0-100 (default value=100)
    s /= 100;
    v /= 100;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0,
      g = 0,
      b = 0;
    if (h >= 0 && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h < 300) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }
    const R = Math.round((r + m) * 255);
    const G = Math.round((g + m) * 255);
    const B = Math.round((b + m) * 255);
    const hex =
      '#' + [R, G, B].map(vv => vv.toString(16).padStart(2, '0')).join('');
    return hex;
  }

  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navIconLeft} onPress={() => {}}>
          <Text style={styles.navIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Easy Flashlight</Text>
        <View style={styles.navRight}>
          <TouchableOpacity style={styles.navIconBtn} onPress={openColorPicker}>
            <Text style={styles.navIcon}>🖼️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={async () => {
              const ok = await ensureCameraPermission();
              if (!ok) {
                Alert.alert(
                  'Permission required',
                  'Camera permission is required to use the flashlight.',
                );
              } else {
                Alert.alert('Permissions', 'Camera permission granted.');
              }
            }}
          >
            <Text style={styles.navIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* <Text style={styles.title}>Easy Flashlight — Demo</Text> */}

      {/* Brightness controls (slider + percentage)
          TEMPORARILY DISABLED — re-enable when native brightness is ready
      <View style={styles.brightnessRow}>
        <Text style={styles.sliderSign}>-</Text>
        <View style={styles.brightnessBarContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={brightness}
            minimumTrackTintColor="#ff9900"
            maximumTrackTintColor="#eee"
            thumbTintColor="#ff9900"
            onValueChange={val => setBrightness(Math.round(val))}
            onSlidingComplete={async val => {
              const next = Math.round(val);
              setBrightness(next);
              if (isOn) {
                await setBrightnessNative(next);
              }
            }}
          />
          <Text style={styles.brightnessPercent}>{brightness}%</Text>
        </View>
        <Text style={styles.sliderSign}>+</Text>
      </View>
      */}

      <View style={styles.verticalButtons}>
        <TouchableOpacity
          style={[styles.iconButton, styles.iconButtonNeutral]}
          onPress={openColorPicker}
        >
          <Text style={styles.icon}>🖼️</Text>
          <Text style={styles.buttonText}>Screen Light</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, isOn && !sos ? styles.buttonActive : null]}
          onPress={async () => {
            if (isOn) {
              if (sos) stopSos();
              setIsOn(false);
            } else {
              const ok = await ensureCameraPermission();
              if (!ok) {
                Alert.alert(
                  'Permission required',
                  'Camera permission is required to use the flashlight.',
                );
                return;
              }
              if (sos) stopSos();
              setIsOn(true);
            }
          }}
        >
          <Text style={styles.icon}>🔦</Text>
          <Text style={styles.buttonText}>
            {isOn && !sos ? 'Turn OFF' : 'Turn ON'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, sos ? styles.buttonActive : null]}
          onPress={async () => {
            if (sos) {
              toggleSos();
              return;
            }
            const ok = await ensureCameraPermission();
            if (!ok) {
              Alert.alert(
                'Permission required',
                'Camera permission is required to use SOS mode.',
              );
              return;
            }
            toggleSos();
          }}
        >
          <Text style={styles.icon}>🚨</Text>
          <Text style={styles.buttonText}>
            {sos ? 'Stop SOS' : 'Start SOS'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Screen Light moved to Color Picker modal; use icon button to open it */}
      <Modal visible={colorPickerOpen} animationType="slide">
        <SafeAreaView style={styles.colorPickerWrap}>
          <Text style={[styles.sectionTitle, styles.pickerTitle]}>
            Pick a Screen Color
          </Text>

          <View style={styles.pickerCenterWrap}>
            <ColorWheel
              size={260}
              hue={pickerHue}
              sat={pickerSat}
              rings={wheelHighDensity ? 12 : 6}
              segments={wheelHighDensity ? 96 : 36}
              dotScale={wheelHighDensity ? 1 : 1.2}
              onChange={(h: number, s: number) => {
                setPickerHue(h);
                setPickerSat(s);
              }}
            />
          </View>

          <View style={styles.pickerPreviewRow}>
            <View
              style={[
                styles.colorPreview,
                { backgroundColor: hsvToHex(pickerHue, pickerSat) },
              ]}
            />
            <View style={styles.pickerValues}>
              <Text style={styles.sliderLabel}>
                Hue: {Math.round(pickerHue)}
              </Text>
              <Text style={styles.sliderLabel}>
                Sat: {Math.round(pickerSat)}%
              </Text>
            </View>
          </View>

          <View style={styles.pickerActions}>
            <TouchableOpacity
              style={[styles.smallButton, styles.actionSpacing]}
              onPress={closeColorPicker}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={async () => {
                const hex = hsvToHex(pickerHue, pickerSat);
                setScreenColor(hex);
                // Save current system brightness, then try to set window brightness
                // to maximum. If native is not available or fails we still open the
                // screen so the user sees the chosen color.
                try {
                  const sys = await ScreenBrightness.getSystemBrightness();
                  if (sys != null) prevBrightnessRef.current = sys;
                } catch {
                  prevBrightnessRef.current = null;
                }

                const ok = await ScreenBrightness.setWindowBrightness(
                  1.0,
                ).catch(() => false);

                // open the full-screen color preview regardless; if brightness
                // control is unavailable the screen will simply show the color.
                setScreenLightOn(true);
                closeColorPicker();

                if (!ok) {
                  Alert.alert(
                    'Brightness unavailable',
                    'Native brightness control is not available in this build or failed to apply. Rebuild the Android app to enable full-screen brightness.',
                  );
                }
              }}
            >
              <Text style={styles.buttonText}>Apply Color</Text>
            </TouchableOpacity>
          </View>

          {/* Quick colors removed per request */}
        </SafeAreaView>
      </Modal>

      {/* <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={() => toggleAutoStart()}
          >
            <Text style={styles.buttonText}>
              {autoStart ? 'Auto-start: ON' : 'Auto-start: OFF'}
            </Text>
          </TouchableOpacity>
          <View style={styles.permissionContainer}>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={async () => {
                const ok = await ensureCameraPermission();
                await updatePermissionStatus();
                if (ok) {
                  Alert.alert(
                    'Permission granted',
                    'Camera permission granted.',
                  );
                } else {
                  Alert.alert(
                    'Permission not granted',
                    'Camera permission not granted.',
                  );
                }
              }}
            >
              <Text style={styles.buttonText}>Request Camera Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallButton, { marginTop: 8 }]}
              onPress={async () => {
                // Debug: try calling native module directly
                try {
                  const rn = require('react-native');
                  const nativeTorch =
                    rn.NativeModules && rn.NativeModules.Torch
                      ? rn.NativeModules.Torch
                      : null;
                  if (
                    nativeTorch &&
                    typeof nativeTorch.switchState === 'function'
                  ) {
                    // toggle briefly to test
                    await safeInvokeTorch(true);
                    setTimeout(async () => {
                      await safeInvokeTorch(false);
                    }, 800);
                  } else {
                    Alert.alert(
                      'Native module missing',
                      'NativeModules.Torch not available',
                    );
                  }
                } catch (e) {
                  Alert.alert(
                    'Error calling native torch',
                    e && e.message ? e.message : String(e),
                  );
                }
              }}
            >
              <Text style={styles.buttonText}>Test Native Torch</Text>
            </TouchableOpacity>
            <Text style={styles.permissionText}>
              Camera permission:{' '}
              {permissionStatus === 'granted'
                ? 'GRANTED'
                : permissionStatus === 'denied'
                ? 'DENIED'
                : 'UNKNOWN'}
            </Text>
          </View>
        </View>
      </View> */}

      <Modal visible={screenLightOn} animationType="fade">
        <TouchableOpacity
          style={[styles.screenLight, { backgroundColor: screenColor }]}
          activeOpacity={1}
          onPress={async () => {
            // Restore previous brightness (if we saved it) before closing the
            // full-screen view so the user immediately sees the original level.
            try {
              if (prevBrightnessRef.current != null) {
                const v =
                  Math.max(0, Math.min(255, prevBrightnessRef.current)) / 255.0;
                await ScreenBrightness.setWindowBrightness(v).catch(() => {});
              } else {
                // Use -1.0 to reset to system default
                await ScreenBrightness.setWindowBrightness(-1.0).catch(
                  () => {},
                );
              }
            } catch {
              // ignore
            } finally {
              prevBrightnessRef.current = null;
              setScreenLightOn(false);
            }
          }}
        >
          <Text style={styles.screenLightText}>Tap to close</Text>
        </TouchableOpacity>
      </Modal>

      {/* <View style={styles.footer}>
        <Text style={styles.note}>Notes:</Text>
        <Text style={styles.note}>• Android 13+ supports flashlight brightness via native API (not implemented).</Text>
        <Text style={styles.note}>• Home screen widget requires native Android work (not implemented).</Text>
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  // Make the top safe area match the navbar so the navbar appears flush to top
  safeArea: { flex: 1, backgroundColor: '#111' },
  // Keep horizontal padding for content, but remove top padding so navbar
  // sits at the very top of the screen inside the SafeAreaView.
  container: {
    flex: 1,
    paddingTop: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  button: {
    flex: 1,
    padding: 14,
    backgroundColor: '#222',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonActive: { backgroundColor: '#ff9900' },
  buttonText: { color: '#fff', fontWeight: '600' },
  section: { marginTop: 8 },
  sectionTitle: { fontWeight: '600', marginBottom: 8 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  smallButton: { padding: 10, backgroundColor: '#333', borderRadius: 8 },
  screenLight: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  screenLightText: {
    color: '#000',
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 8,
    borderRadius: 6,
  },
  footer: { marginTop: 20 },
  note: { fontSize: 12, color: '#666', marginBottom: 4 },
  brightnessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  brightnessBarContainer: {
    flex: 1,
    height: 24,
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  brightnessBar: { height: 10, backgroundColor: '#ffb366', borderRadius: 6 },
  brightnessPercent: {
    position: 'absolute',
    alignSelf: 'center',
    fontWeight: '600',
  },
  smallButtonSpacing: { marginLeft: 8 },
  slider: { width: '100%', height: 40 },
  sliderSign: { width: 40, textAlign: 'center', color: '#333' },
  permissionContainer: { flexDirection: 'column', marginLeft: 8 },
  permissionText: { marginTop: 8, color: '#444' },
  verticalButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconButton: {
    width: '80%',
    alignItems: 'center',
    paddingVertical: 18,
    backgroundColor: '#222',
    borderRadius: 12,
    marginBottom: 12,
  },
  icon: { fontSize: 44, marginBottom: 8 },
  // Extend navbar to the very left/right edges by offsetting the container
  // horizontal padding. Remove rounding so the bar is flush with screen edges.
  navbar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#111',
    marginBottom: 12,
    marginHorizontal: -20,
    borderRadius: 0,
  },
  navTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  navIcon: { fontSize: 22, color: '#fff' },
  navIconLeft: { width: 36, alignItems: 'flex-start' },
  navRight: { flexDirection: 'row', gap: 8 },
  navIconBtn: { paddingHorizontal: 8 },
  colorPickerWrap: { padding: 20 },
  colorTile: {
    width: 72,
    height: 72,
    borderRadius: 8,
    margin: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pickerTitle: { textAlign: 'center', marginBottom: 12 },
  pickerPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorPreview: {
    width: 84,
    height: 84,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 12,
  },
  pickerValues: { flex: 1 },
  sliderRow: { marginBottom: 12 },
  sliderLabel: { color: '#333', marginBottom: 6 },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
  },
  pickerCenterWrap: { alignItems: 'center' },
  pickerSectionTop: { marginTop: 18 },
  actionSpacing: { marginRight: 12 },
  iconButtonNeutral: { backgroundColor: '#444' },
});

export default App;
