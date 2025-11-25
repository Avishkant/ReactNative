import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from '../i18n/i18n'; // Assuming standard i18n setup

// --- Configuration ---
const { width: SCREEN_W } = Dimensions.get('window');
// slightly slimmer and modern
const PANEL_WIDTH = Math.min(320, Math.round(SCREEN_W * 0.66));
const DURATION_IN = 300;
const DURATION_OUT = 220;

// --- TypeScript Definitions (Retained) ---
type RootStackParamList = {
  Home: undefined;
  SimpleInterest: undefined;
  CompoundInterest: undefined;
  Records: undefined;
  Settings: undefined;
  MenuModal: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'MenuModal'>;

// --- Component ---
export default function MenuModal({ navigation }: Props) {
  const { t } = useTranslation();
  // Animation value starts off-screen to the left
  const anim = useRef(new Animated.Value(-PANEL_WIDTH)).current;

  // --- Animation Logic ---

  useEffect(() => {
    // Slide in
    Animated.timing(anim, {
      toValue: 0,
      duration: DURATION_IN,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [anim]);

  function closeAnimated() {
    // Slide out then go back
    Animated.timing(anim, {
      toValue: -PANEL_WIDTH,
      duration: DURATION_OUT,
      useNativeDriver: true,
      easing: Easing.in(Easing.quad),
    }).start(() => {
      navigation.goBack();
    });
  }

  function navAndClose(route: keyof RootStackParamList | string) {
    // Animate out, then navigate so Home remains visible during animation
    Animated.timing(anim, {
      toValue: -PANEL_WIDTH,
      duration: DURATION_OUT,
      useNativeDriver: true,
      easing: Easing.in(Easing.quad),
    }).start(() => {
      (navigation as any).navigate(route as any);
      navigation.goBack();
    });
  }

  // Backdrop opacity interpolates smoothly from anim value
  const backdropOpacity = anim.interpolate({
    inputRange: [-PANEL_WIDTH, 0],
    outputRange: [0, 0.22], // light translucent backdrop so home stays visible
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.outer}>
      {/* Backdrop (light, closes menu on press) */}
      <TouchableWithoutFeedback onPress={closeAnimated}>
        <Animated.View
          accessible={false}
          accessibilityRole="button"
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        />
      </TouchableWithoutFeedback>

      {/* Sliding Menu Panel */}
      <Animated.View
        style={[
          styles.panel,
          { width: PANEL_WIDTH, transform: [{ translateX: anim }] },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>VI</Text>
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.title}>{t('menu') || 'Menu'}</Text>
            <Text style={styles.subtitle}>
              {t('home_title') || 'Quick links'}
            </Text>
          </View>
          <Pressable
            onPress={closeAnimated}
            style={({ pressed }) => [
              styles.iconClose,
              pressed && { opacity: 0.7 },
            ]}
            accessibilityLabel="Close menu"
          >
            <Text style={styles.iconCloseText}>✕</Text>
          </Pressable>
        </View>

        {/* Navigation Items — Pressable with icon circles */}
        <View style={styles.itemsWrap}>
          <Pressable
            onPress={() => navAndClose('SimpleInterest')}
            style={({ pressed }) => [
              styles.itemButton,
              pressed && styles.itemPressed,
            ]}
            accessibilityRole="button"
          >
            <View style={[styles.itemIcon, styles.itemIconGreen]}>
              <Text style={styles.itemEmojiGreen}>💰</Text>
            </View>
            <Text style={styles.itemText}>
              {t('simple_interest') || 'Simple Interest'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navAndClose('CompoundInterest')}
            style={({ pressed }) => [
              styles.itemButton,
              pressed && styles.itemPressed,
            ]}
            accessibilityRole="button"
          >
            <View style={[styles.itemIcon, styles.itemIconPurple]}>
              <Text style={styles.itemEmojiPurple}>📈</Text>
            </View>
            <Text style={styles.itemText}>
              {t('compound_interest') || 'Compound Interest'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navAndClose('Records')}
            style={({ pressed }) => [
              styles.itemButton,
              pressed && styles.itemPressed,
            ]}
            accessibilityRole="button"
          >
            <View style={[styles.itemIcon, styles.itemIconAmber]}>
              <Text style={styles.itemEmojiAmber}>📜</Text>
            </View>
            <Text style={styles.itemText}>{t('records') || 'Records'}</Text>
          </Pressable>

          <Pressable
            onPress={() => navAndClose('Settings')}
            style={({ pressed }) => [
              styles.itemButton,
              pressed && styles.itemPressed,
            ]}
            accessibilityRole="button"
          >
            <View style={[styles.itemIcon, styles.itemIconBlue]}>
              <Text style={styles.itemEmojiBlue}>⚙️</Text>
            </View>
            <Text style={styles.itemText}>{t('settings') || 'Settings'}</Text>
          </Pressable>
        </View>

        <View style={styles.flexFill} />

        <Pressable
          onPress={closeAnimated}
          style={({ pressed }) => [styles.close, pressed && { opacity: 0.8 }]}
          accessibilityLabel="Close menu bottom"
        >
          <Text style={styles.closeText}>{t ? t('close') : 'Close'}</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

// --- Stylesheet (Modern Dark Panel) ---
const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#1E1E1E', // Dark background for contrast
    paddingVertical: 30,
    paddingHorizontal: 25,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900', // Extra bold title
    color: '#F0F0F0', // Light text color
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
    paddingBottom: 10,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0b4b7a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: { color: '#fff', fontWeight: '900' },

  close: {
    marginTop: 15,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#3A3A3A',
  },
  closeText: {
    color: '#00B8D4', // Teal accent color
    fontWeight: '700',
    fontSize: 16,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  headerMeta: { flex: 1, marginLeft: 12 },
  subtitle: { color: '#B3C7CF', fontSize: 12, marginTop: 2 },
  iconClose: { padding: 6 },
  iconCloseText: { color: '#B3C7CF', fontSize: 18 },
  itemsWrap: { marginTop: 8 },
  itemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginBottom: 8,
  },
  itemPressed: { backgroundColor: 'rgba(0,0,0,0.03)' },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemIconGreen: { backgroundColor: '#E6F9F5' },
  itemIconPurple: { backgroundColor: '#F3E8FF' },
  itemIconAmber: { backgroundColor: '#FFF8E1' },
  itemIconBlue: { backgroundColor: '#E3F2FD' },
  itemEmojiGreen: { color: '#00796B', fontSize: 18 },
  itemEmojiPurple: { color: '#6A1B9A', fontSize: 18 },
  itemEmojiAmber: { color: '#FF8F00', fontSize: 18 },
  itemEmojiBlue: { color: '#1976D2', fontSize: 18 },
  itemText: { fontSize: 16, color: '#0f172a', fontWeight: '700' },
  flexFill: { flex: 1 },
});
