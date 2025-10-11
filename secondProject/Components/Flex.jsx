import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const Flex = () => {
  return (
    <View>
      <Text style={styles.headingtext}>This is Flex</Text>
      <View style={styles.container}>
        <view style ={[styles.card, styles.card1]}>
            <Text>1</Text>
        </view>
        <view style ={[styles.card, styles.card1]}>
            <Text>2</Text>
        </view>
        <view style ={[styles.card, styles.card1]}>
            <Text>3</Text>
        </view>
      </View>
    </View>
  )
}

export default Flex

const styles = StyleSheet.create({
    headingtext: {
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 20,
    },
    container: {
        padding: 10,
    },
    card: {
        height: 100,
        width: 100,
    },
    card1: {
        backgroundColor: 'red',
    },
})