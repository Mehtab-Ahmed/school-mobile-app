import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { examsApi } from '../api/exams';
import { Card } from './ui/Card';
import { Colors } from '../theme/colors';

function gradeColor(grade?: string) {
  if (!grade) return Colors.primary[500];
  if (grade === 'F' || grade === 'AB') return Colors.danger;
  if (grade.startsWith('A')) return Colors.success;
  if (grade.startsWith('B')) return Colors.primary[500];
  return Colors.warning;
}

/** This year's report card at a glance: overall percentage, grade, rank and each subject. Hidden until there are published results. */
export function ReportCardSummary({ studentId }: { studentId?: number }) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const { data } = useQuery({
    queryKey: ['report-card', studentId],
    queryFn: () => examsApi.reportCard(studentId!),
    enabled: !!studentId,
    retry: false,
  });
  const rc = data?.data?.data;
  const subjects: any[] = Object.values(rc?.subjectSummary ?? {}).sort((a: any, b: any) => a.subjectName.localeCompare(b.subjectName));
  if (!rc || subjects.length === 0) return null;
  const color = gradeColor(rc.overallGrade);

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: theme.textSecondary }]}>REPORT CARD · {rc.academicYear ?? 'THIS YEAR'}</Text>
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={[styles.big, { color }]}>{Number(rc.percentage ?? 0).toFixed(1)}%</Text>
          <Text style={[styles.small, { color: theme.textSecondary }]}>{rc.totalObtained} / {rc.totalMaximum}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.big, { color }]}>{rc.overallGrade ?? '—'}</Text>
          <Text style={[styles.small, { color: theme.textSecondary }]}>Grade</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.big, { color: theme.text }]}>{rc.classRank ?? '—'}</Text>
          <Text style={[styles.small, { color: theme.textSecondary }]}>Rank</Text>
        </View>
      </View>
      {subjects.map((s) => (
        <View key={s.subjectName} style={[styles.subject, { borderTopColor: theme.border }]}>
          <Text style={[styles.subjectName, { color: theme.text }]} numberOfLines={1}>{s.subjectName}</Text>
          <Text style={[styles.subjectMarks, { color: theme.textSecondary }]}>
            {s.totalMaximum === 0 ? 'Absent' : `${s.totalObtained}/${s.totalMaximum}`}
          </Text>
          <Text style={[styles.subjectGrade, { color: gradeColor(s.totalMaximum === 0 ? 'AB' : s.grade) }]}>
            {s.totalMaximum === 0 ? 'AB' : s.grade}
          </Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8, marginBottom: 12 },
  title: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  stat: { alignItems: 'center', flex: 1 },
  big: { fontSize: 24, fontWeight: '800' },
  small: { fontSize: 11, marginTop: 2 },
  subject: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, gap: 8 },
  subjectName: { flex: 1, fontSize: 13, fontWeight: '600' },
  subjectMarks: { fontSize: 12 },
  subjectGrade: { width: 32, textAlign: 'right', fontSize: 13, fontWeight: '800' },
});
