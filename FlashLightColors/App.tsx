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
  Animated,
  Easing,
  Dimensions,
  SafeAreaView,
} from 'react-native';
// Load torch optionally at runtime. If native module is not installed the app still works.
let Torch: { switchState: (on: boolean) => void } = { switchState: () => {} };
try {
  const _torchPkg = 'react-native-torch';
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // use a variable so Metro won't throw for a missing static import during development
  // if the package isn't installed.
  // When you want native torch support, install a compatible torch native module.
  // Example: `npm install react-native-torch` (verify available version) and rebuild.
  // then this require will load the native module.
  // eslint-disable-next-line global-require
  // @ts-ignore
  Torch = require(_torchPkg);
} catch (e) {
  // module not available — Torch stays as a stub
}
import Slider from '@react-native-community/slider';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <MainScreen />
    </SafeAreaView>
  );
}

function MainScreen() {
  const [torchOn, setTorchOn] = useState(false);
  const [sosOn, setSosOn] = useState(false);
  const [sosIntervalMs, setSosIntervalMs] = useState(300);
  const [screenMode, setScreenMode] = useState(false);
  const [color, setColor] = useState({ r: 255, g: 255, b: 255 });
  const [screenBrightness, setScreenBrightness] = useState(1);
  const pulse = useRef(new Animated.Value(0)).current;
  const sosTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      // cleanup
      if (sosTimer.current) {
        clearInterval(sosTimer.current);
      }
      Torch.switchState(false);
    };
  }, []);

  useEffect(() => {
    // toggle torch
    try {
      Torch.switchState(torchOn);
    } catch (e) {
      // ignoring if native module not installed
    }
  }, [torchOn]);

  useEffect(() => {
    // SOS mode toggling
    if (sosOn) {
      // start interval
      sosTimer.current = setInterval(() => {
        setTorchOn(prev => !prev);
      }, sosIntervalMs) as unknown as number;
    } else {
      if (sosTimer.current) {
        clearInterval(sosTimer.current);
        sosTimer.current = null;
      }
    }
  }, [sosOn, sosIntervalMs]);

  useEffect(() => {
    // pulse animation for active torch or screen mode
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 800,
          easing: Easing.in(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [pulse]);

  const toggleTorch = async () => {
    // request camera permission on Android
    try {
      const res = await check(
        PlatformSelectPermission(
          PERMISSIONS.ANDROID.CAMERA,
          PERMISSIONS.IOS.CAMERA,
        ),
      );
      if (res === RESULTS.DENIED) {
        await request(
          PlatformSelectPermission(
            PERMISSIONS.ANDROID.CAMERA,
            PERMISSIONS.IOS.CAMERA,
          ),
        );
      }
    } catch (e) {}

    setTorchOn(v => !v);
  };

  const toggleScreenMode = () => {
    setScreenMode(s => !s);
    // when enabling screen mode, ensure torch off
    if (!screenMode) setTorchOn(false);
  };

  const colorHex = rgbToHex(color.r, color.g, color.b);
  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#0b2545']} style={styles.header}>
        <Text style={styles.title}>EASY FLASHLIGHT</Text>
        <Text style={styles.subtitle}>Smart · Simple · Powerful</Text>
      </LinearGradient>

      <View style={styles.controls}>
        <Animated.View
          style={[styles.circleWrap, { transform: [{ scale: pulseScale }] }]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleTorch}
            style={[styles.toggleButton, torchOn && styles.toggleOn]}
          >
            <Text style={styles.toggleText}>{torchOn ? 'ON' : 'OFF'}</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.row}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Screen Light</Text>
            <TouchableOpacity
              onPress={toggleScreenMode}
              style={styles.screenPreview}
            >
              <View
                style={[
                  styles.colorPreview,
                  { backgroundColor: colorHex, opacity: screenBrightness },
                ]}
              />
              <Text style={styles.small}>
                {screenMode ? 'Active' : 'Tap to Open'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>SOS</Text>
            <TouchableOpacity
              style={[styles.sosButton, sosOn && styles.sosOn]}
              onPress={() => setSosOn(s => !s)}
            >
              <Text style={styles.sosText}>{sosOn ? 'STOP' : 'SOS'}</Text>
            </TouchableOpacity>
            <Text style={styles.small}>Speed</Text>
            <Slider
              style={{ width: 120 }}
              minimumValue={100}
              maximumValue={1000}
              value={sosIntervalMs}
              onValueChange={v => setSosIntervalMs(Math.round(v))}
            />
          </View>
        </View>

        <View style={styles.pickerRow}>
          <View style={styles.pickerColumn}>
            <Text style={styles.panelTitle}>Color</Text>
            <ColorPicker color={color} onChange={setColor} />
          </View>

          <View style={styles.pickerColumnSmall}>
            <Text style={styles.panelTitle}>Brightness</Text>
            <Slider
              style={{ width: 140 }}
              minimumValue={0.1}
              maximumValue={1}
              value={screenBrightness}
              onValueChange={setScreenBrightness}
            />
            <Text style={styles.small}>
              {Math.round(screenBrightness * 100)}%
            </Text>
          </View>
        </View>
      </View>

      {screenMode && (
        <ScreenLight
          color={colorHex}
          brightness={screenBrightness}
          onClose={() => setScreenMode(false)}
        />
      )}
    </View>
  );
}

function PlatformSelectPermission(androidPerm: any, iosPerm: any) {
  // simple helper to select permission constant depending on platform
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Platform } = require('react-native');
  return Platform.OS === 'android' ? androidPerm : iosPerm;
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    '#' +
    [r, g, b]
      .map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

function ColorPicker({
  color,
  onChange,
}: {
  color: { r: number; g: number; b: number };
  onChange: (c: any) => void;
}) {
  // a simple hue sliders for modern look
  const [hue, setHue] = useState(0);

  useEffect(() => {
    // derive RGB from hue but preserve brightness
    const { r, g, b } = hsvToRgb(hue, 1, 1);
    onChange({ r, g, b });
  }, [hue]);

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={styles.hueBar} />
      <Slider
        style={{ width: 180 }}
        minimumValue={0}
        maximumValue={360}
        value={hue}
        minimumTrackTintColor="#fff"
        maximumTrackTintColor="#000"
        onValueChange={setHue}
      />
    </View>
  );
}

function hsvToRgb(h: number, s: number, v: number) {
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
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function ScreenLight({
  color,
  brightness,
  onClose,
}: {
  color: string;
  brightness: number;
  onClose: () => void;
}) {
  return (
    <View
      style={[
        styles.screenLight,
        { backgroundColor: color, opacity: brightness },
      ]}
    >
      <TouchableOpacity
        onPress={onClose}
        style={styles.fullClose}
        accessibilityLabel="Close screen light"
      >
        <Text style={styles.closeText}>Tap to close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#071029' },
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 30 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#9fb3d0', marginTop: 4 },
  controls: { padding: 18, flex: 1 },
  circleWrap: { alignItems: 'center', marginVertical: 20 },
  toggleButton: {
    width: 160,
    height: 160,
    borderRadius: 100,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOpacity: 0.06,
  },
  toggleOn: { backgroundColor: '#ffd166', shadowColor: '#ffd166' },
  toggleText: { fontSize: 26, fontWeight: '800', color: '#071029' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  panel: {
    width: '48%',
    backgroundColor: '#081226',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  panelTitle: { color: '#cfe9ff', fontWeight: '700', marginBottom: 8 },
  screenPreview: { alignItems: 'center' },
  colorPreview: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000',
  },
  small: { color: '#9fb3d0', marginTop: 8 },
  sosButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#2b2b2b',
  },
  sosOn: { backgroundColor: '#ff6b6b' },
  sosText: { color: '#fff', fontWeight: '700' },
  pickerRow: {
    flexDirection: 'row',
    marginTop: 18,
    justifyContent: 'space-between',
  },
  pickerColumn: {
    width: '62%',
    backgroundColor: '#081226',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  pickerColumnSmall: {
    width: '36%',
    backgroundColor: '#081226',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  hueBar: {
    height: 16,
    width: 180,
    borderRadius: 8,
    backgroundColor:
      'linear-gradient(90deg,#ff0000,#ff0,#0f0,#0ff,#00f,#f0f,#f00)',
  },
  screenLight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullClose: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 8,
  },
  closeText: { color: '#fff', fontWeight: '700' },
});

export default App;
