import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  useColorScheme, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { practiceApi, AnswerFeedback, PracticeQuestionView } from '../../src/api/practice';
import { Colors } from '../../src/theme/colors';

/**
 * Daily 5 - the student's short adaptive practice session. Questions are picked
 * from their weak/due topics, answers give instant feedback, and finishing
 * awards points that feed streaks and leaderboards.
 */
export default function PracticeScreen() {
  const scheme = useColorScheme();
  const base = scheme === 'dark' ? Colors.dark : Colors.light;
  const theme = { ...base, primary: Colors.primary[500] };
  const s = styles(theme);
  const qc = useQueryClient();

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [finished, setFinished] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['daily-practice'],
    queryFn: () => practiceApi.daily().then((r) => r.data),
  });
  const { data: stats } = useQuery({
    queryKey: ['practice-stats'],
    queryFn: () => practiceApi.stats().then((r) => r.data),
  });

  const answer = useMutation({
    mutationFn: ({ qid, ans }: { qid: number; ans: string }) =>
      practiceApi.answer(data!.id, qid, ans).then((r) => r.data),
    onSuccess: (fb) => setFeedback(fb ?? null),
  });

  const complete = useMutation({
    mutationFn: () => practiceApi.complete(data!.id).then((r) => r.data),
    onSuccess: () => {
      setFinished(true);
      qc.invalidateQueries({ queryKey: ['daily-practice'] });
      qc.invalidateQueries({ queryKey: ['practice-stats'] });
    },
  });

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const session = data;
  const questions: PracticeQuestionView[] = session?.questions ?? [];

  if (!session || questions.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={s.center}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <Ionicons name="book-outline" size={48} color={theme.textSecondary} />
        <Text style={s.emptyTitle}>No practice yet</Text>
        <Text style={s.emptyText}>
          Your daily questions appear once your school publishes the syllabus.
        </Text>
      </ScrollView>
    );
  }

  const done = session.alreadyCompleted || finished;
  const answeredAll = session.answeredCount >= session.totalQuestions;

  // ---- completed view ----
  if (done) {
    const pct = session.totalQuestions
      ? Math.round((session.correctCount / session.totalQuestions) * 100)
      : 0;
    return (
      <ScrollView
        style={s.screen}
        contentContainerStyle={s.pad}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <View style={s.resultCard}>
          <Ionicons name="trophy" size={44} color="#F4B740" />
          <Text style={s.resultScore}>{pct}%</Text>
          <Text style={s.resultSub}>
            {session.correctCount} of {session.totalQuestions} correct
          </Text>
          <View style={s.pointsPill}>
            <Ionicons name="star" size={14} color="#7A5B00" />
            <Text style={s.pointsText}>+{session.pointsAwarded} points</Text>
          </View>
          <Text style={s.doneNote}>Come back tomorrow for a new set.</Text>
        </View>

        {stats && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Your progress</Text>
            <View style={s.statRow}>
              <Stat label="Sessions" value={String(stats.sessionsCompleted)} theme={theme} />
              <Stat label="Accuracy" value={`${stats.accuracyPercent}%`} theme={theme} />
              <Stat label="Mastery" value={`${Math.round(stats.overallMastery)}%`} theme={theme} />
            </View>
            {stats.weakest?.length > 0 && (
              <>
                <Text style={s.subHead}>Focus next on</Text>
                {stats.weakest.slice(0, 3).map((t) => (
                  <View key={t.topicId} style={s.topicRow}>
                    <Text style={s.topicName} numberOfLines={1}>{t.topic}</Text>
                    <View style={s.barTrack}>
                      <View style={[s.barFill, { width: `${Math.max(4, t.mastery)}%` }]} />
                    </View>
                    <Text style={s.topicPct}>{Math.round(t.mastery)}%</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
    );
  }

  // ---- question view ----
  const current = questions[Math.min(index, questions.length - 1)];
  const progress = ((index + (feedback ? 1 : 0)) / questions.length) * 100;

  const submit = (opt: string) => {
    if (feedback || answer.isPending) return;
    setPicked(opt);
    answer.mutate({ qid: current.id, ans: opt });
  };

  const next = () => {
    setFeedback(null);
    setPicked(null);
    if (index + 1 < questions.length) setIndex(index + 1);
    else complete.mutate();
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad}>
      <View style={s.headerRow}>
        <Text style={s.kicker}>DAILY 5</Text>
        <Text style={s.counter}>
          {Math.min(index + 1, questions.length)} / {questions.length}
        </Text>
      </View>
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${progress}%` }]} />
      </View>

      <View style={s.card}>
        <View style={s.metaRow}>
          {!!current.topicTitle && (
            <Text style={s.topicChip} numberOfLines={1}>{current.topicTitle}</Text>
          )}
          <Text style={s.diffChip}>{current.difficulty}</Text>
        </View>
        <Text style={s.question}>{current.text}</Text>

        {current.options.map((opt) => {
          const isPicked = picked === opt;
          const isAnswer = feedback && feedback.correctAnswer === opt;
          const isWrongPick = feedback && isPicked && !feedback.correct;
          return (
            <TouchableOpacity
              key={opt}
              style={[
                s.option,
                isAnswer && s.optionCorrect,
                isWrongPick && s.optionWrong,
                !feedback && isPicked && s.optionPicked,
              ]}
              onPress={() => submit(opt)}
              disabled={!!feedback || answer.isPending}
              activeOpacity={0.8}
            >
              <Text style={[s.optionText, (isAnswer || isWrongPick) && s.optionTextStrong]}>
                {opt}
              </Text>
              {isAnswer && <Ionicons name="checkmark-circle" size={20} color="#0E9F6E" />}
              {isWrongPick && <Ionicons name="close-circle" size={20} color="#E02424" />}
            </TouchableOpacity>
          );
        })}

        {answer.isPending && <ActivityIndicator style={{ marginTop: 12 }} color={theme.primary} />}

        {feedback && (
          <View style={[s.feedback, feedback.correct ? s.feedbackOk : s.feedbackBad]}>
            <Text style={s.feedbackTitle}>
              {feedback.correct ? 'Correct!' : 'Not quite'}
            </Text>
            {!!feedback.explanation && <Text style={s.feedbackText}>{feedback.explanation}</Text>}
            {feedback.masteryAfter > feedback.masteryBefore && (
              <Text style={s.masteryText}>
                Mastery {Math.round(feedback.masteryBefore)}% → {Math.round(feedback.masteryAfter)}%
              </Text>
            )}
          </View>
        )}
      </View>

      {feedback && (
        <TouchableOpacity style={s.nextBtn} onPress={next} disabled={complete.isPending}>
          <Text style={s.nextText}>
            {index + 1 < questions.length ? 'Next question' : 'Finish'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      )}

      {!feedback && answeredAll && (
        <TouchableOpacity style={s.nextBtn} onPress={() => complete.mutate()}>
          <Text style={s.nextText}>See results</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function Stat({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text }}>{value}</Text>
      <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const styles = (t: any) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.background },
    pad: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: t.background },
    emptyTitle: { fontSize: 17, fontWeight: '700', color: t.text, marginTop: 12 },
    emptyText: { fontSize: 13, color: t.textSecondary, textAlign: 'center', marginTop: 6 },

    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    kicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: t.primary },
    counter: { fontSize: 12, fontWeight: '600', color: t.textSecondary },
    progressTrack: { height: 6, borderRadius: 3, backgroundColor: t.border, overflow: 'hidden', marginBottom: 16 },
    progressFill: { height: 6, borderRadius: 3, backgroundColor: t.primary },

    card: { backgroundColor: t.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: t.border, marginBottom: 14 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: t.text, marginBottom: 10 },
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 },
    topicChip: { flex: 1, fontSize: 11, fontWeight: '700', color: t.primary },
    diffChip: { fontSize: 10, fontWeight: '800', color: t.textSecondary, letterSpacing: 0.6 },
    question: { fontSize: 17, fontWeight: '700', color: t.text, marginBottom: 14, lineHeight: 24 },

    option: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderWidth: 1, borderColor: t.border, borderRadius: 12,
      paddingVertical: 13, paddingHorizontal: 14, marginBottom: 9,
    },
    optionPicked: { borderColor: t.primary },
    optionCorrect: { borderColor: '#0E9F6E', backgroundColor: 'rgba(14,159,110,0.10)' },
    optionWrong: { borderColor: '#E02424', backgroundColor: 'rgba(224,36,36,0.10)' },
    optionText: { flex: 1, fontSize: 14, color: t.text },
    optionTextStrong: { fontWeight: '700' },

    feedback: { borderRadius: 12, padding: 12, marginTop: 6 },
    feedbackOk: { backgroundColor: 'rgba(14,159,110,0.12)' },
    feedbackBad: { backgroundColor: 'rgba(224,36,36,0.10)' },
    feedbackTitle: { fontSize: 14, fontWeight: '800', color: t.text, marginBottom: 4 },
    feedbackText: { fontSize: 13, color: t.text, lineHeight: 19 },
    masteryText: { fontSize: 12, color: t.textSecondary, marginTop: 6, fontWeight: '600' },

    nextBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: t.primary, paddingVertical: 15, borderRadius: 14,
    },
    nextText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    resultCard: {
      backgroundColor: t.card, borderRadius: 20, padding: 24, alignItems: 'center',
      borderWidth: 1, borderColor: t.border, marginBottom: 14,
    },
    resultScore: { fontSize: 42, fontWeight: '900', color: t.text, marginTop: 8 },
    resultSub: { fontSize: 13, color: t.textSecondary, marginTop: 2 },
    pointsPill: {
      flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14,
      backgroundColor: '#FDF0C8', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20,
    },
    pointsText: { fontSize: 13, fontWeight: '800', color: '#7A5B00' },
    doneNote: { fontSize: 12, color: t.textSecondary, marginTop: 14, textAlign: 'center' },

    statRow: { flexDirection: 'row', marginBottom: 8 },
    subHead: { fontSize: 12, fontWeight: '700', color: t.textSecondary, marginTop: 12, marginBottom: 8 },
    topicRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    topicName: { flex: 1.4, fontSize: 12, color: t.text },
    barTrack: { flex: 1.6, height: 6, borderRadius: 3, backgroundColor: t.border, overflow: 'hidden' },
    barFill: { height: 6, borderRadius: 3, backgroundColor: '#F4B740' },
    topicPct: { width: 34, textAlign: 'right', fontSize: 11, fontWeight: '700', color: t.textSecondary },
  });
