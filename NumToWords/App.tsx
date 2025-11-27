/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  Share,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import numberToWords from './src/utils/numberToWords';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { Modal } from 'react-native';
import computeDenominations from './src/utils/denominations';

function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [history, setHistory] = useState<
    Array<{ input: string; result: string; when: number }>
  >([]);
  const [denominations, setDenominations] = useState<Array<any>>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [numberingSystem, setNumberingSystem] = useState<'indian' | 'western'>(
    'indian',
  );
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [mode, setMode] = useState<'words' | 'denom'>('words');
  const [denomMode, setDenomMode] = useState<'breakdown' | 'counts'>(
    'breakdown',
  );
  const [denomCounts, setDenomCounts] = useState<Record<number, string>>({});
  // ensure breakdown is computed when switching to denom mode or when input/currency changes
  useEffect(() => {
    if (mode === 'denom' && denomMode === 'breakdown') {
      const amt = parseFloat(String(input || '0'));
      if (!isNaN(amt) && isFinite(amt)) {
        const den = computeDenominations(amt, currency);
        setDenominations(den);
      } else {
        setDenominations([]);
      }
    }
  }, [mode, denomMode, input, currency]);
  const anim = useRef(new Animated.Value(menuVisible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: menuVisible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [menuVisible, anim]);

  function convert() {
    try {
      const out = numberToWords(input || '0', {
        system: numberingSystem,
        lang: language,
      });
      setResult(out);
      const entry = { input: input || '0', result: out, when: Date.now() };
      const newHistory = [entry, ...history].slice(0, 50);
      setHistory(newHistory);
      AsyncStorage.setItem('@ntw_history', JSON.stringify(newHistory)).catch(
        () => {},
      );
      // compute denominations (if numeric)
      const amt = parseFloat(String(input || '0'));
      if (!isNaN(amt) && isFinite(amt)) {
        const den = computeDenominations(amt, currency);
        setDenominations(den);
      } else {
        setDenominations([]);
      }
    } catch {
      setResult('Error');
    }
  }

  function clear() {
    setInput('');
    setResult('');
  }

  async function onShare() {
    try {
      await Share.share({ message: result || 'No result' });
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    AsyncStorage.getItem('@ntw_history')
      .then(v => {
        if (v) {
          try {
            setHistory(JSON.parse(v));
          } catch {
            setHistory([]);
          }
        }
      })
      .catch(() => {});
    // load settings
    AsyncStorage.getItem('@ntw_settings')
      .then(s => {
        if (s) {
          try {
            const j = JSON.parse(s);
            if (j.language) setLanguage(j.language);
            if (j.numberingSystem) setNumberingSystem(j.numberingSystem);
            if (j.currency) setCurrency(j.currency);
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {});
  }, []);

  function pasteHistory(item: { input: string; result: string; when: number }) {
    setInput(item.input);
    setResult(item.result);
  }

  function getDenomUnits(cur: 'INR' | 'USD') {
    if (cur === 'INR') {
      return [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1].map(v => v * 100);
    }
    return [100, 50, 20, 10, 5, 2, 1].map(v => v * 100).concat([25, 10, 5, 1]);
  }

  function updateDenomCount(unit: number, value: string) {
    const next = { ...denomCounts };
    // allow only digits
    const sanitized = value.replace(/[^0-9]/g, '');
    if (sanitized === '') delete next[unit];
    else next[unit] = sanitized;
    setDenomCounts(next);
  }

  // Recompute denominations when in breakdown mode or when user switches currency/input
  useEffect(() => {
    if (mode === 'denom' && denomMode === 'breakdown') {
      const amt = parseFloat(String(input || '0'));
      if (!isNaN(amt) && isFinite(amt)) {
        const den = computeDenominations(amt, currency);
        setDenominations(den);
      } else {
        setDenominations([]);
      }
    }
  }, [mode, denomMode, input, currency]);

  // totals are computed live in render for the counts UI

  function removeHistoryAt(index: number) {
    const nh = history.slice();
    nh.splice(index, 1);
    setHistory(nh);
    AsyncStorage.setItem('@ntw_history', JSON.stringify(nh)).catch(() => {});
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            style={styles.menuButton}
          >
            <View style={styles.hamburgerWrap}>
              <Animated.View
                style={[
                  styles.hamburgerBar,
                  {
                    transform: [
                      {
                        translateY: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 6],
                        }),
                      },
                      {
                        rotate: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '45deg'],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.hamburgerBar,
                  {
                    opacity: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    }),
                    transform: [
                      {
                        scaleX: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0.8],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.hamburgerBar,
                  {
                    transform: [
                      {
                        translateY: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -6],
                        }),
                      },
                      {
                        rotate: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '-45deg'],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Number To Words</Text>
          <View style={styles.fill} />
        </View>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* <Text style={styles.subtitle}>Type a number and press Convert</Text> */}

          {/* Main mode toggle - moved to top area visually */}
          <View style={styles.toggleRowTop}>
            <TouchableOpacity
              onPress={() => setMode('words')}
              style={[
                styles.toggleButtonLarge,
                mode === 'words' && styles.toggleLeftActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleTextLarge,
                  mode === 'words' && styles.toggleTextActiveLarge,
                ]}
              >
                NUMBER TO WORD
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setMode('denom');
                setDenomMode('counts');
                // reset counts when entering denomination mode
                setDenomCounts({});
                // compute breakdown denominations from current input (for quick view)
                const amt = parseFloat(String(input || '0'));
                if (!isNaN(amt) && isFinite(amt)) {
                  const den = computeDenominations(amt, currency);
                  setDenominations(den);
                } else {
                  setDenominations([]);
                }
              }}
              style={[
                styles.toggleButtonLarge,
                mode === 'denom' && styles.toggleRightActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleTextLarge,
                  mode === 'denom' && styles.toggleTextActiveLarge,
                ]}
              >
                CASH DENOMINATION
              </Text>
            </TouchableOpacity>
          </View>

          {/* compute denominations automatically when in breakdown mode or when input/currency changes */}
          {/** Recompute when user switches to denom+breakdown or changes input/currency */}
          {/* effect-like immediate check: useEffect below is more robust */}

          {mode === 'words' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter number e.g. 12345.67"
                keyboardType="numeric"
                value={input}
                onChangeText={setInput}
                returnKeyType="done"
              />

              <View style={styles.row}>
                <Button title="Convert" onPress={convert} />
                <View style={styles.spacer} />
                <Button title="Clear" onPress={clear} color="#999" />
              </View>
            </>
          )}

          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Result</Text>
            {mode === 'words' ? (
              <>
                <Text selectable style={styles.resultText}>
                  {result || '-'}
                </Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => {
                      if (result) {
                        try {
                          Clipboard.setString(result);
                        } catch {}
                      }
                    }}
                    accessibilityLabel="Copy result"
                  >
                    <Text style={styles.iconEmoji}>Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={onShare}
                    accessibilityLabel="Share result"
                  >
                    <Text style={styles.iconEmoji}>Share</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View>
                {denomMode === 'breakdown' ? (
                  denominations.length === 0 ? (
                    <Text style={styles.empty}>No denominations available</Text>
                  ) : (
                    <View>
                      {/* compute total from denominations and show it */}
                      {(() => {
                        let totalSmallest = 0;
                        for (const d of denominations) {
                          totalSmallest += d.unitValue * d.count;
                        }
                        const totalValRaw = totalSmallest / 100;
                        const totalValue =
                          totalSmallest % 100 === 0
                            ? String(totalSmallest / 100)
                            : totalValRaw.toFixed(2);
                        let totalWords = '';
                        try {
                          const totalFull = numberToWords(String(totalValue), {
                            system: numberingSystem,
                            lang: language,
                          });
                          const integerPartStr = String(
                            Math.floor(totalSmallest / 100),
                          );
                          const integerWords = numberToWords(integerPartStr, {
                            system: numberingSystem,
                            lang: language,
                          });
                          const currencyWord =
                            language === 'hi'
                              ? currency === 'INR'
                                ? 'रुपये'
                                : 'डॉलर'
                              : currency === 'INR'
                              ? 'rupees'
                              : 'dollars';
                          if (
                            integerWords &&
                            totalFull.startsWith(integerWords)
                          ) {
                            totalWords = (
                              integerWords +
                              ' ' +
                              currencyWord +
                              totalFull.slice(integerWords.length)
                            ).trim();
                          } else {
                            totalWords = (
                              totalFull +
                              ' ' +
                              currencyWord
                            ).trim();
                          }
                        } catch {
                          totalWords = '';
                        }

                        return (
                          <View style={styles.topTotalRow}>
                            <Text style={styles.topTotalLabel}>Total</Text>
                            <View style={styles.topTotalRight}>
                              <Text style={styles.topTotalValue}>
                                {totalValue}
                              </Text>
                              <Text style={styles.topTotalWords}>
                                {totalWords}
                              </Text>
                            </View>
                          </View>
                        );
                      })()}

                      {denominations.map(d => (
                        <View key={d.label} style={styles.denomRow}>
                          <Text style={styles.denomLabel}>{d.label}</Text>
                          <Text style={styles.denomCount}>x {d.count}</Text>
                        </View>
                      ))}
                    </View>
                  )
                ) : (
                  <View>
                    {(() => {
                      const units = getDenomUnits(currency);
                      let totalPaise = 0;
                      for (const u of units) {
                        const c = parseInt(denomCounts[u] || '0', 10) || 0;
                        totalPaise += c * u;
                      }
                      const totalValueRaw = totalPaise / 100;
                      const totalValue =
                        totalPaise % 100 === 0
                          ? String(totalPaise / 100)
                          : totalValueRaw.toFixed(2);
                      let totalWords = '';
                      try {
                        const totalStr = String(totalValue);
                        const totalFull = numberToWords(totalStr, {
                          system: numberingSystem,
                          lang: language,
                        });
                        const integerPartStr = String(
                          Math.floor(totalPaise / 100),
                        );
                        const integerWords = numberToWords(integerPartStr, {
                          system: numberingSystem,
                          lang: language,
                        });
                        const currencyWord =
                          language === 'hi'
                            ? currency === 'INR'
                              ? 'रुपये'
                              : 'डॉलर'
                            : currency === 'INR'
                            ? 'rupees'
                            : 'dollars';

                        if (
                          integerWords &&
                          totalFull.startsWith(integerWords)
                        ) {
                          // Insert currency word after the integer words, keep fractional suffix (if any)
                          totalWords = (
                            integerWords +
                            ' ' +
                            currencyWord +
                            totalFull.slice(integerWords.length)
                          ).trim();
                        } else {
                          totalWords = (totalFull + ' ' + currencyWord).trim();
                        }
                      } catch {
                        totalWords = '';
                      }

                      return (
                        <View style={styles.topTotalRow}>
                          <Text style={styles.topTotalLabel}>Total</Text>
                          <View style={styles.topTotalRight}>
                            <Text style={styles.topTotalValue}>
                              {totalValue}
                            </Text>
                            <Text style={styles.topTotalWords}>
                              {totalWords}
                            </Text>
                          </View>
                        </View>
                      );
                    })()}

                    {getDenomUnits(currency).map(unit => {
                      const label =
                        unit >= 100
                          ? currency === 'INR'
                            ? `₹${unit / 100}`
                            : `$${unit / 100}`
                          : `${unit} paise`;
                      const count = parseInt(denomCounts[unit] || '0', 10) || 0;
                      const rowTotal = (count * unit) / 100;
                      return (
                        <View key={String(unit)} style={styles.denomCountRow}>
                          <Text style={styles.denomLabelSmall}>{label}</Text>
                          <Text style={styles.multiplySign}>×</Text>
                          <TextInput
                            style={styles.countInput}
                            value={denomCounts[unit] || ''}
                            onChangeText={v => {
                              updateDenomCount(unit, v);
                            }}
                            keyboardType="numeric"
                            placeholder="0"
                          />
                          <Text style={styles.denomTotalText}>
                            {rowTotal.toFixed(2)}
                          </Text>
                        </View>
                      );
                    })}

                    <View style={styles.countsActionsRow}>
                      <TouchableOpacity
                        onPress={() => {
                          setDenomCounts({});
                        }}
                        style={[styles.menuCancel, styles.clearCountsButton]}
                      >
                        <Text>Reset</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {mode === 'words' && (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>History</Text>
              {history.length === 0 ? (
                <Text style={styles.empty}>No history yet</Text>
              ) : (
                history.map((h, idx) => (
                  <View key={h.when.toString()} style={styles.historyRow}>
                    <TouchableOpacity
                      style={styles.historyContent}
                      onPress={() => pasteHistory(h)}
                    >
                      <Text style={styles.historyInput}>{h.input}</Text>
                      <Text style={styles.historyResult}>{h.result}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeHistoryAt(idx)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteEmoji}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          <Modal
            visible={menuVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setMenuVisible(false)}
          >
            <View style={styles.menuOverlay}>
              <TouchableOpacity
                style={styles.modalBackdrop}
                onPress={() => setMenuVisible(false)}
              />
              <View style={styles.menuContent}>
                <View style={styles.menuHeader}>
                  <View style={styles.menuAvatar}>
                    <Text style={styles.menuAvatarText}>NTW</Text>
                  </View>
                  <Text style={styles.menuTitle}>Number To Words</Text>
                  <TouchableOpacity
                    onPress={() => setMenuVisible(false)}
                    style={styles.closeButton}
                    accessibilityLabel="Close menu"
                  >
                    <Text style={styles.closeIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.menuSectionTitle}>Settings</Text>
                <Text style={styles.sectionSpacingSmall}>Language</Text>
                <View style={styles.menuRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setLanguage('en');
                      AsyncStorage.setItem(
                        '@ntw_settings',
                        JSON.stringify({
                          language: 'en',
                          numberingSystem,
                          currency,
                        }),
                      ).catch(() => {});
                    }}
                    style={
                      language === 'en'
                        ? styles.menuPillActive
                        : styles.menuPill
                    }
                  >
                    <Text
                      style={
                        language === 'en'
                          ? styles.pillTextActive
                          : styles.pillText
                      }
                    >
                      English
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setLanguage('hi');
                      AsyncStorage.setItem(
                        '@ntw_settings',
                        JSON.stringify({
                          language: 'hi',
                          numberingSystem,
                          currency,
                        }),
                      ).catch(() => {});
                    }}
                    style={
                      language === 'hi'
                        ? styles.menuPillActive
                        : styles.menuPill
                    }
                  >
                    <Text
                      style={
                        language === 'hi'
                          ? styles.pillTextActive
                          : styles.pillText
                      }
                    >
                      हिंदी
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionSpacing}>Numbering System</Text>
                <View style={styles.menuRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setNumberingSystem('indian');
                      AsyncStorage.setItem(
                        '@ntw_settings',
                        JSON.stringify({
                          language,
                          numberingSystem: 'indian',
                          currency,
                        }),
                      ).catch(() => {});
                    }}
                    style={
                      numberingSystem === 'indian'
                        ? styles.menuPillActive
                        : styles.menuPill
                    }
                  >
                    <Text
                      style={
                        numberingSystem === 'indian'
                          ? styles.pillTextActive
                          : styles.pillText
                      }
                    >
                      Indian
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setNumberingSystem('western');
                      AsyncStorage.setItem(
                        '@ntw_settings',
                        JSON.stringify({
                          language,
                          numberingSystem: 'western',
                          currency,
                        }),
                      ).catch(() => {});
                    }}
                    style={
                      numberingSystem === 'western'
                        ? styles.menuPillActive
                        : styles.menuPill
                    }
                  >
                    <Text
                      style={
                        numberingSystem === 'western'
                          ? styles.pillTextActive
                          : styles.pillText
                      }
                    >
                      Western
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionSpacing}>Currency</Text>
                <View style={styles.menuRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setCurrency('INR');
                      AsyncStorage.setItem(
                        '@ntw_settings',
                        JSON.stringify({
                          language,
                          numberingSystem,
                          currency: 'INR',
                        }),
                      ).catch(() => {});
                    }}
                    style={
                      currency === 'INR'
                        ? styles.menuPillActive
                        : styles.menuPill
                    }
                  >
                    <Text
                      style={
                        currency === 'INR'
                          ? styles.pillTextActive
                          : styles.pillText
                      }
                    >
                      INR
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setCurrency('USD');
                      AsyncStorage.setItem(
                        '@ntw_settings',
                        JSON.stringify({
                          language,
                          numberingSystem,
                          currency: 'USD',
                        }),
                      ).catch(() => {});
                    }}
                    style={
                      currency === 'USD'
                        ? styles.menuPillActive
                        : styles.menuPill
                    }
                  >
                    <Text
                      style={
                        currency === 'USD'
                          ? styles.pillTextActive
                          : styles.pillText
                      }
                    >
                      USD
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.sectionSpacingLarge}>
                  <TouchableOpacity
                    onPress={() => {
                      setHistory([]);
                      AsyncStorage.removeItem('@ntw_history').catch(() => {});
                      setMenuVisible(false);
                    }}
                    style={styles.menuAction}
                  >
                    <Text
                      style={[styles.menuActionIcon, styles.menuActionEmoji]}
                    >
                      🗑️
                    </Text>
                    <Text style={styles.menuActionText}>Clear History</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      // simple about placeholder
                      setMenuVisible(false);
                      setTimeout(() => {
                        try {
                          Share.share({
                            message:
                              'Number To Words — convert numbers to English words.',
                          });
                        } catch {}
                      }, 200);
                    }}
                    style={styles.menuActionSecondary}
                  >
                    <Text
                      style={[styles.menuActionIcon, styles.menuActionEmoji]}
                    >
                      ℹ️
                    </Text>
                    <Text style={styles.menuActionText}>About / Share App</Text>
                  </TouchableOpacity>
                </View>

                {/* <View style={styles.menuActionsRow}>
                  <TouchableOpacity
                    onPress={() => setMenuVisible(false)}
                    style={styles.menuCancel}
                  >
                    <Text>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      saveSettings();
                      setMenuVisible(false);
                    }}
                    style={styles.menuSave}
                  >
                    <Text style={styles.menuSaveText}>Save</Text>
                  </TouchableOpacity>
                </View> */}
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20, alignItems: 'stretch' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#666', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  spacer: { width: 12 },
  resultBox: { backgroundColor: '#f7f7f7', padding: 12, borderRadius: 8 },
  resultLabel: { fontSize: 12, color: '#666', marginBottom: 6 },
  resultText: { fontSize: 18, color: '#111' },
  actions: { flexDirection: 'row', marginTop: 12 },
  iconButton: {
    marginRight: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { color: '#fff' },
  historySection: { marginTop: 18 },
  historyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  empty: { color: '#888' },
  historyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  historyContent: {
    flex: 1,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  historyInput: { fontWeight: '600' },
  historyResult: { color: '#444' },
  deleteButton: { marginLeft: 8, padding: 6 },
  deleteText: { color: '#c00', fontSize: 18 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0A84FF',
    marginBottom: 0,
    borderRadius: 0,
    width: '100%',
    paddingTop: Platform.OS === 'android' ? 12 : 14,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  fill: { flex: 1 },
  toggleRowTop: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  toggleButtonLarge: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f2f2',
  },
  toggleLeftActive: { backgroundColor: '#ff8a80' },
  toggleRightActive: { backgroundColor: '#0b5960' },
  toggleTextLarge: { color: '#333', fontWeight: '700' },
  toggleTextActiveLarge: { color: '#fff' },
  denomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  denomLabel: { color: '#111' },
  denomCount: { color: '#111', fontWeight: '600' },
  /* counts-mode styles */
  topTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  topTotalLabel: { fontSize: 18, color: '#444' },
  topTotalValue: { fontSize: 22, fontWeight: '700' },
  topTotalRight: { alignItems: 'flex-end' },
  topTotalWords: { color: '#666', marginTop: 4, fontSize: 13 },
  denomCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  denomLabelSmall: { width: 80, color: '#111' },
  multiplySign: { width: 20, textAlign: 'center', color: '#333' },
  countInput: {
    width: 80,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 6,
    borderRadius: 6,
    textAlign: 'center',
  },
  denomTotalText: {
    flex: 1,
    textAlign: 'right',
    color: '#111',
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    zIndex: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  /* Menu / hamburger styles */
  menuOverlay: { flex: 1, justifyContent: 'center', alignItems: 'flex-start' },
  menuContent: {
    width: '80%',
    height: '100%',
    backgroundColor: '#fff',
    padding: 18,
    paddingTop: 28,
    borderRightWidth: 1,
    borderRightColor: '#eee',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  menuTitle: { fontSize: 18, fontWeight: '700' },
  menuSectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  menuRow: { flexDirection: 'row', marginTop: 6 },
  menuPill: {
    closeIcon: { fontSize: 18, color: '#333', fontWeight: '700' },
    marginRight: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  menuPillActive: {
    marginRight: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#0A84FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0A84FF',
  },
  pillText: { color: '#000' },
  pillTextActive: { color: '#fff' },
  sectionSpacingSmall: { marginTop: 8 },
  sectionSpacing: { marginTop: 12 },
  sectionSpacingLarge: { marginTop: 18 },
  menuAction: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f6',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuActionSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#efefef',
    borderRadius: 10,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuActionText: { color: '#333', fontWeight: '600' },
  menuActionIcon: { marginRight: 10 },
  menuActionEmoji: { fontSize: 16 },
  iconEmoji: { fontSize: 18, color: '#fff' },
  deleteEmoji: { fontSize: 18 },

  menuActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
  },
  menuCancel: { marginRight: 10 },
  menuSave: {
    backgroundColor: '#0A84FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  menuSaveText: { color: '#fff' },
  menuButton: {
    marginRight: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
  menuIcon: { marginTop: 1, backgroundColor: 'transparent' },
  hamburgerWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerBar: {
    width: 18,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 2,
    marginVertical: 2,
  },
  menuAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  menuAvatarText: { color: '#fff', fontWeight: '700' },
});

export default App;
