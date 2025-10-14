import React, { useRef, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native'

// ticket: 3x9 matrix with numbers or null
const Ticket = ({ ticket, calledNumbers, onCellPress }) => {
  // Create an Animated value for each cell keyed by rIdx-cIdx
  const animMapRef = useRef({})

  useEffect(() => {
    // initialize animated values for cells
    for (let r = 0; r < ticket.length; r++) {
      for (let c = 0; c < ticket[r].length; c++) {
        const key = `${r}-${c}`
        if (!animMapRef.current[key]) animMapRef.current[key] = new Animated.Value(1)
      }
    }
  }, [ticket])

  const animateCell = (r, c, toValue = 1.08) => {
    const key = `${r}-${c}`
    const av = animMapRef.current[key]
    if (!av) return
    Animated.sequence([
      Animated.timing(av, { toValue, duration: 120, useNativeDriver: true }),
      Animated.timing(av, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start()
  }

  return (
    <View style={styles.container}>
      {ticket.map((row, rIdx) => (
        <View key={rIdx} style={styles.row}>
          {row.map((cell, cIdx) => {
            const isCalled = cell !== null && calledNumbers.has(cell)
            const content = cell === null ? '' : String(cell)
            const key = `${rIdx}-${cIdx}`
            const anim = animMapRef.current[key] || new Animated.Value(1)
            const onPress = () => {
              if (cell !== null && onCellPress) {
                onCellPress(cell)
                animateCell(rIdx, cIdx)
              }
            }
            return (
              <TouchableOpacity
                key={cIdx}
                activeOpacity={0.7}
                onPress={onPress}
                disabled={cell === null}
              >
                <Animated.View style={[styles.cell, isCalled && styles.calledCell, { transform: [{ scale: anim }] }]}> 
                  <Text style={[styles.cellText, isCalled && styles.calledText]}>{content}</Text>
                </Animated.View>
              </TouchableOpacity>
            )
          })}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { margin: 12, alignSelf: 'center' },
  row: { flexDirection: 'row' },
  cell: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
    backgroundColor: '#fff',
    borderRadius: 6,
    elevation: 1,
  },
  cellText: { fontSize: 13, color: '#333' },
  calledCell: { backgroundColor: '#1976d2' },
  calledText: { color: '#fff', fontWeight: '700' },
})

export default Ticket
