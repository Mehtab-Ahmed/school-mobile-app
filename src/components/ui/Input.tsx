import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, useColorScheme, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export function Input({ label, error, icon, isPassword, style, ...props }: InputProps) {
  const [show, setShow] = useState(false);
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <View style={styles.wrapper}>
      {label && <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>}
      <View style={[styles.row, { backgroundColor: theme.surface2, borderColor: error ? Colors.danger : theme.border }]}>
        {icon && <Ionicons name={icon} size={18} color={theme.textMuted} style={styles.icon} />}
        <TextInput
          style={[styles.input, { color: theme.text }, style as any]}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={isPassword && !show}
          autoCapitalize="none"
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShow(!show)} style={styles.eye}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 50,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  eye: { padding: 4 },
  error: { color: Colors.danger, fontSize: 12, marginTop: 4 },
});
