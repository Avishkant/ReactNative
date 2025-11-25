import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from '../i18n/i18n';

type RootStackParamList = {
  Home: undefined;
  SimpleInterest: undefined;
  CompoundInterest: undefined;
  Records: undefined;
  Settings: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [menuVisible, setMenuVisible] = useState(false);
  const { width: SCREEN_W } = Dimensions.get('window');
  // slimmer menu: ~66% of screen width, max 320
  const PANEL_W = Math.min(320, Math.round(SCREEN_W * 0.66));
  const anim = useRef(new Animated.Value(-PANEL_W)).current;

  function openMenu() {
    setMenuVisible(true);
    Animated.timing(anim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }

  function closeMenu() {
    Animated.timing(anim, {
      toValue: -PANEL_W,
      duration: 220,
      useNativeDriver: true,
      easing: Easing.in(Easing.quad),
    }).start(() => setMenuVisible(false));
  }

  function navAndClose(route: string) {
    (navigation as any).navigate(route as any);
    closeMenu();
  }

  return (
    <View style={styles.container}>
      {/* Custom header with hamburger (controls in-screen overlay) */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburger} onPress={openMenu}>
          <Text style={styles.hamburgerIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('home_title')}</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>{t('Welcome!')}</Text>
        <Text style={styles.heroSubtitle}>{t('Let’s get started')}</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={() => navigation.navigate('SimpleInterest')}
        >
          <Text style={styles.buttonText}>{t('simple_interest')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonAccent]}
          onPress={() => navigation.navigate('CompoundInterest')}
        >
          <Text style={styles.buttonText}>{t('compound_interest')}</Text>
        </TouchableOpacity>
      </View>

      {/* In-screen overlay menu (slides above home without black backdrop) */}
      {menuVisible ? (
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Animated.View
              style={[
                styles.overlayPanel,
                { width: PANEL_W, transform: [{ translateX: anim }] },
              ]}
            >
              <View style={styles.menuHeaderRow}>
                <Text style={styles.menuTitle}>{t('Menu')}</Text>
                <TouchableOpacity style={styles.menuClose} onPress={closeMenu}>
                  <Text style={styles.menuCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.menuItemButton}
                onPress={() => navAndClose('SimpleInterest')}
                activeOpacity={0.8}
              >
                <Text style={styles.menuItemIcon}>💰</Text>
                <Text style={styles.menuItemText}>{t('simple_interest')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItemButton}
                onPress={() => navAndClose('CompoundInterest')}
                activeOpacity={0.8}
              >
                <Text style={styles.menuItemIcon}>📈</Text>
                <Text style={styles.menuItemText}>
                  {t('compound_interest')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItemButton}
                onPress={() => navAndClose('Records')}
                activeOpacity={0.8}
              >
                <Text style={styles.menuItemIcon}>📜</Text>
                <Text style={styles.menuItemText}>{t('records')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItemButton}
                onPress={() => navAndClose('Settings')}
                activeOpacity={0.8}
              >
                <Text style={styles.menuItemIcon}>⚙️</Text>
                <Text style={styles.menuItemText}>{t('settings')}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f7fb',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  hamburger: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerIcon: { fontSize: 22, color: '#0b4b7a' },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: '#0b4b7a',
  },
  heroCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#0d3f63' },
  heroSubtitle: { marginTop: 8, color: '#577a98' },
  buttons: { width: '100%' },
  button: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonPrimary: { backgroundColor: '#1976d2' },
  buttonAccent: { backgroundColor: '#0288d1' },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d6e6f6',
  },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '700' },

  spacer: { width: 40 },
  buttonTextGhost: { color: '#0b4b7a' },
  overlayPanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 18,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  menuHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  menuClose: { padding: 6, borderRadius: 6 },
  menuCloseText: { color: '#475569', fontSize: 16 },
  menuItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  menuItemIcon: { fontSize: 18, marginRight: 12 },
  menuItemText: { fontSize: 16, color: '#0f172a', fontWeight: '600' },
});
