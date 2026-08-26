import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { revisionApi, testsApi } from '../../api/lessons';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';

export default function StudentRevisionScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;

  const summary = useQuery({ queryKey: ['revision-end-of-day'], queryFn: () => revisionApi.endOfDay() });
  const tests = useQuery({ queryKey: ['student-tests-available'], queryFn: () => testsApi.available() });

  const eod = summary.data?.data?.data;
  const availableTests = tests.data?.data?.data ?? [];
  const refreshing = summary.isRefetching || tests.isRefetching;
  const refresh = () => { summary.refetch(); tests.refetch(); };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary[500]} />}
    >
      <Card style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="sparkles-outline" size={24} color="#fff" /></View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, { color: theme.text }]}>Daily Learning Summary</Text>
          <Text style={[styles.heroSub, { color: theme.textSecondary }]}>
            {eod?.lessons?.length ?? 0} lessons today, {eod?.homeworkCount ?? 0} homework items
          </Text>
        </View>
      </Card>

      {(eod?.lessons ?? []).length === 0 ? (
        <EmptyState icon="book-outline" title="No summaries yet" subtitle="Published lesson notes will appear here after class." />
      ) : (
        eod!.lessons.map((lesson) => (
          <Card key={lesson.sessionId} style={styles.card}>
            <View style={styles.row}>
              <Text style={[styles.title, { color: theme.text }]}>{lesson.subjectName ?? 'Lesson'}</Text>
              <Badge label={lesson.hasSummary ? 'AI Summary' : 'Journal'} variant={lesson.hasSummary ? 'success' : 'info'} small />
            </View>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{lesson.topicCovered ?? lesson.description ?? 'Class note pending'}</Text>
            {(lesson.revisionBullets ?? []).slice(0, 3).map((b, idx) => (
              <Text key={`${lesson.sessionId}-${idx}`} style={[styles.bullet, { color: theme.textSecondary }]}>- {b}</Text>
            ))}
            {!!lesson.homeworkText && <Text style={[styles.homework, { color: Colors.warning }]}>Homework: {lesson.homeworkText}</Text>}
          </Card>
        ))
      )}

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Weekly MCQ Tests</Text>
      {availableTests.length === 0 ? (
        <EmptyState icon="help-circle-outline" title="No tests available" subtitle="Published weekly or revision tests will show here." />
      ) : (
        availableTests.map((test) => (
          <Card key={test.testId} style={styles.card}>
            <View style={styles.row}>
              <Text style={[styles.title, { color: theme.text }]}>{test.title}</Text>
              <Badge label={test.type} variant="info" small />
            </View>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {test.questionCount} questions - {test.totalMarks} marks - {test.durationMinutes} min
            </Text>
            <Text style={[styles.bullet, { color: theme.textMuted }]}>
              Attempts left: {test.attemptsLeft} {test.scheduledAt ? `- Scheduled ${new Date(test.scheduledAt).toLocaleString()}` : ''}
            </Text>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#06b6d4', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 18, fontWeight: '800' },
  heroSub: { fontSize: 13, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginTop: 8 },
  card: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { flex: 1, fontSize: 15, fontWeight: '800' },
  subtitle: { fontSize: 13, lineHeight: 19 },
  bullet: { fontSize: 13, lineHeight: 20 },
  homework: { fontSize: 13, fontWeight: '700' },
});
