import { StyleSheet, View } from 'react-native'
import React from 'react'
import TambolaScreen from './Components/TambolaScreen'

const App = () => {
  return (
    <View style={styles.container}>
      <TambolaScreen />
    </View>
  )
}

export default App

const styles = StyleSheet.create({
  container: { flex: 1 },
})