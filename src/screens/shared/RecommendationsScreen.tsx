import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recommendationsApi } from '../../api/recommendations';
import { getAccessibleStudents, studentDisplayName } from '../../utils/studentAccess';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';

export default function RecommendationsScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const students = useQuery({ queryKey: ['accessible-students', user?.userId], queryFn: () => getAccessibleStudents(user), enabled: !!user });
  const list = students.data ?? [];
  useEffect(() => { if (!selectedStudentId && list.length > 0) setSelectedStudentId(list[0].id); }, [list, selectedStudentId]);

  const recommendation = useQuery({
    queryKey: ['recommendation', selectedStudentId],
    queryFn: () => recommendationsApi.student(selectedStudentId!),
    enabled: !!selectedStudentId,
  });

  const generate = useMutation({
    mutationFn: () => recommendationsApi.generate(selectedStudentId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendation', selectedStudentId] }),
    onError: (err: any) => Alert.alert('Recommendation failed', err?.response?.data?.message ?? 'Please try again.'),
  });

  const rec = recommendation.data?.data?.data;
  const refresh = () => { students.refetch(); recommendation.refetch(); };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={students.isRefetching || recommendation.isRefetching} onRefresh={refresh} tintColor={Colors.primary[500]} />}
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

      {!rec ? (
        <Card style={styles.card}>
          <EmptyState icon="bulb-outline" title="No insights yet" subtitle="Generate recommendations for the selected student." />
          {!!selectedStudentId && <Button label="Generate Insights" onPress={() => generate.mutate()} loading={generate.isPending} fullWidth />}
        </Card>
      ) : (
        <Card style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.title, { color: theme.text }]}>AI Recommendations</Text>
            <Badge label={rec.riskLevel ?? 'Insight'} variant={rec.riskLevel === 'HIGH' ? 'danger' : rec.riskLevel === 'MEDIUM' ? 'warning' : 'success'} small />
          </View>
          {!!rec.summary && <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{rec.summary}</Text>}
          {(rec.recommendations ?? []).map((r, idx) => (
            <Text key={idx} style={[styles.bullet, { color: theme.textSecondary }]}>- {r}</Text>
          ))}
          <Button label="Refresh Insights" variant="secondary" onPress={() => generate.mutate()} loading={generate.isPending} />
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  switcher: { gap: 8, paddingRight: 12 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  chipText: { fontSize: 13, fontWeight: '800' },
  card: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { flex: 1, fontSize: 16, fontWeight: '800' },
  subtitle: { fontSize: 13, lineHeight: 20 },
  bullet: { fontSize: 13, lineHeight: 20 },
});
