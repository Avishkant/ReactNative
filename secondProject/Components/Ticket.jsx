import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

// ticket: 3x9 matrix with numbers or null
const Ticket = ({ ticket, calledNumbers }) => {
  return (
    <View style={styles.container}>
      {ticket.map((row, rIdx) => (
        <View key={rIdx} style={styles.row}>
          {row.map((cell, cIdx) => {
            const isCalled = cell !== null && calledNumbers.has(cell);
            return (
              <View key={cIdx} style={[styles.cell, isCalled && styles.calledCell]}>
                <Text style={[styles.cellText, isCalled && styles.calledText]}>{cell || ''}</Text>
              </View>
            )
          })}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { margin: 12 },
  row: { flexDirection: 'row' },
  cell: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    backgroundColor: '#fff',
  },
  cellText: { fontSize: 12 },
  calledCell: { backgroundColor: '#4CAF50' },
  calledText: { color: '#fff', fontWeight: 'bold' },
})

export default Ticket
