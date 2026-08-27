import React, { useState } from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, View, useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studyPlanApi, PlanItemView, ChallengeView } from '../../api/studyPlan';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';

const REASON: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  EXAM: { label: 'Exam', color: '#e11d48', icon: 'document-text-outline' },
  HOMEWORK: { label: 'Homework', color: '#f59e0b', icon: 'book-outline' },
  WEAK_TOPIC: { label: 'Weak spot', color: '#8b5cf6', icon: 'trending-down-outline' },
  REVISION: { label: 'Revision', color: Colors.primary[500], icon: 'refresh-outline' },
};

const MINUTE_OPTIONS = [20, 30, 45, 60, 90];

/**
 * The student's week: what to study each day, why it was chosen, and the
 * personal challenges that only complete when their mastery actually improves.
 *
 * Ticking a task is the main interaction, so rows are full-width tap targets
 * rather than small checkboxes.
 */
export default function StudyPlanScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const qc = useQueryClient();
  const [minutes, setMinutes] = useState<number | undefined>();

  const plan = useQuery({ queryKey: ['study-plan'], queryFn: () => studyPlanApi.my() });
  const drivers = useQuery({ queryKey: ['study-plan-drivers'], queryFn: () => studyPlanApi.drivers() });
  const challenges = useQuery({ queryKey: ['personal-challenges'], queryFn: () => studyPlanApi.challenges() });

  const data = plan.data?.data;
  const driverData = drivers.data?.data;
  const challengeList = challenges.data?.data ?? [];

  const mark = useMutation({
    mutationFn: ({ itemId, done }: { itemId: number; done: boolean }) =>
      studyPlanApi.markItem(data!.id, itemId, done),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['study-plan'] });
      qc.invalidateQueries({ queryKey: ['personal-challenges'] });
    },
  });

  const regenerate = useMutation({
    mutationFn: () => studyPlanApi.regenerate(minutes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['study-plan'] }),
  });

  const refreshing = plan.isRefetching || challenges.isRefetching;
  const refresh = () => { plan.refetch(); drivers.refetch(); challenges.refetch(); };

  if (plan.isLoading) {
    return (
      <View style={[styles.centre, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={Colors.primary[500]} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.centre, { backgroundColor: theme.background }]}>
        <EmptyState
          icon="calendar-outline"
          title="No study plan yet"
          subtitle="Your plan appears once your school publishes the syllabus."
        />
      </View>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary[500]} />
      }
    >
      {/* Progress */}
      <Card style={styles.card}>
        <View style={styles.row}>
          <Text style={[styles.title, { color: theme.text }]}>Week of {data.weekStart}</Text>
          <Text style={[styles.percent, { color: Colors.primary[500] }]}>{data.progressPercent}%</Text>
        </View>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {data.doneItems} of {data.totalItems} tasks done · {data.dailyMinutes} min a day
        </Text>
        <View style={[styles.track, { backgroundColor: theme.border }]}>
          <View style={[styles.fill, { width: `${Math.max(2, data.progressPercent)}%` }]} />
        </View>
        {!!data.rationale && (
          <Text style={[styles.rationale, { color: theme.textSecondary }]}>{data.rationale}</Text>
        )}
        {data.model === 'template' && (
          <Text style={[styles.templateNote, { color: Colors.warning }]}>
            Built by rules — an AI key would tailor this further.
          </Text>
        )}
      </Card>

      {/* Why the plan looks like this */}
      {!!driverData && (
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>What this is based on</Text>
          <View style={styles.driverGrid}>
            <Driver label="Exams" value={String(driverData.upcomingExams.length)} color="#e11d48" theme={theme} />
            <Driver label="Homework" value={String(driverData.pendingHomework)} color="#f59e0b" theme={theme} />
            <Driver label="Weak topics" value={String(driverData.weakTopics.length)} color="#8b5cf6" theme={theme} />
            <Driver
              label="Test avg"
              value={driverData.recentTestAverage != null ? `${Math.round(driverData.recentTestAverage)}%` : '—'}
              color={Colors.primary[500]}
              theme={theme}
            />
          </View>
          {driverData.weakTopics.slice(0, 3).map((t, i) => (
            <Text key={i} style={[styles.driverLine, { color: theme.textSecondary }]}>· {t}</Text>
          ))}
        </Card>
      )}

      {/* Challenges */}
      {challengeList.length > 0 && (
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>My challenges</Text>
          {challengeList.map((c: ChallengeView) => (
            <View key={c.id} style={styles.challenge}>
              <View style={styles.row}>
                <Text style={[styles.challengeTitle, { color: theme.text }]} numberOfLines={1}>
                  {c.title}
                </Text>
                {c.completed
                  ? <Badge label="Done" variant="success" small />
                  : <Badge label={`+${c.xpReward} XP`} variant="warning" small />}
              </View>
              <Text style={[styles.challengeSub, { color: theme.textSecondary }]}>
                {Math.round(c.currentMastery)}% → {Math.round(c.targetMastery)}% mastery
              </Text>
              <View style={[styles.trackSmall, { backgroundColor: theme.border }]}>
                <View style={[
                  styles.fillSmall,
                  {
                    width: `${Math.max(3, c.progressPercent)}%`,
                    backgroundColor: c.completed ? Colors.success : Colors.warning,
                  },
                ]} />
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* The week */}
      {data.days.map((day) => (
        <Card key={day.date} style={[styles.card, day.date === today && styles.todayCard]}>
          <View style={styles.row}>
            <Text style={[styles.dayLabel, { color: theme.text }]}>
              {day.dayLabel}
              {day.date === today && <Text style={{ color: Colors.primary[500] }}>  · Today</Text>}
            </Text>
            <Text style={[styles.dayMinutes, { color: theme.textSecondary }]}>{day.totalMinutes} min</Text>
          </View>

          {day.items.length === 0 ? (
            <Text style={[styles.restDay, { color: theme.textSecondary }]}>Rest day — nothing scheduled.</Text>
          ) : (
            day.items.map((item: PlanItemView) => {
              const reason = REASON[item.reason] ?? REASON.REVISION;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => mark.mutate({ itemId: item.id, done: !item.done })}
                  style={({ pressed }) => [styles.task, pressed && { opacity: 0.6 }]}
                >
                  <Ionicons
                    name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={item.done ? Colors.success : theme.textSecondary}
                  />
                  <View style={styles.taskBody}>
                    <Text
                      style={[
                        styles.taskText,
                        { color: item.done ? theme.textSecondary : theme.text },
                        item.done && styles.taskDone,
                      ]}
                    >
                      {item.task}
                    </Text>
                    <View style={styles.taskMeta}>
                      <Ionicons name={reason.icon} size={11} color={reason.color} />
                      <Text style={[styles.taskReason, { color: reason.color }]}>{reason.label}</Text>
                      <Text style={[styles.taskMinutes, { color: theme.textSecondary }]}>· {item.minutes}m</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </Card>
      ))}

      {/* Rebuild */}
      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Rebuild this week</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Pick how long you can study each day. Ticked tasks are reset.
        </Text>
        <View style={styles.minuteRow}>
          {MINUTE_OPTIONS.map((m) => {
            const active = (minutes ?? data.dailyMinutes) === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMinutes(m)}
                style={[
                  styles.chip,
                  { borderColor: active ? Colors.primary[500] : theme.border },
                  active && { backgroundColor: Colors.primary[500] },
                ]}
              >
                <Text style={{ color: active ? '#fff' : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>
                  {m}m
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          onPress={() => regenerate.mutate()}
          disabled={regenerate.isPending}
          style={[styles.rebuildBtn, regenerate.isPending && { opacity: 0.6 }]}
        >
          {regenerate.isPending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Ionicons name="refresh" size={16} color="#fff" />}
          <Text style={styles.rebuildText}>Rebuild plan</Text>
        </Pressable>
      </Card>
    </ScrollView>
  );
}

function Driver({ label, value, color, theme }: {
  label: string; value: string; color: string; theme: typeof Colors.light;
}) {
  return (
    <View style={styles.driver}>
      <Text style={[styles.driverValue, { color }]}>{value}</Text>
      <Text style={[styles.driverLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { padding: 16, gap: 6 },
  todayCard: { borderColor: Colors.primary[500], borderWidth: 1.5 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 15, fontWeight: '700', flex: 1 },
  percent: { fontSize: 16, fontWeight: '800' },
  subtitle: { fontSize: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 6 },
  fill: { height: '100%', borderRadius: 4, backgroundColor: Colors.primary[500] },
  trackSmall: { height: 5, borderRadius: 3, overflow: 'hidden', marginTop: 6 },
  fillSmall: { height: '100%', borderRadius: 3 },
  rationale: { fontSize: 12, lineHeight: 17, marginTop: 8 },
  templateNote: { fontSize: 11, marginTop: 6 },

  driverGrid: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  driver: { alignItems: 'center', flex: 1 },
  driverValue: { fontSize: 18, fontWeight: '800' },
  driverLabel: { fontSize: 10, textTransform: 'uppercase', marginTop: 2 },
  driverLine: { fontSize: 11, marginTop: 2 },

  challenge: { marginTop: 10 },
  challengeTitle: { fontSize: 13, fontWeight: '600', flex: 1 },
  challengeSub: { fontSize: 11, marginTop: 2 },

  dayLabel: { fontSize: 14, fontWeight: '700' },
  dayMinutes: { fontSize: 11 },
  restDay: { fontSize: 12, marginTop: 4 },
  task: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  taskBody: { flex: 1 },
  taskText: { fontSize: 13, lineHeight: 18 },
  taskDone: { textDecorationLine: 'line-through' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  taskReason: { fontSize: 10, fontWeight: '700' },
  taskMinutes: { fontSize: 10 },

  minuteRow: { flexDirection: 'row', gap: 8, marginVertical: 10, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  rebuildBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary[500], paddingVertical: 12, borderRadius: 12,
  },
  rebuildText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
