import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { simpleInterestWithInterim } from '../utils/interest';
import { useTranslation } from '../i18n/i18n';

export default function SimpleInterestScreen() {
  const { t } = useTranslation();
  const [principal, setPrincipal] = useState('1000');
  const [rate, setRate] = useState('12');
  // date inputs (ISO yyyy-mm-dd)
  const today = new Date();
  const defaultGiven = today.toISOString().slice(0, 10);
  const defaultReturn = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const [givenDate, setGivenDate] = useState(defaultGiven);
  const [returnDate, setReturnDate] = useState(defaultReturn);
  const [result, setResult] = useState<number | null>(null);
  const [label, setLabel] = useState('');
  // Date picker availability (optional native module)
  let DateTimePicker: any = null;
  try {
    // prefer community datetimepicker when installed
    // use require safely at runtime to avoid bundling failures when module not installed
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch {
    DateTimePicker = null;
  }
  // prefer react-native-date-picker modal when installed
  let RNDatePicker: any = null;
  try {
    const mod = require('react-native-date-picker');
    RNDatePicker = mod && (mod.default || mod);
  } catch {
    RNDatePicker = null;
  }
  const [showPickerFor, setShowPickerFor] = useState<null | 'given' | 'return'>(
    null,
  );
  const [showRNPickerFor, setShowRNPickerFor] = useState<
    null | 'given' | 'return'
  >(null);
  const [rnPickerDate, setRnPickerDate] = useState<Date>(new Date());
  // (no external picker required) simple built-in modal wheel below
  const [showDMYModalFor, setShowDMYModalFor] = useState<
    null | 'given' | 'return'
  >(null);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 61 }, (_, i) => currentYear - 50 + i); // -50..+10
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const [dmy, setDmy] = useState({ day: 1, month: 1, year: currentYear });
  const dayRef = React.useRef<ScrollView | null>(null);
  const monthRef = React.useRef<ScrollView | null>(null);
  const yearRef = React.useRef<ScrollView | null>(null);
  const ITEM_HEIGHT = 40;

  function onCalculate() {
    const P = parseFloat(principal) || 0;
    const R = parseFloat(rate) || 0;
    // validate dates
    const start = new Date(givenDate);
    const end = new Date(returnDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()))
      return Alert.alert(t('invalid_date'), t('invalid_date_hint'));
    if (end <= start)
      return Alert.alert(t('invalid_range'), t('invalid_range_hint'));

    const interest = simpleInterestWithInterim(
      P,
      R,
      start.toISOString(),
      end.toISOString(),
      [],
      true,
    );
    setResult(interest);
  }

  function onPickerChange(event: any, selected?: Date) {
    if (!selected) {
      setShowPickerFor(null);
      return;
    }
    const iso = selected.toISOString().slice(0, 10);
    if (showPickerFor === 'given') setGivenDate(iso);
    else if (showPickerFor === 'return') setReturnDate(iso);
    setShowPickerFor(null);
  }

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

  function cancelDMY() {
    setShowDMYModalFor(null);
  }

  function confirmDMY() {
    const iso = new Date(dmy.year, dmy.month - 1, dmy.day)
      .toISOString()
      .slice(0, 10);
    if (showDMYModalFor === 'given') setGivenDate(iso);
    else if (showDMYModalFor === 'return') setReturnDate(iso);
    setShowDMYModalFor(null);
  }

  async function onSave() {
    if (result == null) return Alert.alert(t('no_result'), t('no_result_hint'));
    const record = {
      id: Date.now().toString(),
      type: 'simple',
      principal: parseFloat(principal || '0'),
      rate: parseFloat(rate || '0'),
      months: 0,
      label: label?.trim() || undefined,
      interest: result,
      createdAt: new Date().toISOString(),
    };
    try {
      const raw = await AsyncStorage.getItem('records');
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(record);
      await AsyncStorage.setItem('records', JSON.stringify(list));
      Alert.alert(t('saved'), t('saved_success'));
      setLabel('');
    } catch {
      Alert.alert(t('save_failed'), t('save_failed'));
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
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
          onChange={onPickerChange}
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

      <TouchableOpacity style={styles.button} onPress={onCalculate}>
        <Text style={styles.buttonText}>{t('calculate')}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>{t('label_optional')}</Text>
      <TextInput
        style={styles.input}
        value={label}
        onChangeText={setLabel}
        placeholder={t('placeholder_label_bike')}
      />

      {result !== null && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>
            {t('interest_label')} ₹{result.toFixed(2)}
          </Text>
          <Text style={styles.resultText}>
            {t('total_label')} ₹
            {(parseFloat(principal || '0') + result).toFixed(2)}
          </Text>
          <Text style={styles.resultText}>
            {t('period_label')} {givenDate} → {returnDate}
          </Text>
          <Text style={styles.resultText}>
            {t('days_label')}{' '}
            {Math.round(
              (new Date(returnDate).getTime() - new Date(givenDate).getTime()) /
                (1000 * 60 * 60 * 24),
            )}
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={onSave}
          >
            <Text style={styles.buttonText}>{t('save_record')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={!!showDMYModalFor} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {showDMYModalFor === 'given' ? t('given_date') : t('return_date')}
            </Text>
            <View style={styles.pickerRow}>
              <View style={styles.pickerColumn}>
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
                      style={[styles.pickerItem, { height: ITEM_HEIGHT }]}
                    >
                      <Text
                        style={
                          dmy.day === d
                            ? styles.pickerItemTextSelected
                            : styles.pickerItemText
                        }
                      >
                        {d}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.pickerColumn}>
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
                      style={[styles.pickerItem, { height: ITEM_HEIGHT }]}
                    >
                      <Text
                        style={
                          dmy.month === m
                            ? styles.pickerItemTextSelected
                            : styles.pickerItemText
                        }
                      >
                        {m}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.pickerColumn}>
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
                      style={[styles.pickerItem, { height: ITEM_HEIGHT }]}
                    >
                      <Text
                        style={
                          dmy.year === y
                            ? styles.pickerItemTextSelected
                            : styles.pickerItemText
                        }
                      >
                        {y}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={styles.pickerCenterOverlay} pointerEvents="none">
              <View style={styles.centerLine} />
            </View>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={cancelDMY}
              >
                <Text style={styles.modalButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalOk]}
                onPress={confirmDMY}
              >
                <Text style={styles.modalButtonText}>{t('ok')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { marginTop: 12, marginBottom: 6, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 6 },
  button: {
    backgroundColor: '#388e3c',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
    maxHeight: 220,
    paddingHorizontal: 6,
  },
  pickerItem: { paddingVertical: 10, width: '100%', alignItems: 'center' },
  pickerItemSelected: { backgroundColor: '#e6f7ff', borderRadius: 6 },
  pickerItemText: { color: '#444' },
  pickerItemTextSelected: { color: '#000', fontWeight: '700' },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  modalCancel: { backgroundColor: '#f1f1f1' },
  modalOk: { backgroundColor: '#cfeeed' },
  modalButtonText: { fontWeight: '700' },
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
