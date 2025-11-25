import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '../i18n/i18n';

export default function SettingsScreen() {
  const { lang, setLang, t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('settings')}</Text>
      <Text style={styles.item}>Language:</Text>
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <TouchableOpacity
          style={[styles.langBtn, lang === 'en' ? styles.langActive : null]}
          onPress={() => setLang('en')}
        >
          <Text style={styles.langText}>English</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.langBtn, lang === 'hi' ? styles.langActive : null]}
          onPress={() => setLang('hi')}
        >
          <Text style={styles.langText}>हिन्दी</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.item, { marginTop: 16 }]}>
        PDF export and other options will appear here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  item: { marginTop: 8, color: '#444' },
  langBtn: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  langActive: { backgroundColor: '#1976d2' },
  langText: { color: '#000' },
});
