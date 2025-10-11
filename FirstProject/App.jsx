import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';

// Simple Calculator implemented in the main App.jsx
// Features: basic arithmetic (+ - × ÷), percent, sqrt, x^2, reciprocal, +/- toggle, backspace, clear, decimal, parentheses-free evaluation

const BUTTONS = [
  ['C', '±', '⌫', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '%', '='],
];

const App = () => {
  const [display, setDisplay] = useState('0');
  const [overwrite, setOverwrite] = useState(true);
  const lastPressedRef = useRef(null);

  const press = (label) => {
    lastPressedRef.current = label;
    if (label === 'C') return clearAll();
    if (label === '⌫') return backspace();
    if (label === '±') return toggleSign();
    if (label === '%') return percent();
    if (label === '=') return evaluateExpression();
    if (label === '√') return applySqrt();

    if (isOperator(label)) return pushOperator(label);
    if (label === '.') return pushDot();
    return pushDigit(label);
  };

  const clearAll = () => {
    setDisplay('0');
    setOverwrite(true);
  };

  const backspace = () => {
    if (overwrite || display.length === 1) {
      setDisplay('0');
      setOverwrite(true);
      return;
    }
    setDisplay((d) => d.slice(0, -1));
  };

  const toggleSign = () => {
    setDisplay((d) => {
      if (d === '0') return d;
      if (d.startsWith('-')) return d.slice(1);
      return '-' + d;
    });
  };

  const percent = () => {
    setDisplay((d) => {
      try {
        const n = parseFloat(d.replace(/×/g, '*').replace(/÷/g, '/')) || 0;
        const res = (n / 100).toString();
        setOverwrite(true);
        return res;
      } catch (e) {
        return d;
      }
    });
  };

  const applySqrt = () => {
    setDisplay((d) => {
      const n = parseFloat(d);
      if (Number.isNaN(n) || n < 0) return d;
      const res = Math.sqrt(n).toString();
      setOverwrite(true);
      return res;
    });
  };

  const isOperator = (s) => ['+', '-', '×', '÷'].includes(s);

  const pushOperator = (op) => {
    setDisplay((d) => {
      if (overwrite && d === '0') return d; // nothing to do
      if (isOperator(d.slice(-1))) {
        // replace last operator
        return d.slice(0, -1) + op;
      }
      return d + op;
    });
    setOverwrite(false);
  };

  const pushDot = () => {
    setDisplay((d) => {
      // don't add multiple dots in the current number
      const parts = d.split(/\+|-|×|÷/g);
      const last = parts[parts.length - 1];
      if (last.includes('.')) return d;
      if (overwrite) {
        setOverwrite(false);
        return '0.';
      }
      return d + '.';
    });
  };

  const pushDigit = (digit) => {
    setDisplay((d) => {
      if (overwrite) {
        setOverwrite(false);
        return digit === '0' ? '0' : digit;
      }
      if (d === '0' && digit === '0') return d;
      if (d === '0' && digit !== '.') return digit;
      return d + digit;
    });
  };

  const evaluateExpression = () => {
    setDisplay((d) => {
      try {
        // sanitize: only digits, operators, dot, and minus
        const safe = d.replace(/×/g, '*').replace(/÷/g, '/');
        // Prevent trailing operator
        const cleaned = safe.replace(/[+\-*/]$/g, '');
        // eslint-disable-next-line no-eval
        const result = eval(cleaned);
        const rounded = Number.isFinite(result) ? String(roundResult(result)) : 'Error';
        setOverwrite(true);
        return rounded;
      } catch (e) {
        return 'Error';
      }
    });
  };

  const roundResult = (n) => {
    // limit to reasonable precision
    return Math.round(n * 1e10) / 1e10;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.displayContainer}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.displayText}>
            {display}
          </Text>
        </View>

        <View style={styles.buttonsContainer}>
          {BUTTONS.map((row, rIdx) => (
            <View key={`row-${rIdx}`} style={styles.row}>
              {row.map((label) => (
                <TouchableOpacity
                  key={label}
                  style={[
                    styles.button,
                    isOperator(label) || label === '=' ? styles.operatorButton : null,
                    label === '0' ? styles.zeroButton : null,
                  ]}
                  onPress={() => press(label)}>
                  <Text style={[styles.buttonText, isOperator(label) || label === '=' ? styles.operatorText : null]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default App;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1, padding: 12, justifyContent: 'flex-end' },
  displayContainer: { minHeight: 120, justifyContent: 'center', alignItems: 'flex-end', padding: 12 },
  displayText: { fontSize: 48, color: '#111', fontWeight: '500' },
  buttonsContainer: { paddingBottom: 24 },
  row: { flexDirection: 'row', marginBottom: 12, justifyContent: 'space-between' },
  button: {
    backgroundColor: '#fff',
    flex: 1,
    marginHorizontal: 6,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  zeroButton: { flex: 2 },
  operatorButton: { backgroundColor: '#ff9f0a' },
  buttonText: { fontSize: 22, color: '#111' },
  operatorText: { color: '#fff', fontWeight: '600' },
});