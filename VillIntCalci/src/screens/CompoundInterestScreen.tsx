import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { compoundWithExemption, compoundInterest } from '../utils/interest';
import { useTranslation } from '../i18n/i18n';

export default function CompoundInterestScreen() {
  const { t } = useTranslation();
  const [principal, setPrincipal] = useState('1000');
  const [rate, setRate] = useState('12');
  // date inputs (ISO yyyy-mm-dd)
  const today = new Date();
  const defaultGiven = today.toISOString().slice(0, 10);
  const defaultReturn = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const [givenDate, setGivenDate] = useState(defaultGiven);
  const [returnDate, setReturnDate] = useState(defaultReturn);
  const [compoundsPerYear, setCompoundsPerYear] = useState('12');
  const [result, setResult] = useState<number | null>(null);
  const [exempt, setExempt] = useState(false);
  const [label, setLabel] = useState('');
  // DateTimePicker (optional)
  let DateTimePicker: any = null;
  try {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch {
    DateTimePicker = null;
  }
  const [showPickerFor, setShowPickerFor] = useState<null | 'given' | 'return'>(
    null,
  );
  // prefer react-native-date-picker modal when installed
  let RNDatePicker: any = null;
  try {
    const mod = require('react-native-date-picker');
    RNDatePicker = mod && (mod.default || mod);
  } catch {
    RNDatePicker = null;
  }
  const [showRNPickerFor, setShowRNPickerFor] = useState<
    null | 'given' | 'return'
  >(null);
  const [rnPickerDate, setRnPickerDate] = useState<Date>(new Date());
  const [showDMYModalFor, setShowDMYModalFor] = useState<
    null | 'given' | 'return'
  >(null);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 61 }, (_, i) => currentYear - 50 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const [dmy, setDmy] = useState({ day: 1, month: 1, year: currentYear });
  const dayRef = React.useRef<ScrollView | null>(null);
  const monthRef = React.useRef<ScrollView | null>(null);
  const yearRef = React.useRef<ScrollView | null>(null);
  const ITEM_HEIGHT = 40;

  function openDMY(forWhich: 'given' | 'return') {
    const source = forWhich === 'given' ? givenDate : returnDate;
    const dt = new Date(source);
    const day = isNaN(dt.getTime()) ? 1 : dt.getDate();
    const month = isNaN(dt.getTime()) ? 1 : dt.getMonth() + 1;
    const year = isNaN(dt.getTime()) ? currentYear : dt.getFullYear();
    setDmy({ day, month, year });
    setShowDMYModalFor(forWhich);
    setTimeout(() => {
      dayRef.current?.scrollTo({ y: (day - 1) * ITEM_HEIGHT, animated: false });
      monthRef.current?.scrollTo({
        y: (month - 1) * ITEM_HEIGHT,
        animated: false,
      });
      const yindex = Math.max(0, years.indexOf(year));
      yearRef.current?.scrollTo({ y: yindex * ITEM_HEIGHT, animated: false });
    }, 50);
  }

  function onCalculate() {
    const P = parseFloat(principal) || 0;
    const R = parseFloat(rate) || 0;
    const n = parseFloat(compoundsPerYear) || 1;
    let interest = 0;
    // Use provided date range for calculation (day-based)
    const start = new Date(givenDate);
    const end = new Date(returnDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()))
      return Alert.alert(t('invalid_date'), t('invalid_date_hint'));
    if (end <= start)
      return Alert.alert(t('invalid_range'), t('invalid_range_hint'));

    interest = compoundWithExemption(
      P,
      R,
      start.toISOString(),
      end.toISOString(),
      n,
      exempt,
    );
    setResult(interest);
  }

  async function onSave() {
    if (result == null)
      return Alert.alert('No result', 'Please calculate before saving.');
    const record = {
      id: Date.now().toString(),
      type: 'compound',
      principal: parseFloat(principal || '0'),
      rate: parseFloat(rate || '0'),
      compoundsPerYear: parseFloat(compoundsPerYear || '1'),
      exemptPartial: exempt,
      label: label?.trim() || undefined,
      givenDate,
      returnDate,
      interest: result,
      createdAt: new Date().toISOString(),
    };
    try {
      const raw = await AsyncStorage.getItem('records');
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(record);
      await AsyncStorage.setItem('records', JSON.stringify(list));
      Alert.alert('Saved', 'Record saved successfully');
      setLabel('');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save record');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('principal_label')}</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={principal}
        onChangeText={setPrincipal}
      />

      <Text style={styles.label}>{t('rate_label')}</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={rate}
        onChangeText={setRate}
      />

      <Text style={styles.label}>{t('given_date')}</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => {
          if (DateTimePicker) setShowPickerFor('given');
          else if (RNDatePicker) {
            setRnPickerDate(new Date(givenDate));
            setShowRNPickerFor('given');
          } else openDMY('given');
        }}
        activeOpacity={0.7}
      >
        <Text>{givenDate}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>{t('return_date')}</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => {
          if (DateTimePicker) setShowPickerFor('return');
          else if (RNDatePicker) {
            setRnPickerDate(new Date(returnDate));
            setShowRNPickerFor('return');
          } else openDMY('return');
        }}
        activeOpacity={0.7}
      >
        <Text>{returnDate}</Text>
      </TouchableOpacity>

      {DateTimePicker && showPickerFor && (
        <DateTimePicker
          value={new Date(showPickerFor === 'given' ? givenDate : returnDate)}
          mode="date"
          display="default"
          onChange={(e: any, selected?: Date) => {
            if (selected) {
              const iso = selected.toISOString().slice(0, 10);
              if (showPickerFor === 'given') setGivenDate(iso);
              else setReturnDate(iso);
            }
            setShowPickerFor(null);
          }}
        />
      )}

      {RNDatePicker && showRNPickerFor && (
        <RNDatePicker
          modal
          open={true}
          date={rnPickerDate}
          mode="date"
          onConfirm={(d: Date) => {
            const iso = d.toISOString().slice(0, 10);
            if (showRNPickerFor === 'given') setGivenDate(iso);
            else setReturnDate(iso);
            setShowRNPickerFor(null);
          }}
          onCancel={() => setShowRNPickerFor(null)}
        />
      )}

      <Modal visible={!!showDMYModalFor} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.card}>
            <Text style={modalStyles.title}>
              {showDMYModalFor === 'given' ? t('given_date') : t('return_date')}
            </Text>
            <View style={modalStyles.row}>
              <View style={modalStyles.col}>
                <ScrollView
                  ref={dayRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onMomentumScrollEnd={e => {
                    const idx = Math.round(
                      e.nativeEvent.contentOffset.y / ITEM_HEIGHT,
                    );
                    const val = Math.max(1, Math.min(31, idx + 1));
                    setDmy(s => ({ ...s, day: val }));
                  }}
                >
                  {days.map(d => (
                    <View
                      key={`d-${d}`}
                      style={[modalStyles.item, { height: ITEM_HEIGHT }]}
                    >
                      <Text
                        style={
                          dmy.day === d
                            ? modalStyles.itemTextSel
                            : modalStyles.itemText
                        }
                      >
                        {d}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
              <View style={modalStyles.col}>
                <ScrollView
                  ref={monthRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onMomentumScrollEnd={e => {
                    const idx = Math.round(
                      e.nativeEvent.contentOffset.y / ITEM_HEIGHT,
                    );
                    const val = Math.max(1, Math.min(12, idx + 1));
                    setDmy(s => ({ ...s, month: val }));
                  }}
                >
                  {months.map(m => (
                    <View
                      key={`m-${m}`}
                      style={[modalStyles.item, { height: ITEM_HEIGHT }]}
                    >
                      <Text
                        style={
                          dmy.month === m
                            ? modalStyles.itemTextSel
                            : modalStyles.itemText
                        }
                      >
                        {m}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
              <View style={modalStyles.col}>
                <ScrollView
                  ref={yearRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onMomentumScrollEnd={e => {
                    const idx = Math.round(
                      e.nativeEvent.contentOffset.y / ITEM_HEIGHT,
                    );
                    const val =
                      years[Math.max(0, Math.min(years.length - 1, idx))];
                    setDmy(s => ({ ...s, year: val }));
                  }}
                >
                  {years.map(y => (
                    <View
                      key={`y-${y}`}
                      style={[modalStyles.item, { height: ITEM_HEIGHT }]}
                    >
                      <Text
                        style={
                          dmy.year === y
                            ? modalStyles.itemTextSel
                            : modalStyles.itemText
                        }
                      >
                        {y}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={modalStyles.pickerCenterOverlay} pointerEvents="none">
              <View style={modalStyles.centerLine} />
            </View>
            <View style={modalStyles.btnRow}>
              <TouchableOpacity
                style={[modalStyles.btn, modalStyles.cancel]}
                onPress={() => setShowDMYModalFor(null)}
              >
                <Text style={modalStyles.btnText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.btn, modalStyles.ok]}
                onPress={() => {
                  const iso = new Date(dmy.year, dmy.month - 1, dmy.day)
                    .toISOString()
                    .slice(0, 10);
                  if (showDMYModalFor === 'given') setGivenDate(iso);
                  else setReturnDate(iso);
                  setShowDMYModalFor(null);
                }}
              >
                <Text style={modalStyles.btnText}>{t('ok')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Text style={styles.label}>{t('compounds_per_year')}</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={compoundsPerYear}
        onChangeText={setCompoundsPerYear}
      />

      <Text style={styles.label}>{t('label_optional')}</Text>
      <TextInput
        style={styles.input}
        value={label}
        onChangeText={setLabel}
        placeholder={t('placeholder_label_bike')}
      />

      <TouchableOpacity style={styles.button} onPress={onCalculate}>
        <Text style={styles.buttonText}>{t('calculate')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.exemptButton}
        onPress={() => setExempt(!exempt)}
      >
        <Text style={[styles.buttonText, { fontSize: 14 }]}>
          {exempt ? t('exempt_on') : t('exempt_off')}
        </Text>
      </TouchableOpacity>

      {result !== null && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>Interest: ₹{result.toFixed(2)}</Text>
          <Text style={styles.resultText}>
            Total: ₹{(parseFloat(principal || '0') + result).toFixed(2)}
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={onSave}
          >
            <Text style={styles.buttonText}>{t('save_record')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { marginTop: 12, marginBottom: 6, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 6 },
  button: {
    backgroundColor: '#6a1b9a',
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  resultBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  resultText: { fontSize: 16, fontWeight: '600' },
  saveButton: { marginTop: 12, backgroundColor: '#0288d1' },
  exemptButton: { marginTop: 12, padding: 8, alignItems: 'center' },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: { width: '90%', backgroundColor: '#fff', borderRadius: 8, padding: 16 },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flex: 1, alignItems: 'center', maxHeight: 220, paddingHorizontal: 6 },
  item: { paddingVertical: 10, width: '100%', alignItems: 'center' },
  itemSel: { backgroundColor: '#e6f7ff', borderRadius: 6 },
  itemText: { color: '#444' },
  itemTextSel: { color: '#000', fontWeight: '700' },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  btn: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  cancel: { backgroundColor: '#f1f1f1' },
  ok: { backgroundColor: '#cfeeed' },
  btnText: { fontWeight: '700' },
  pickerCenterOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '40%',
    height: 40,
    alignItems: 'center',
  },
  centerLine: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    width: '90%',
    borderRadius: 6,
  },
});
