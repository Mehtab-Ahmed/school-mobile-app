import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View, useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { teacherAiApi, LessonPlanView, StudyPack, WeaknessReport, Mcq } from '../../api/teacherAi';
import { academicApi } from '../../api/academic';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Colors } from '../../theme/colors';

type Tab = 'plan' | 'pack' | 'weakness';

const TABS: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'plan', label: 'Lesson plan', icon: 'clipboard-outline' },
  { key: 'pack', label: 'Study pack', icon: 'documents-outline' },
  { key: 'weakness', label: 'Weak spots', icon: 'trending-down-outline' },
];

/**
 * The teacher AI tools, sized for a phone.
 *
 * Every tool falls back to deterministic templates server-side, and the screen
 * says so when that happens rather than passing template output off as AI.
 *
 * PDF upload is deliberately absent here - it needs a document picker that is
 * not a dependency of this app, and pasting text covers the same need on a
 * phone. The full PDF flow lives on the web app.
 */
export default function TeacherAiScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const [tab, setTab] = useState<Tab>('plan');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={styles.tab}>
              <Ionicons name={t.icon} size={16} color={active ? Colors.primary[500] : theme.textSecondary} />
              <Text style={[styles.tabLabel, { color: active ? Colors.primary[500] : theme.textSecondary }]}>
                {t.label}
              </Text>
              {active && <View style={styles.tabUnderline} />}
            </Pressable>
          );
        })}
      </View>

      {tab === 'plan' && <LessonPlanTool theme={theme} />}
      {tab === 'pack' && <StudyPackTool theme={theme} />}
      {tab === 'weakness' && <WeaknessTool theme={theme} />}
    </View>
  );
}

// ── Lesson plans ──

function LessonPlanTool({ theme }: { theme: typeof Colors.light }) {
  const [topicText, setTopicText] = useState('');
  const [duration, setDuration] = useState('40');
  const [plan, setPlan] = useState<LessonPlanView | null>(null);

  const generate = useMutation({
    mutationFn: () => teacherAiApi.generatePlan({
      topicText: topicText.trim(),
      durationMinutes: Number(duration) || 40,
    }),
    onSuccess: (r) => setPlan(r.data ?? null),
    onError: (e: any) =>
      Alert.alert('Could not generate', e?.response?.data?.message ?? 'Please try again'),
  });

  const content = plan?.content;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={[styles.label, { color: theme.text }]}>Topic</Text>
        <TextInput
          value={topicText}
          onChangeText={setTopicText}
          placeholder="e.g. Quadratic Equations"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
        />
        <Text style={[styles.label, { color: theme.text, marginTop: 10 }]}>Lesson length (minutes)</Text>
        <TextInput
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
        />
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          If this topic is in your school syllabus, its learning objectives are used as the seed.
        </Text>
        <PrimaryButton
          label="Generate plan"
          loading={generate.isPending}
          disabled={!topicText.trim()}
          onPress={() => generate.mutate()}
        />
      </Card>

      {!!plan && (
        <Card style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.resultTitle, { color: theme.text, flex: 1 }]}>{plan.title}</Text>
            <Badge
              label={plan.model === 'template' ? 'Template' : 'AI'}
              variant={plan.model === 'template' ? 'warning' : 'success'}
              small
            />
          </View>

          <Section title="Objectives" items={content?.learningObjectives} theme={theme} />
          {!!content?.introduction && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Introduction</Text>
              <Text style={[styles.body, { color: theme.textSecondary }]}>{content.introduction}</Text>
            </>
          )}
          {(content?.explanation ?? []).length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Flow</Text>
              {content!.explanation!.map((s, i) => (
                <View key={i} style={{ marginTop: 6 }}>
                  <Text style={[styles.stepHeading, { color: theme.text }]}>
                    {s.heading}{s.minutes ? ` · ${s.minutes}m` : ''}
                  </Text>
                  <Text style={[styles.body, { color: theme.textSecondary }]}>{s.detail}</Text>
                </View>
              ))}
            </>
          )}
          <Section title="Examples" items={content?.examples} theme={theme} />
          <Section title="Common mistakes" items={content?.commonMistakes} theme={theme} />
          {!!content?.classActivity && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Class activity</Text>
              <Text style={[styles.body, { color: theme.textSecondary }]}>{content.classActivity}</Text>
            </>
          )}
          {!!content?.homework && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Homework</Text>
              <Text style={[styles.body, { color: theme.textSecondary }]}>{content.homework}</Text>
            </>
          )}
        </Card>
      )}
    </ScrollView>
  );
}

// ── Study packs ──

function StudyPackTool({ theme }: { theme: typeof Colors.light }) {
  const [rawText, setRawText] = useState('');
  const [pack, setPack] = useState<StudyPack | null>(null);

  const build = useMutation({
    mutationFn: () => teacherAiApi.studyPack({ rawText: rawText.trim() }),
    onSuccess: (r) => setPack(r.data ?? null),
    onError: (e: any) =>
      Alert.alert('Could not build pack', e?.response?.data?.message ?? 'Please try again'),
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={[styles.label, { color: theme.text }]}>Paste your material</Text>
        <TextInput
          value={rawText}
          onChangeText={setRawText}
          multiline
          placeholder="Paste chapter text, your notes, or a passage…"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]}
        />
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          Turns it into notes, questions and flashcards. To upload a PDF instead, use the web app.
        </Text>
        <PrimaryButton
          label="Build study pack"
          loading={build.isPending}
          disabled={rawText.trim().length < 40}
          onPress={() => build.mutate()}
        />
      </Card>

      {!!pack && (
        <Card style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.resultTitle, { color: theme.text, flex: 1 }]}>Study pack</Text>
            <Badge
              label={pack.model === 'template' ? 'Template' : 'AI'}
              variant={pack.model === 'template' ? 'warning' : 'success'}
              small
            />
          </View>
          {!!pack.notice && (
            <Text style={[styles.hint, { color: Colors.warning }]}>{pack.notice}</Text>
          )}
          {!!pack.summary && <Text style={[styles.body, { color: theme.textSecondary }]}>{pack.summary}</Text>}

          <Section title="Key points" items={pack.keyPoints} theme={theme} />
          <Section title="Notes" items={pack.notes} theme={theme} />

          {pack.flashcards.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Flashcards</Text>
              {pack.flashcards.map((f, i) => (
                <View key={i} style={[styles.flashcard, { borderColor: theme.border }]}>
                  <Text style={[styles.stepHeading, { color: theme.text }]}>{f.front}</Text>
                  <Text style={[styles.body, { color: theme.textSecondary }]}>{f.back}</Text>
                </View>
              ))}
            </>
          )}

          {pack.questions.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Questions</Text>
              {pack.questions.map((q, i) => <McqRow key={i} q={q} index={i} theme={theme} />)}
            </>
          )}
        </Card>
      )}
    </ScrollView>
  );
}

// ── Weakness-targeted questions ──

function WeaknessTool({ theme }: { theme: typeof Colors.light }) {
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [report, setReport] = useState<WeaknessReport | null>(null);

  const sections = useQuery({
    queryKey: ['class-sections'],
    queryFn: () => academicApi.classSections(),
  });
  const sectionList = sections.data?.data?.data ?? [];

  const run = useMutation({
    mutationFn: () => teacherAiApi.weakness({ classSectionId: sectionId! }),
    onSuccess: (r) => setReport(r.data ?? null),
    onError: (e: any) =>
      Alert.alert('Could not analyse', e?.response?.data?.message ?? 'Please try again'),
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={[styles.label, { color: theme.text }]}>Class</Text>
        <View style={styles.chipWrap}>
          {sectionList.map((s: any) => {
            const active = sectionId === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => setSectionId(s.id)}
                style={[
                  styles.chip,
                  { borderColor: active ? Colors.primary[500] : theme.border },
                  active && { backgroundColor: Colors.primary[500] },
                ]}
              >
                <Text style={{ color: active ? '#fff' : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>
                  {s.displayName || `Section ${s.id}`}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          Finds the topics this class is weakest on, from real mastery data, and writes questions for them.
        </Text>
        <PrimaryButton
          label="Find weak spots"
          loading={run.isPending}
          disabled={!sectionId}
          onPress={() => run.mutate()}
        />
      </Card>

      {!!report && (
        <>
          <Card style={styles.card}>
            <View style={styles.row}>
              <Text style={[styles.resultTitle, { color: theme.text, flex: 1 }]}>
                {report.className ?? 'Class'} weak topics
              </Text>
              <Badge
                label={report.model === 'template' ? 'Template' : 'AI'}
                variant={report.model === 'template' ? 'warning' : 'success'}
                small
              />
            </View>
            {report.weakTopics.length === 0 ? (
              <Text style={[styles.hint, { color: theme.textSecondary }]}>
                No topic is below the threshold yet. Mastery builds up as students practise and sit tests.
              </Text>
            ) : (
              report.weakTopics.map((w) => (
                <View key={w.topicId} style={{ marginTop: 8 }}>
                  <View style={styles.row}>
                    <Text style={[styles.stepHeading, { color: theme.text, flex: 1 }]}>{w.topic}</Text>
                    <Text style={{ color: Colors.warning, fontWeight: '800', fontSize: 13 }}>
                      {Math.round(w.averageMastery)}%
                    </Text>
                  </View>
                  <Text style={[styles.hint, { color: theme.textSecondary }]}>
                    {w.studentsStruggling} of {w.studentsTracked} students struggling
                    {w.subjectName ? ` · ${w.subjectName}` : ''}
                  </Text>
                </View>
              ))
            )}
          </Card>

          {report.questions.length > 0 && (
            <Card style={styles.card}>
              <Text style={[styles.resultTitle, { color: theme.text }]}>
                Generated questions ({report.questions.length})
              </Text>
              <Text style={[styles.hint, { color: theme.textSecondary }]}>
                To push these into a real test, open this class on the web app.
              </Text>
              {report.questions.map((q, i) => <McqRow key={i} q={q} index={i} theme={theme} />)}
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

// ── Shared bits ──

function Section({ title, items, theme }: {
  title: string; items?: string[]; theme: typeof Colors.light;
}) {
  if (!items || items.length === 0) return null;
  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {items.map((it, i) => (
        <Text key={i} style={[styles.body, { color: theme.textSecondary }]}>· {it}</Text>
      ))}
    </>
  );
}

function McqRow({ q, index, theme }: { q: Mcq; index: number; theme: typeof Colors.light }) {
  const [reveal, setReveal] = useState(false);
  return (
    <View style={[styles.flashcard, { borderColor: theme.border }]}>
      <Text style={[styles.stepHeading, { color: theme.text }]}>{index + 1}. {q.question}</Text>
      {q.options.map((o, i) => (
        <Text key={i} style={[styles.body, { color: theme.textSecondary }]}>· {o}</Text>
      ))}
      <Pressable onPress={() => setReveal((r) => !r)} style={{ marginTop: 6 }}>
        <Text style={{ color: Colors.primary[500], fontSize: 12, fontWeight: '600' }}>
          {reveal ? 'Hide answer' : 'Show answer'}
        </Text>
      </Pressable>
      {reveal && (
        <>
          <Text style={{ color: Colors.success, fontSize: 12, fontWeight: '700', marginTop: 4 }}>
            {q.answer}
          </Text>
          {!!q.explanation && (
            <Text style={[styles.body, { color: theme.textSecondary }]}>{q.explanation}</Text>
          )}
        </>
      )}
    </View>
  );
}

function PrimaryButton({ label, onPress, loading, disabled }: {
  label: string; onPress: () => void; loading?: boolean; disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={[styles.primaryBtn, (loading || disabled) && { opacity: 0.5 }]}
    >
      {loading
        ? <ActivityIndicator color="#fff" size="small" />
        : <Ionicons name="sparkles-outline" size={16} color="#fff" />}
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  card: { padding: 16, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12 },
  tabLabel: { fontSize: 11, fontWeight: '700' },
  tabUnderline: {
    position: 'absolute', bottom: 0, left: 12, right: 12,
    height: 2, backgroundColor: Colors.primary[500], borderRadius: 2,
  },
  label: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, padding: 11, fontSize: 14, marginTop: 6 },
  textArea: { minHeight: 140, textAlignVertical: 'top' },
  hint: { fontSize: 11, lineHeight: 16, marginTop: 8 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary[500], paddingVertical: 13, borderRadius: 12, marginTop: 12,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  resultTitle: { fontSize: 15, fontWeight: '700' },
  sectionTitle: { fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 2 },
  body: { fontSize: 12, lineHeight: 18, marginTop: 2 },
  stepHeading: { fontSize: 12, fontWeight: '700' },
  flashcard: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
});
