import React from 'react';
import { View, Text, StyleSheet, FlatList, useColorScheme, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { studentsApi } from '../../api/students';
import { examsApi } from '../../api/exams';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';
import { Badge, statusVariant } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';

function gradeColor(pct: number) {
  if (pct >= 90) return Colors.success;
  if (pct >= 75) return Colors.primary[500];
  if (pct >= 60) return Colors.warning;
  return Colors.danger;
}

export default function ParentExams() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore((s) => s.user);

  const { data: childrenData } = useQuery({
    queryKey: ['children', user?.userId],
    queryFn: () => studentsApi.byParent(user!.userId),
    enabled: !!user,
  });

  const childId = childrenData?.data?.data?.[0]?.id;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['exam-marks-parent', childId],
    queryFn: () => examsApi.marks(childId!),
    enabled: !!childId,
  });

  const marks = data?.data?.data ?? [];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Child's Exam Results" />
      {isLoading ? (
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={marks}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={[styles.list, marks.length === 0 && { flex: 1 }]}
          ListEmptyComponent={<EmptyState icon="document-text-outline" title="No results yet" />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary[500]} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            const pct = item.marksObtained != null ? (item.marksObtained / item.totalMarks) * 100 : null;
            const color = pct != null ? gradeColor(pct) : theme.textMuted;
            return (
              <Card style={styles.examCard}>
                <View style={styles.examTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.examName, { color: theme.text }]}>{item.exam.name}</Text>
                    <Text style={[styles.examType, { color: theme.textSecondary }]}>
                      {item.exam.examType} · {item.exam.startDate}
                    </Text>
                  </View>
                  <Badge label={item.exam.status} variant={statusVariant(item.exam.status)} small />
                </View>
                {pct != null ? (
                  <View style={styles.marksRow}>
                    <View style={[styles.marksBadge, { backgroundColor: color + '22' }]}>
                      <Text style={[styles.marksVal, { color }]}>
                        {item.marksObtained}/{item.totalMarks}
                      </Text>
                    </View>
                    <Text style={[styles.marksPct, { color }]}>{pct.toFixed(1)}%</Text>
                    {item.grade && (
                      <View style={[styles.gradeBadge, { backgroundColor: color }]}>
                        <Text style={styles.gradeText}>{item.grade}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={[styles.noMarks, { color: theme.textMuted }]}>Results pending</Text>
                )}
                {pct != null && (
                  <View style={[styles.barTrack, { backgroundColor: theme.surface2 }]}>
                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
                  </View>
                )}
              </Card>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 40 },
  examCard: { gap: 10 },
  examTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  examName: { fontSize: 15, fontWeight: '700' },
  examType: { fontSize: 12, marginTop: 2 },
  marksRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  marksBadge: { padding: 10, borderRadius: 12 },
  marksVal: { fontSize: 18, fontWeight: '800' },
  marksPct: { fontSize: 15, fontWeight: '700' },
  gradeBadge: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  gradeText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  noMarks: { fontSize: 13 },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
});
