import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { portfolioApi } from '../../api/portfolio';
import { getAccessibleStudents, studentDisplayName } from '../../utils/studentAccess';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';

export default function PortfolioScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore((s) => s.user);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const students = useQuery({ queryKey: ['accessible-students', user?.userId], queryFn: () => getAccessibleStudents(user), enabled: !!user });
  const list = students.data ?? [];
  useEffect(() => { if (!selectedStudentId && list.length > 0) setSelectedStudentId(list[0].id); }, [list, selectedStudentId]);

  const portfolio = useQuery({
    queryKey: ['portfolio', selectedStudentId],
    queryFn: () => portfolioApi.byStudent(selectedStudentId!),
    enabled: !!selectedStudentId,
  });

  const items = portfolio.data?.data?.data ?? [];
  const refresh = () => { students.refetch(); portfolio.refetch(); };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={students.isRefetching || portfolio.isRefetching} onRefresh={refresh} tintColor={Colors.primary[500]} />}
    >
      {list.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcher}>
          {list.map((s) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => setSelectedStudentId(s.id)}
              style={[styles.chip, { backgroundColor: selectedStudentId === s.id ? Colors.primary[500] : theme.card, borderColor: selectedStudentId === s.id ? Colors.primary[500] : theme.border }]}
            >
              <Text style={[styles.chipText, { color: selectedStudentId === s.id ? '#fff' : theme.text }]}>{studentDisplayName(s)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {items.length === 0 ? <EmptyState icon="folder-open-outline" title="No portfolio items" subtitle="Certificates, projects, and artifacts will appear here." /> : items.map((item) => (
        <Card key={item.id} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.icon}><Ionicons name="folder-outline" size={22} color={Colors.primary[500]} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{item.description ?? item.currentFilename ?? item.type}</Text>
            </View>
            <Badge label={item.verified ? 'Verified' : item.visibility ?? 'Shared'} variant={item.verified ? 'success' : 'info'} small />
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  switcher: { gap: 8, paddingRight: 12 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  chipText: { fontSize: 13, fontWeight: '800' },
  card: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
});
