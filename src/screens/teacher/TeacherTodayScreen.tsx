import React, { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lessonsApi, LessonSessionView } from '../../api/lessons';
import { Card } from '../../components/ui/Card';
import { Badge, statusVariant } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';

export default function TeacherTodayScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const qc = useQueryClient();
  const [editing, setEditing] = useState<LessonSessionView | null>(null);
  const [journal, setJournal] = useState({ topicCovered: '', description: '', homeworkText: '', completionPct: '100' });

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['teacher-today-lessons'],
    queryFn: () => lessonsApi.teacherToday(),
  });

  const today = data?.data?.data;
  const sessions = today?.sessions ?? [];

  const lifecycle = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'start' | 'end' | 'cancel' }) =>
      action === 'start' ? lessonsApi.start(id) : action === 'end' ? lessonsApi.end(id) : lessonsApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-today-lessons'] }),
    onError: (err: any) => Alert.alert('Lesson update failed', err?.response?.data?.message ?? 'Please try again.'),
  });

  const saveJournal = useMutation({
    mutationFn: () => lessonsApi.saveJournal(editing!.id, {
      topicCovered: journal.topicCovered,
      description: journal.description,
      homeworkText: journal.homeworkText,
      completionPct: Number(journal.completionPct || 0),
    }),
    onSuccess: () => {
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['teacher-today-lessons'] });
      Alert.alert('Saved', 'Today note saved successfully.');
    },
    onError: (err: any) => Alert.alert('Save failed', err?.response?.data?.message ?? 'Please try again.'),
  });

  const openJournal = async (lesson: LessonSessionView) => {
    setEditing(lesson);
    try {
      const res = await lessonsApi.getJournal(lesson.id);
      const j = res.data.data;
      setJournal({
        topicCovered: j?.topicCovered ?? '',
        description: j?.description ?? '',
        homeworkText: j?.homeworkText ?? '',
        completionPct: String(j?.completionPct ?? 100),
      });
    } catch {
      setJournal({ topicCovered: '', description: '', homeworkText: '', completionPct: '100' });
    }
  };

  if (!isLoading && sessions.length === 0) {
    return <EmptyState icon="calendar-outline" title="No lessons today" subtitle="Your timetable has no live lesson sessions for today." />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary[500]} />}
    >
      <Card style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="today-outline" size={24} color="#fff" /></View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, { color: theme.text }]}>Today in Class</Text>
          <Text style={[styles.heroSub, { color: theme.textSecondary }]}>
            {sessions.length} lessons, {today?.pendingJournals ?? 0} notes pending
          </Text>
        </View>
      </Card>

      {sessions.map((lesson) => (
        <Card key={lesson.id} style={styles.lesson}>
          <View style={styles.lessonTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.lessonTitle, { color: theme.text }]}>{lesson.subjectName ?? 'Lesson'}</Text>
              <Text style={[styles.lessonSub, { color: theme.textSecondary }]}>
                {lesson.className ?? 'Class'} - {lesson.startTime ?? '--'} to {lesson.endTime ?? '--'}
              </Text>
            </View>
            <Badge label={lesson.status} variant={statusVariant(lesson.status)} small />
          </View>
          <View style={styles.actions}>
            {lesson.status === 'UPCOMING' && <Button label="Start Lesson" onPress={() => lifecycle.mutate({ id: lesson.id, action: 'start' })} />}
            {lesson.status === 'LIVE' && <Button label="End Lesson" onPress={() => lifecycle.mutate({ id: lesson.id, action: 'end' })} />}
            <Button label={lesson.journalDone ? 'Edit Note' : 'What I Taught'} variant="secondary" onPress={() => openJournal(lesson)} />
          </View>
        </Card>
      ))}

      {editing && (
        <Card style={styles.editor}>
          <Text style={[styles.editorTitle, { color: theme.text }]}>What I taught today</Text>
          <Field label="Topic covered" value={journal.topicCovered} onChangeText={(topicCovered) => setJournal((j) => ({ ...j, topicCovered }))} />
          <Field label="Class notes" value={journal.description} onChangeText={(description) => setJournal((j) => ({ ...j, description }))} multiline />
          <Field label="Homework / practice" value={journal.homeworkText} onChangeText={(homeworkText) => setJournal((j) => ({ ...j, homeworkText }))} multiline />
          <Field label="Completion %" value={journal.completionPct} onChangeText={(completionPct) => setJournal((j) => ({ ...j, completionPct }))} keyboardType="numeric" />
          <View style={styles.actions}>
            <Button label="Cancel" variant="ghost" onPress={() => setEditing(null)} />
            <Button label="Save Note" loading={saveJournal.isPending} onPress={() => saveJournal.mutate()} />
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

function Field(props: { label: string; value: string; onChangeText: (v: string) => void; multiline?: boolean; keyboardType?: 'default' | 'numeric' }) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        multiline={props.multiline}
        keyboardType={props.keyboardType ?? 'default'}
        placeholderTextColor={theme.textMuted}
        style={[styles.input, props.multiline && styles.textArea, { color: theme.text, backgroundColor: theme.surface2, borderColor: theme.border }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.primary[500], alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 18, fontWeight: '800' },
  heroSub: { fontSize: 13, marginTop: 2 },
  lesson: { gap: 14 },
  lessonTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  lessonTitle: { fontSize: 16, fontWeight: '800' },
  lessonSub: { fontSize: 12, marginTop: 3 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  editor: { gap: 12, borderColor: Colors.primary[300] },
  editorTitle: { fontSize: 16, fontWeight: '800' },
  fieldLabel: { fontSize: 12, fontWeight: '700' },
  input: { minHeight: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  textArea: { minHeight: 92, textAlignVertical: 'top' },
});
