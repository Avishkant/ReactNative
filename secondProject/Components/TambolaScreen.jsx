import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
} from 'react-native';

// Try to load AsyncStorage if available; fall back to a no-op in-memory implementation so tests
// or environments without the native module don't fail. Install '@react-native-async-storage/async-storage'
// in the app for real persistence.
let AsyncStorage;
try {
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // fallback in-memory store (not persisted across app restarts)
  const store = new Map();
  AsyncStorage = {
    getItem: async k => (store.has(k) ? store.get(k) : null),
    setItem: async (k, v) => {
      store.set(k, v);
      return null;
    },
    removeItem: async k => {
      store.delete(k);
      return null;
    },
  };
}
import Ticket from './Ticket';
import {
  generateTicket,
  createDrawBag,
  drawNext,
  checkRowComplete,
  checkFullHouse,
} from '../utils/tambola';

// Toggle network mode (set to true to use Firebase functions/firestore as authoritative backend)
const NETWORK_MODE = false;

// Example firebase config placeholder - fill with your project's credentials when enabling NETWORK_MODE
const FIREBASE_CONFIG = null;

const TambolaScreen = () => {
  const [ticket, setTicket] = useState(generateTicket());
  const [bag, setBag] = useState(createDrawBag());
  const [called, setCalled] = useState(new Set());
  const [last, setLast] = useState(null);
  const [rowsCompleted, setRowsCompleted] = useState([false, false, false]);
  const [fullHouse, setFullHouse] = useState(false);
  const [playerId, setPlayerId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [roomIdInput, setRoomIdInput] = useState('default-room');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setRowsCompleted(checkRowComplete(ticket, called));
    setFullHouse(checkFullHouse(ticket, called));
  }, [called, ticket]);

  const onDraw = () => {
    if (NETWORK_MODE) {
      // lazy load firestore client to avoid requiring firebase in non-network builds
      (async () => {
        try {
          const { initFirebase, signInAnon, useCallDraw } = await import(
            '../utils/network/firestoreClient'
          );
          initFirebase(FIREBASE_CONFIG);
          await signInAnon();
          const callDraw = useCallDraw();
          const res = await callDraw('default-room');
          if (res && res.next) {
            setLast(res.next);
            setBag(prev => prev.slice(1));
            setCalled(prev => new Set(prev).add(res.next));
          }
        } catch (e) {
          // fallback to local draw on error
          const { next, bag: rest } = drawNext(bag);
          if (!next) return;
          setLast(next);
          setBag(rest);
          setCalled(prev => new Set(prev).add(next));
        }
      })();
      return;
    }
    const { next, bag: rest } = drawNext(bag);
    if (!next) return;
    setLast(next);
    setBag(rest);
    setCalled(prev => new Set(prev).add(next));
  };

  const toggleCalled = num => {
    setCalled(prev => {
      const nextSet = new Set(prev);
      if (nextSet.has(num)) nextSet.delete(num);
      else nextSet.add(num);
      return nextSet;
    });
  };

  const claimRow = rowIndex => {
    const rows = checkRowComplete(ticket, called);
    if (rows[rowIndex]) {
      Alert.alert('Claim', `Row ${rowIndex + 1} is complete!`);
    } else {
      Alert.alert('Claim', `Row ${rowIndex + 1} is NOT complete.`);
    }
  };

  const claimFullHouse = () => {
    if (checkFullHouse(ticket, called)) {
      Alert.alert('Claim', 'Full House! You win!');
    } else {
      Alert.alert('Claim', 'Full House not yet completed.');
    }
  };

  const onNewTicket = () => {
    setTicket(generateTicket());
    setBag(createDrawBag());
    setCalled(new Set());
    setLast(null);
    setFullHouse(false);
  };

  const resetGame = async () => {
    setTicket(generateTicket());
    setBag(createDrawBag());
    setCalled(new Set());
    setLast(null);
    setFullHouse(false);
    try {
      await AsyncStorage.removeItem(KEY_TICKET);
      await AsyncStorage.removeItem(KEY_BAG);
      await AsyncStorage.removeItem(KEY_CALLED);
      await AsyncStorage.removeItem(KEY_LAST);
    } catch (e) {
      // ignore
    }
  };

  const confirmReset = () => {
    Alert.alert(
      'Reset game',
      'Are you sure you want to reset the game? This will clear saved state.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetGame },
      ],
    );
  };

  // Persistence keys
  const KEY_TICKET = 'tambola_ticket';
  const KEY_BAG = 'tambola_bag';
  const KEY_CALLED = 'tambola_called';
  const KEY_LAST = 'tambola_last';

  // Load saved state on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [t, b, c, l] = await Promise.all([
          AsyncStorage.getItem(KEY_TICKET),
          AsyncStorage.getItem(KEY_BAG),
          AsyncStorage.getItem(KEY_CALLED),
          AsyncStorage.getItem(KEY_LAST),
        ]);
        if (!mounted) return;
        if (t) setTicket(JSON.parse(t));
        if (b) setBag(JSON.parse(b));
        if (c) setCalled(new Set(JSON.parse(c)));
        if (l) setLast(JSON.parse(l));

        // If network mode is enabled, initialize firebase and auto-join a default room for demo
        if (NETWORK_MODE) {
          try {
            const fb = await import('../utils/network/firestoreClient');
            fb.initFirebase(FIREBASE_CONFIG);
            const user = await fb.signInAnon();
            setPlayerId(user.uid || user.uid);

            // ensure ticket uploaded and listen to room
            const rid = roomIdInput || 'default-room';
            await fb.uploadTicket(
              rid,
              user.uid,
              JSON.parse(t || JSON.stringify(generateTicket())),
            );
            // If emulator is running, configure adapter to use emulator (optional)
            if (global.__FIREBASE_EMULATOR_HOST__) {
              try {
                fb.useEmulator();
              } catch (e) {}
            }
            const unsub = fb.listenRoom(rid, roomData => {
              if (!roomData) return;
              if (roomData.bag) setBag(roomData.bag);
              if (roomData.called) setCalled(new Set(roomData.called));
              if (roomData.last !== undefined) setLast(roomData.last);
              if (roomData.players) setPlayers(Object.values(roomData.players));
            });
            // store unsubscribe on AsyncStorage so we can clean up if needed
            // not persisted across restarts in this example
            // cleanup
            return () => {
              mounted = false;
              if (unsub) unsub();
            };
          } catch (e) {
            // network init failed; fall back to local state
            // console.warn('Network init failed', e)
          }
        }
      } catch (e) {
        // ignore load errors
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Save state when important pieces change
  useEffect(() => {
    AsyncStorage.setItem(KEY_TICKET, JSON.stringify(ticket)).catch(() => {});
  }, [ticket]);
  useEffect(() => {
    AsyncStorage.setItem(KEY_BAG, JSON.stringify(bag)).catch(() => {});
  }, [bag]);
  useEffect(() => {
    AsyncStorage.setItem(KEY_CALLED, JSON.stringify([...called])).catch(
      () => {},
    );
  }, [called]);
  useEffect(() => {
    AsyncStorage.setItem(KEY_LAST, JSON.stringify(last)).catch(() => {});
  }, [last]);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { flexGrow: 1 }]}
      style={{ backgroundColor: '#fbf6ff' }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Tambola</Text>
        <Text style={styles.subtitle}>Tap numbers to mark/unmark</Text>
      </View>

      <Ticket
        ticket={ticket}
        calledNumbers={called}
        onCellPress={toggleCalled}
      />

      <View style={styles.controls}>
        {NETWORK_MODE && (
          <View style={styles.networkControls}>
            <TextInput
              value={roomIdInput}
              onChangeText={setRoomIdInput}
              placeholder="room id"
              style={styles.roomInput}
            />
            <View style={styles.connectRow}>
              <Text style={styles.connectLabel}>Connected</Text>
              <Switch value={connected} onValueChange={setConnected} />
            </View>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!bag.length || fullHouse) && styles.buttonDisabled,
          ]}
          onPress={onDraw}
          disabled={!bag.length || fullHouse}
        >
          <Text style={styles.primaryButtonText}>Draw</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onNewTicket}>
          <Text style={styles.secondaryButtonText}>New Ticket</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerButton} onPress={confirmReset}>
          <Text style={styles.dangerButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <View style={styles.badgeLarge}>
            <Text style={styles.badgeLargeText}>{last || '-'}</Text>
            <Text style={styles.badgeLabel}>Last</Text>
          </View>

          <View style={styles.infoRight}>
            <View style={styles.smallRow}>
              <Text style={styles.infoLabel}>Remaining</Text>
              <View style={styles.countCircle}>
                <Text style={styles.countText}>{bag.length}</Text>
              </View>
            </View>
            <View style={[styles.smallRow, { marginTop: 8 }]}>
              <Text style={styles.infoLabel}>Full House</Text>
              <View
                style={[
                  styles.statusPill,
                  fullHouse ? styles.statusYes : styles.statusNo,
                ]}
              >
                <Text style={styles.statusText}>
                  {fullHouse ? 'YES' : 'NO'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.rowsStatus}>
          {rowsCompleted.map((v, i) => (
            <View key={i} style={styles.rowStatusItem}>
              <Text style={styles.rowLabel}>Row {i + 1}</Text>
              <View
                style={[styles.rowDot, v ? styles.rowDotOn : styles.rowDotOff]}
              />
            </View>
          ))}
        </View>

        <View style={styles.chipsRow}>
          {[...called].map(num => (
            <TouchableOpacity
              key={num}
              onPress={() => toggleCalled(num)}
              style={styles.chip}
            >
              <Text style={styles.chipText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.claims}>
          <Text style={styles.claimsTitle}>Claim Row</Text>
          <View style={styles.claimButtonsRow}>
            {rowsCompleted.map((v, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => claimRow(i)}
                disabled={!v}
                style={[
                  styles.claimButton,
                  v ? styles.claimButtonActive : styles.claimButtonDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.claimButtonText,
                    v
                      ? styles.claimButtonTextActive
                      : styles.claimButtonTextDisabled,
                  ]}
                >
                  Row {i + 1}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={claimFullHouse}
            disabled={!fullHouse}
            style={[
              styles.fullHouseButton,
              fullHouse ? styles.fullHouseActive : styles.fullHouseDisabled,
            ]}
          >
            <Text
              style={[
                styles.fullHouseText,
                fullHouse
                  ? styles.fullHouseTextActive
                  : styles.fullHouseTextDisabled,
              ]}
            >
              Claim Full House
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 0, color: '#4a148c' },
  subtitle: { fontSize: 13, color: '#6a1b9a', marginTop: 4 },
  header: {
    alignItems: 'center',
    marginBottom: 12,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  controls: { marginVertical: 12, flexDirection: 'row', gap: 8 },
  networkControls: {
    flex: 1,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    minWidth: 120,
  },
  connectRow: { flexDirection: 'row', alignItems: 'center' },
  connectLabel: { marginRight: 8, color: '#444' },
  info: {
    marginTop: 12,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeLarge: {
    backgroundColor: '#4a148c',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    width: 90,
  },
  badgeLargeText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  badgeLabel: { color: '#e1bee7', fontSize: 12, marginTop: 4 },
  infoRight: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  smallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: { color: '#666', fontSize: 13 },
  countCircle: {
    backgroundColor: '#f3e5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countText: { color: '#4a148c', fontWeight: '800' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusText: { color: '#fff', fontWeight: '800' },
  statusYes: { backgroundColor: '#2e7d32' },
  statusNo: { backgroundColor: '#bdbdbd' },
  rowsStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  rowStatusItem: { alignItems: 'center', flex: 1 },
  rowLabel: { fontSize: 12, color: '#555', marginBottom: 6 },
  rowDot: { width: 18, height: 18, borderRadius: 9 },
  rowDotOn: { backgroundColor: '#2e7d32' },
  rowDotOff: { backgroundColor: '#e0e0e0' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  chip: {
    backgroundColor: '#7b1fa2',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    margin: 4,
  },
  chipText: { fontSize: 12, color: '#fff' },
  claims: { marginTop: 14 },
  claimsTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  claimButtonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  claimButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
    alignItems: 'center',
  },
  claimButtonActive: { backgroundColor: '#1976d2' },
  claimButtonDisabled: { backgroundColor: '#eeeeee' },
  claimButtonText: { fontWeight: '800' },
  claimButtonTextActive: { color: '#fff' },
  claimButtonTextDisabled: { color: '#999' },
  fullHouseButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  fullHouseActive: { backgroundColor: '#d32f2f' },
  fullHouseDisabled: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  fullHouseText: { fontWeight: '800' },
  fullHouseTextActive: { color: '#fff' },
  fullHouseTextDisabled: { color: '#999' },
  primaryButton: {
    backgroundColor: '#6a1b9a',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: { color: '#4a148c', fontWeight: '700' },
  dangerButton: {
    backgroundColor: '#ff5252',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  dangerButtonText: { color: '#fff', fontWeight: '700' },
  buttonDisabled: { opacity: 0.45 },
});

export default TambolaScreen;
