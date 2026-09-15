import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, useColorScheme, View } from 'react-native';
import { Colors } from '../theme/colors';
import { useChildren } from '../hooks/useChildren';

/**
 * Shows whose information is on screen, and lets a parent with more than one
 * child switch. The choice carries across every parent screen.
 */
export function ChildSwitcher() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const { children, childId, child, setChildId } = useChildren();

  if (children.length === 0) return null;
  if (children.length === 1) {
    return (
      <View style={styles.single}>
        <Text style={[styles.singleText, { color: theme.textSecondary }]}>
          {child?.fullName}{child?.className ? ` · ${child.className}` : ''}
        </Text>
      </View>
    );
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {children.map((c) => {
        const active = c.id === childId;
        return (
          <TouchableOpacity
            key={c.id}
            onPress={() => setChildId(c.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.chip, {
              backgroundColor: active ? Colors.primary[500] : theme.card,
              borderColor: active ? Colors.primary[500] : theme.border,
            }]}
          >
            <Text style={[styles.chipText, { color: active ? '#fff' : theme.text }]}>{c.firstName}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1, minHeight: 36, justifyContent: 'center' },
  chipText: { fontSize: 14, fontWeight: '600' },
  single: { paddingHorizontal: 16, paddingTop: 8 },
  singleText: { fontSize: 13 },
});
