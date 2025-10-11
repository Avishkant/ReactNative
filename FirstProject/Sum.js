import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Sum = ({ a, b }) => {
  const sum = a + b;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sum of {a} and {b} is {sum}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
});

export default Sum;
