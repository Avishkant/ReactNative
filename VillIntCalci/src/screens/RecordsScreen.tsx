import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '../i18n/i18n';

type RecordItem = any;

export default function RecordsScreen() {
  const { t } = useTranslation();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [sortKey, setSortKey] = useState<'date' | 'label' | 'type'>('date');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const raw = await AsyncStorage.getItem('records');
      const list = raw ? JSON.parse(raw) : [];
      setRecords(list);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load records');
    }
  }

  async function exportRecord(item: RecordItem) {
    // Try to generate PDF using react-native-html-to-pdf if available, otherwise fallback to sharing plain text
    const html = `<h1>Record</h1>
      <p>Type: ${item.type}</p>
      <p>Principal: ${item.principal}</p>
      <p>Rate: ${item.rate}</p>
      <p>Interest: ${item.interest}</p>
      <p>Date: ${item.createdAt}</p>`;
    try {
      const RNHTMLtoPDF = require('react-native-html-to-pdf');
      if (RNHTMLtoPDF && RNHTMLtoPDF.default) {
        const resp = await RNHTMLtoPDF.default.convert({
          html,
          fileName: `record_${item.id}`,
        });
        await Share.share({
          url:
            Platform.OS === 'ios' ? resp.filePath : 'file://' + resp.filePath,
        });
        return;
      }
    } catch (err) {
      // fallback below
    }

    try {
      await Share.share({
        message: `Record\nType: ${item.type}\nPrincipal: ${item.principal}\nRate: ${item.rate}\nInterest: ${item.interest}\nDate: ${item.createdAt}`,
      });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to share record');
    }
  }

  async function deleteRecord(id: string) {
    Alert.alert('Delete', 'Are you sure you want to delete this record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const raw = await AsyncStorage.getItem('records');
            const list = raw ? JSON.parse(raw) : [];
            const updated = list.filter((r: any) => r.id !== id);
            await AsyncStorage.setItem('records', JSON.stringify(updated));
            setRecords(updated);
          } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'Failed to delete record');
          }
        },
      },
    ]);
  }

  const sortedRecords = React.useMemo(() => {
    const list = (records || []).slice();
    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: 'base',
    });
    list.sort((a: any, b: any) => {
      if (sortKey === 'date') {
        const ta = new Date(a.createdAt).getTime() || 0;
        const tb = new Date(b.createdAt).getTime() || 0;
        return sortDesc ? tb - ta : ta - tb;
      }
      if (sortKey === 'label') {
        const sa = (a.label || '').toString();
        const sb = (b.label || '').toString();
        return sortDesc ? collator.compare(sb, sa) : collator.compare(sa, sb);
      }
      // type
      const ta = (a.type || '').toString();
      const tb = (b.type || '').toString();
      return sortDesc ? collator.compare(tb, ta) : collator.compare(ta, tb);
    });
    return list;
  }, [records, sortKey, sortDesc]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('records')}</Text>
      <View style={styles.sortBar}>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortKey === 'date' && styles.sortButtonActive,
          ]}
          onPress={() => setSortKey('date')}
        >
          <Text
            style={sortKey === 'date' ? styles.sortTextActive : styles.sortText}
          >
            Date
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortKey === 'label' && styles.sortButtonActive,
          ]}
          onPress={() => setSortKey('label')}
        >
          <Text
            style={
              sortKey === 'label' ? styles.sortTextActive : styles.sortText
            }
          >
            Label
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortKey === 'type' && styles.sortButtonActive,
          ]}
          onPress={() => setSortKey('type')}
        >
          <Text
            style={sortKey === 'type' ? styles.sortTextActive : styles.sortText}
          >
            Type
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortToggle}
          onPress={() => setSortDesc(s => !s)}
        >
          <Text style={styles.sortToggleText}>{sortDesc ? 'Desc' : 'Asc'}</Text>
        </TouchableOpacity>
      </View>
      {sortedRecords.length === 0 ? (
        <Text style={styles.placeholder}>
          No records yet. Saved calculations will appear here.
        </Text>
      ) : (
        <FlatList
          data={sortedRecords}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>
                  {item.label
                    ? item.label
                    : (item.type || '').toString().toUpperCase()}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.rowSub}>
                    Principal: ₹{item.principal}
                  </Text>
                  <Text style={styles.metaSeparator}>•</Text>
                  <Text style={styles.rowSub}>
                    Interest: ₹{Number(item.interest).toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.rowDate}>
                  Date: {new Date(item.createdAt).toLocaleString()}
                </Text>
                {item.type ? (
                  <View style={styles.typePill}>
                    <Text style={styles.typePillText}>{item.type}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.rowButtons}>
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={() => exportRecord(item)}
                >
                  <Text style={styles.exportText}>📤 {t('PDF')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteRecord(item.id)}
                >
                  <Text style={styles.deleteText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f4f7fb' },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    color: '#0b4b7a',
  },
  placeholder: { color: '#666' },
  row: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
    borderWidth: 0,
    paddingRight: 12,
    // elevation / shadow
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  rowTitle: { fontWeight: '800', fontSize: 16, color: '#0d3f63' },
  rowSub: { color: '#555', marginTop: 4, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaSeparator: { marginHorizontal: 8, color: '#999' },
  rowDate: { color: '#888', marginTop: 6, fontSize: 12 },
  typePill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#e8f1ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typePillText: { color: '#1976d2', fontWeight: '700', fontSize: 12 },
  exportButton: {
    backgroundColor: '#0288d1',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 6,
  },
  exportText: { color: '#fff', fontWeight: '700' },
  rowButtons: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  deleteText: { color: '#fff', fontWeight: '700' },
  sortBar: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#f1f1f1',
  },
  sortButtonActive: { backgroundColor: '#1976d2' },
  sortText: { color: '#333' },
  sortTextActive: { color: '#fff', fontWeight: '700' },
  sortToggle: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#eee',
    borderRadius: 6,
  },
  sortToggleText: { fontWeight: '700' },
});
