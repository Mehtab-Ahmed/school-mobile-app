import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, View, useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  curriculumApi, CurriculumView, SubjectGroup, UnitView, DraftUnit,
} from '../../api/curriculum';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'default'> = {
  PUBLISHED: 'success',
  DRAFT: 'warning',
  ARCHIVED: 'default',
};

/**
 * Browse the school syllabus and add to it from a phone.
 *
 * CSV import stays on the web app - picking a file needs a document picker this
 * app does not ship. What works well on a phone is the AI draft: paste or type
 * a syllabus, review what it produced, and commit it. Nothing is written until
 * the teacher accepts the draft.
 */
export default function CurriculumScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const [openId, setOpenId] = useState<number | null>(null);

  const list = useQuery({ queryKey: ['curricula'], queryFn: () => curriculumApi.list() });
  const curricula = list.data?.data ?? [];

  if (openId != null) {
    return <CurriculumDetail id={openId} onBack={() => setOpenId(null)} theme={theme} />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={list.isRefetching} onRefresh={list.refetch} tintColor={Colors.primary[500]} />
      }
    >
      {list.isLoading ? (
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 32 }} />
      ) : curricula.length === 0 ? (
        <EmptyState
          icon="library-outline"
          title="No syllabus yet"
          subtitle="Create one on the web app, then browse and extend it here."
        />
      ) : (
        curricula.map((c: CurriculumView) => (
          <Pressable key={c.id} onPress={() => setOpenId(c.id)}>
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.text }]}>{c.name}</Text>
                  <Text style={[styles.meta, { color: theme.textSecondary }]}>
                    {[c.board, c.gradeName, c.levelLabel].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Badge label={c.status} variant={STATUS_VARIANT[c.status] ?? 'default'} small />
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

function CurriculumDetail({ id, onBack, theme }: {
  id: number; onBack: () => void; theme: typeof Colors.light;
}) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showImport, setShowImport] = useState(false);

  const tree = useQuery({ queryKey: ['curriculum-tree', id], queryFn: () => curriculumApi.tree(id) });
  const data = tree.data?.data;

  const topicCount = (data?.subjects ?? []).reduce(
    (sum, s) => sum + s.units.reduce((u, unit) => u + unit.topics.length, 0), 0,
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={tree.isRefetching} onRefresh={tree.refetch} tintColor={Colors.primary[500]} />
      }
    >
      <Pressable onPress={onBack} style={styles.backRow}>
        <Ionicons name="chevron-back" size={18} color={Colors.primary[500]} />
        <Text style={{ color: Colors.primary[500], fontWeight: '600', fontSize: 13 }}>All syllabuses</Text>
      </Pressable>

      {tree.isLoading || !data ? (
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 32 }} />
      ) : (
        <>
          <Card style={styles.card}>
            <View style={styles.row}>
              <Text style={[styles.name, { color: theme.text, flex: 1 }]}>{data.curriculum.name}</Text>
              <Badge
                label={data.curriculum.status}
                variant={STATUS_VARIANT[data.curriculum.status] ?? 'default'}
                small
              />
            </View>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              {data.subjects.length} subjects · {topicCount} topics
            </Text>
            <Pressable onPress={() => setShowImport((s) => !s)} style={styles.importToggle}>
              <Ionicons name="sparkles-outline" size={15} color={Colors.primary[500]} />
              <Text style={{ color: Colors.primary[500], fontWeight: '600', fontSize: 13 }}>
                {showImport ? 'Hide AI import' : 'Add topics with AI'}
              </Text>
            </Pressable>
          </Card>

          {showImport && (
            <AiImportPanel
              curriculumId={id}
              theme={theme}
              onCommitted={() => {
                setShowImport(false);
                qc.invalidateQueries({ queryKey: ['curriculum-tree', id] });
              }}
            />
          )}

          {data.subjects.length === 0 ? (
            <EmptyState
              icon="documents-outline"
              title="Nothing in this syllabus yet"
              subtitle="Add topics with AI above, or import a CSV on the web app."
            />
          ) : (
            data.subjects.map((sub: SubjectGroup) => (
              <Card key={sub.subjectId} style={styles.card}>
                <Text style={[styles.subject, { color: theme.text }]}>{sub.subjectName}</Text>
                {sub.units.map((unit: UnitView) => {
                  const open = expanded === unit.id;
                  return (
                    <View key={unit.id}>
                      <Pressable onPress={() => setExpanded(open ? null : unit.id)} style={styles.unitRow}>
                        <Ionicons
                          name={open ? 'chevron-down' : 'chevron-forward'}
                          size={15}
                          color={theme.textSecondary}
                        />
                        <Text style={[styles.unitTitle, { color: theme.text }]} numberOfLines={2}>
                          {unit.title}
                        </Text>
                        <Text style={[styles.meta, { color: theme.textSecondary }]}>
                          {unit.topics.length}
                        </Text>
                      </Pressable>
                      {open && unit.topics.map((t) => (
                        <View key={t.id} style={styles.topicRow}>
                          <Text style={[styles.topicTitle, { color: theme.textSecondary }]}>· {t.title}</Text>
                          {!!t.learningObjectives && (
                            <Text style={[styles.objectives, { color: theme.textSecondary }]}>
                              {t.learningObjectives}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  );
                })}
              </Card>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

/** Paste a syllabus, review what the AI made of it, then commit. */
function AiImportPanel({ curriculumId, theme, onCommitted }: {
  curriculumId: number; theme: typeof Colors.light; onCommitted: () => void;
}) {
  const [rawText, setRawText] = useState('');
  const [subjectHint, setSubjectHint] = useState('');
  const [draft, setDraft] = useState<DraftUnit[] | null>(null);
  const [notice, setNotice] = useState<string>('');

  const generate = useMutation({
    mutationFn: () => curriculumApi.aiDraft(curriculumId, {
      rawText: rawText.trim(),
      subjectHint: subjectHint.trim() || undefined,
    }),
    onSuccess: (r) => {
      setDraft(r.data?.units ?? []);
      setNotice(r.data?.notice ?? '');
    },
    onError: (e: any) =>
      Alert.alert('Could not read that', e?.response?.data?.message ?? 'Please try again'),
  });

  const commit = useMutation({
    mutationFn: () => curriculumApi.commitDraft(curriculumId, draft!),
    onSuccess: (r) => {
      const res = r.data;
      Alert.alert(
        'Added to syllabus',
        `${res?.unitsCreated ?? 0} units and ${res?.topicsCreated ?? 0} topics created.`
        + (res?.warnings?.length ? `\n\n${res.warnings.slice(0, 3).join('\n')}` : ''),
      );
      setDraft(null); setRawText('');
      onCommitted();
    },
    onError: (e: any) =>
      Alert.alert('Could not save', e?.response?.data?.message ?? 'Please try again'),
  });

  const topicTotal = (draft ?? []).reduce((n, u) => n + u.topics.length, 0);

  return (
    <Card style={styles.card}>
      {!draft ? (
        <>
          <Text style={[styles.label, { color: theme.text }]}>Subject (optional)</Text>
          <TextInput
            value={subjectHint}
            onChangeText={setSubjectHint}
            placeholder="e.g. Mathematics"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          />
          <Text style={[styles.label, { color: theme.text, marginTop: 10 }]}>Paste the syllabus</Text>
          <TextInput
            value={rawText}
            onChangeText={setRawText}
            multiline
            placeholder="Paste chapter and topic names from your syllabus document…"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]}
          />
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            You will review everything before it is saved.
          </Text>
          <Pressable
            onPress={() => generate.mutate()}
            disabled={generate.isPending || rawText.trim().length < 30}
            style={[
              styles.primaryBtn,
              (generate.isPending || rawText.trim().length < 30) && { opacity: 0.5 },
            ]}
          >
            {generate.isPending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="sparkles-outline" size={16} color="#fff" />}
            <Text style={styles.primaryBtnText}>Read syllabus</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={[styles.label, { color: theme.text }]}>
            Review: {draft.length} units, {topicTotal} topics
          </Text>
          {!!notice && <Text style={[styles.hint, { color: Colors.warning }]}>{notice}</Text>}

          {draft.map((u, i) => (
            <View key={i} style={[styles.draftUnit, { borderColor: theme.border }]}>
              <Text style={[styles.unitTitle, { color: theme.text }]}>{u.title}</Text>
              {!!u.subjectName && (
                <Text style={[styles.meta, { color: theme.textSecondary }]}>{u.subjectName}</Text>
              )}
              {u.topics.map((t, ti) => (
                <Text key={ti} style={[styles.topicTitle, { color: theme.textSecondary }]}>· {t.title}</Text>
              ))}
            </View>
          ))}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Pressable
              onPress={() => commit.mutate()}
              disabled={commit.isPending}
              style={[styles.primaryBtn, { flex: 1, marginTop: 0 }, commit.isPending && { opacity: 0.5 }]}
            >
              {commit.isPending
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="checkmark" size={16} color="#fff" />}
              <Text style={styles.primaryBtnText}>Add to syllabus</Text>
            </Pressable>
            <Pressable
              onPress={() => setDraft(null)}
              style={[styles.primaryBtn, { flex: 0.6, marginTop: 0, backgroundColor: theme.border }]}
            >
              <Text style={[styles.primaryBtnText, { color: theme.text }]}>Discard</Text>
            </Pressable>
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  card: { padding: 16, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 11, marginTop: 2 },
  subject: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  unitRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9 },
  unitTitle: { fontSize: 13, fontWeight: '600', flex: 1 },
  topicRow: { paddingLeft: 22, paddingBottom: 6 },
  topicTitle: { fontSize: 12, lineHeight: 17 },
  objectives: { fontSize: 11, lineHeight: 15, paddingLeft: 10, marginTop: 1, opacity: 0.8 },
  importToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  label: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, padding: 11, fontSize: 14, marginTop: 6 },
  textArea: { minHeight: 130, textAlignVertical: 'top' },
  hint: { fontSize: 11, lineHeight: 16, marginTop: 8 },
  draftUnit: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary[500], paddingVertical: 13, borderRadius: 12, marginTop: 12,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
