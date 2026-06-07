import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, useColorScheme,
  RefreshControl, ActivityIndicator, TouchableOpacity, Modal, ScrollView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { studentsApi } from '../../api/students';
import { examsApi } from '../../api/exams';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';
import { Badge, statusVariant } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';
import { ExamMark } from '../../types';

function gradeColor(pct: number) {
  if (pct >= 90) return Colors.success;
  if (pct >= 75) return Colors.primary[500];
  if (pct >= 60) return Colors.warning;
  return Colors.danger;
}

export default function StudentExams() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore((s) => s.user);
  const [selected, setSelected] = useState<ExamMark | null>(null);

  const { data: studentsData } = useQuery({
    queryKey: ['student-profile', user?.userId],
    queryFn: () => studentsApi.list({ size: 100 }),
    enabled: !!user,
  });

  const student = studentsData?.data?.data?.content?.find((s) => s.user?.id === user?.userId);
  const studentId = student?.id;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['exam-marks', studentId],
    queryFn: () => examsApi.marks(studentId!),
    enabled: !!studentId,
  });

  const marks = data?.data?.data ?? [];
  const pct = selected && selected.marksObtained != null
    ? (selected.marksObtained / selected.totalMarks) * 100
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="My Exams & Marks" />
      {isLoading ? (
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={marks}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={[styles.list, marks.length === 0 && { flex: 1 }]}
          ListEmptyComponent={<EmptyState icon="document-text-outline" title="No exam results yet" />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary[500]} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            const p = item.marksObtained != null
              ? (item.marksObtained / item.totalMarks) * 100 : null;
            const color = p != null ? gradeColor(p) : theme.textMuted;
            return (
              <TouchableOpacity onPress={() => setSelected(item)}>
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
                  {p != null ? (
                    <View style={styles.marksRow}>
                      <View style={[styles.marksBadge, { backgroundColor: color + '22' }]}>
                        <Text style={[styles.marksVal, { color }]}>
                          {item.marksObtained}/{item.totalMarks}
                        </Text>
                        <Text style={[styles.marksPct, { color }]}>{p.toFixed(1)}%</Text>
                      </View>
                      {item.grade && (
                        <View style={[styles.gradeBadge, { backgroundColor: color }]}>
                          <Text style={styles.gradeText}>{item.grade}</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text style={[styles.noMarks, { color: theme.textMuted }]}>Results pending</Text>
                  )}
                  {/* Progress bar */}
                  {p != null && (
                    <View style={[styles.barTrack, { backgroundColor: theme.surface2 }]}>
                      <View style={[styles.barFill, { width: `${p}%`, backgroundColor: color }]} />
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        {selected && (
          <View style={[styles.modal, { backgroundColor: theme.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{selected.exam.name}</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Text style={{ color: Colors.primary[500], fontSize: 15, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
              {/* Big score */}
              <Card style={styles.scoreCard}>
                <View style={[styles.scoreCircle, { borderColor: gradeColor(pct) }]}>
                  <Text style={[styles.scoreVal, { color: gradeColor(pct) }]}>
                    {selected.marksObtained != null ? selected.marksObtained : '—'}
                  </Text>
                  <Text style={[styles.scoreMax, { color: theme.textSecondary }]}>/{selected.totalMarks}</Text>
                </View>
                <View style={styles.scoreInfo}>
                  <Text style={[styles.scorePct, { color: gradeColor(pct) }]}>{pct.toFixed(1)}%</Text>
                  {selected.grade && (
                    <View style={[styles.scoreGrade, { backgroundColor: gradeColor(pct) }]}>
                      <Text style={styles.scoreGradeText}>Grade {selected.grade}</Text>
                    </View>
                  )}
                </View>
              </Card>

              {/* Details */}
              {[
                { label: 'Exam Type', value: selected.exam.examType },
                { label: 'Start Date', value: selected.exam.startDate },
                { label: 'End Date', value: selected.exam.endDate },
                { label: 'Total Marks', value: String(selected.totalMarks) },
                { label: 'Status', value: selected.exam.status },
              ].map(({ label, value }) => (
                <View key={label} style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
                </View>
              ))}

              {selected.remarks && (
                <Card style={{ backgroundColor: theme.surface2 }} padding={14}>
                  <Text style={[{ color: theme.textSecondary, fontSize: 12 }]}>Teacher's Remarks</Text>
                  <Text style={[{ color: theme.text, fontSize: 14, marginTop: 4 }]}>{selected.remarks}</Text>
                </Card>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
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
  marksBadge: { padding: 10, borderRadius: 12, flexDirection: 'row', gap: 8, alignItems: 'center' },
  marksVal: { fontSize: 20, fontWeight: '800' },
  marksPct: { fontSize: 13, fontWeight: '600' },
  gradeBadge: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  gradeText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  noMarks: { fontSize: 13 },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  scoreCard: { alignItems: 'center', gap: 16 },
  scoreCircle: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreVal: { fontSize: 36, fontWeight: '900' },
  scoreMax: { fontSize: 16 },
  scoreInfo: { alignItems: 'center', gap: 8 },
  scorePct: { fontSize: 28, fontWeight: '800' },
  scoreGrade: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 99 },
  scoreGradeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: '600' },
});
