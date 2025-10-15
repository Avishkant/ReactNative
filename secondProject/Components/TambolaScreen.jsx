import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Button } from 'react-native'

// Try to load AsyncStorage if available; fall back to a no-op in-memory implementation so tests
// or environments without the native module don't fail. Install '@react-native-async-storage/async-storage'
// in the app for real persistence.
let AsyncStorage
try {
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require
  AsyncStorage = require('@react-native-async-storage/async-storage').default
} catch (e) {
  // fallback in-memory store (not persisted across app restarts)
  const store = new Map()
  AsyncStorage = {
    getItem: async (k) => (store.has(k) ? store.get(k) : null),
    setItem: async (k, v) => { store.set(k, v); return null },
    removeItem: async (k) => { store.delete(k); return null },
  }
}
import Ticket from './Ticket'
import { generateTicket, createDrawBag, drawNext, checkRowComplete, checkFullHouse } from '../utils/tambola'

const TambolaScreen = () => {
  const [ticket, setTicket] = useState(generateTicket())
  const [bag, setBag] = useState(createDrawBag())
  const [called, setCalled] = useState(new Set())
  const [last, setLast] = useState(null)
  const [rowsCompleted, setRowsCompleted] = useState([false, false, false])
  const [fullHouse, setFullHouse] = useState(false)

  useEffect(() => {
    setRowsCompleted(checkRowComplete(ticket, called))
    setFullHouse(checkFullHouse(ticket, called))
  }, [called, ticket])

  const onDraw = () => {
    const { next, bag: rest } = drawNext(bag)
    if (!next) return
    setLast(next)
    setBag(rest)
    setCalled(prev => new Set(prev).add(next))
  }

  const toggleCalled = (num) => {
    setCalled(prev => {
      const nextSet = new Set(prev)
      if (nextSet.has(num)) nextSet.delete(num)
      else nextSet.add(num)
      return nextSet
    })
  }

  const claimRow = (rowIndex) => {
    const rows = checkRowComplete(ticket, called)
    if (rows[rowIndex]) {
      Alert.alert('Claim', `Row ${rowIndex + 1} is complete!`)
      } else {
      Alert.alert('Claim', `Row ${rowIndex + 1} is NOT complete.`)
    }
  }

  const claimFullHouse = () => {
    if (checkFullHouse(ticket, called)) {
      Alert.alert('Claim', 'Full House! You win!')
    } else {
      Alert.alert('Claim', 'Full House not yet completed.')
    }
  }

  const onNewTicket = () => {
    setTicket(generateTicket())
    setBag(createDrawBag())
    setCalled(new Set())
    setLast(null)
    setFullHouse(false)
  }

  const resetGame = async () => {
    setTicket(generateTicket())
    setBag(createDrawBag())
    setCalled(new Set())
    setLast(null)
    setFullHouse(false)
    try {
      await AsyncStorage.removeItem(KEY_TICKET)
      await AsyncStorage.removeItem(KEY_BAG)
      await AsyncStorage.removeItem(KEY_CALLED)
      await AsyncStorage.removeItem(KEY_LAST)
    } catch (e) {
      // ignore
    }
  }

  const confirmReset = () => {
    Alert.alert('Reset game', 'Are you sure you want to reset the game? This will clear saved state.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetGame },
    ])
  }

  // Persistence keys
  const KEY_TICKET = 'tambola_ticket'
  const KEY_BAG = 'tambola_bag'
  const KEY_CALLED = 'tambola_called'
  const KEY_LAST = 'tambola_last'

  // Load saved state on mount
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [t, b, c, l] = await Promise.all([
          AsyncStorage.getItem(KEY_TICKET),
          AsyncStorage.getItem(KEY_BAG),
          AsyncStorage.getItem(KEY_CALLED),
          AsyncStorage.getItem(KEY_LAST),
        ])
        if (!mounted) return
        if (t) setTicket(JSON.parse(t))
        if (b) setBag(JSON.parse(b))
        if (c) setCalled(new Set(JSON.parse(c)))
        if (l) setLast(JSON.parse(l))
      } catch (e) {
        // ignore load errors
        // console.warn('Failed to load tambola state', e)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Save state when important pieces change
  useEffect(() => {
    AsyncStorage.setItem(KEY_TICKET, JSON.stringify(ticket)).catch(() => {})
  }, [ticket])
  useEffect(() => {
    AsyncStorage.setItem(KEY_BAG, JSON.stringify(bag)).catch(() => {})
  }, [bag])
  useEffect(() => {
    AsyncStorage.setItem(KEY_CALLED, JSON.stringify([...called])).catch(() => {})
  }, [called])
  useEffect(() => {
    AsyncStorage.setItem(KEY_LAST, JSON.stringify(last)).catch(() => {})
  }, [last])

  return (
  <ScrollView contentContainerStyle={[styles.container, { flexGrow: 1 }]} style={{ backgroundColor: '#faed8e' }}>
      <View style={styles.header}>
        <Text style={styles.title}>Tambola</Text>
      </View>

  <Ticket ticket={ticket} calledNumbers={called} onCellPress={toggleCalled} />

      <View style={styles.controls}>
        <TouchableOpacity style={styles.primaryButton} onPress={onDraw} disabled={!bag.length || fullHouse}>
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
        <Text>Last: {last || '-'}</Text>
        <Text>Remaining in bag: {bag.length}</Text>
        <Text>Rows complete: {rowsCompleted.map((v, i) => (v ? `R${i + 1} ` : '')).join('')}</Text>
        <Text>Full House: {fullHouse ? 'YES' : 'NO'}</Text>

        <View style={styles.chipsRow}>
          {[...called].map(num => (
            <TouchableOpacity key={num} onPress={() => toggleCalled(num)} style={styles.chip}>
              <Text style={styles.chipText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.claims}>
          <Text style={{ marginBottom: 8 }}>Claim Row:</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="Row 1" onPress={() => claimRow(0)} />
            <Button title="Row 2" onPress={() => claimRow(1)} />
            <Button title="Row 3" onPress={() => claimRow(2)} />
          </View>
          <View style={{ height: 8 }} />
          <Button title="Claim Full House" onPress={claimFullHouse} color="#d32f2f" />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16 },
    title: { fontSize: 28, fontWeight: '900', marginBottom: 0, color: '#4a148c' },
    subtitle: { fontSize: 14, color: '#6a1b9a', marginTop: 4 },
    header: { alignItems: 'center', marginBottom: 12, padding: 12, backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  controls: { marginVertical: 12, flexDirection: 'row', gap: 8 },
  info: { marginTop: 12, backgroundColor: '#fafafa', padding: 12, borderRadius: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  chip: { backgroundColor: '#7b1fa2', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 12, margin: 4 },
  chipText: { fontSize: 12, color: '#fff' },
  claims: { marginTop: 12 },
  primaryButton: { backgroundColor: '#af44b5', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginRight: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginRight: 8, borderWidth: 1, borderColor: '#ddd' },
  secondaryButtonText: { color: '#4a148c', fontWeight: '700' },
  dangerButton: { backgroundColor: '#ff5252', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  dangerButtonText: { color: '#fff', fontWeight: '700' },
})

export default TambolaScreen
