import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import TambolaScreen from './Components/TambolaScreen'

const App = () => {
  return (
    <View>
      {/* <Text style={styles.heading}>App by Avishkant 123</Text> */}
      <TambolaScreen />
    </View>
  )
}

export default App

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
  },
})