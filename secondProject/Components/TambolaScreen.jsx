import React, { useEffect, useState } from 'react'
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native'
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

  const onNewTicket = () => {
    setTicket(generateTicket())
    setBag(createDrawBag())
    setCalled(new Set())
    setLast(null)
    setFullHouse(false)
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tambola (Demo)</Text>

      <Ticket ticket={ticket} calledNumbers={called} />

      <View style={styles.controls}>
        <Button title="Draw Number" onPress={onDraw} disabled={!bag.length || fullHouse} />
        <View style={{ height: 8 }} />
        <Button title="New Ticket" onPress={onNewTicket} />
      </View>

      <View style={styles.info}>
        <Text>Last: {last || '-'}</Text>
        <Text>Called ({called.size}): {[...called].slice(0, 30).join(', ')}</Text>
        <Text>Rows complete: {rowsCompleted.map((v, i) => (v ? `R${i + 1} ` : '')).join('')}</Text>
        <Text>Full House: {fullHouse ? 'YES' : 'NO'}</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  controls: { marginVertical: 12 },
  info: { marginTop: 12 },
})

export default TambolaScreen
