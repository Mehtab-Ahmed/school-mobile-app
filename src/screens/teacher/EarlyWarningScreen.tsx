import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, View, useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  earlyWarningApi, RiskBand, WatchlistEntry, InterventionView,
} from '../../api/earlyWarning';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';

const BAND_COLOR: Record<string, string> = {
  RED: '#e11d48',
  AMBER: '#f59e0b',
  GREEN: '#10b981',
};

const FILTERS: { label: string; value?: RiskBand }[] = [
  { label: 'Needs attention' },
  { label: 'Red', value: 'RED' as RiskBand },
  { label: 'Amber', value: 'AMBER' as RiskBand },
  { label: 'All', value: 'GREEN' as RiskBand },
];

/**
 * The staff watchlist on a phone - which students need attention, why, and what
 * has already been tried for them.
 *
 * Suggested actions are wording help for a conversation, not a diagnosis, and
 * the copy keeps that framing. Closing an intervention requires an outcome note,
 * mirroring the server rule, so the record says what actually happened.
 */
export default function EarlyWarningScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const qc = useQueryClient();

  const [band, setBand] = useState<RiskBand | undefined>();
  const [openStudent, setOpenStudent] = useState<number | null>(null);

  const watchlist = useQuery({
    queryKey: ['ew-watchlist', band],
    queryFn: () => earlyWarningApi.watchlist(band),
  });

  const data = watchlist.data?.data;
  const entries = data?.entries ?? [];
  const summary = data?.summary;

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={watchlist.isRefetching}
            onRefresh={watchlist.refetch}
            tintColor={Colors.primary[500]}
          />
        }
      >
        {/* Summary */}
        {!!summary && (
          <Card style={styles.card}>
            <View style={styles.summaryRow}>
              <Stat value={summary.red} label="Red" color={BAND_COLOR.RED} theme={theme} />
              <Stat value={summary.amber} label="Amber" color={BAND_COLOR.AMBER} theme={theme} />
              <Stat value={summary.green} label="Green" color={BAND_COLOR.GREEN} theme={theme} />
              <Stat value={summary.openInterventions} label="Open" color={Colors.primary[500]} theme={theme} />
            </View>
            {summary.studentsWithoutAction > 0 && (
              <Text style={[styles.warnLine, { color: Colors.warning }]}>
                {summary.studentsWithoutAction} flagged student
                {summary.studentsWithoutAction === 1 ? '' : 's'} with nothing tried yet.
              </Text>
            )}
          </Card>
        )}

        {/* Filters */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = band === f.value;
            return (
              <Pressable
                key={f.label}
                onPress={() => setBand(f.value)}
                style={[
                  styles.chip,
                  { borderColor: active ? Colors.primary[500] : theme.border },
                  active && { backgroundColor: Colors.primary[500] },
                ]}
              >
                <Text style={{ color: active ? '#fff' : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {watchlist.isLoading ? (
          <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 32 }} />
        ) : entries.length === 0 ? (
          <EmptyState
            icon="shield-checkmark-outline"
            title="Nobody needs attention"
            subtitle="No students are currently flagged. Pull down to refresh."
          />
        ) : (
          entries.map((e: WatchlistEntry) => (
            <Pressable key={e.studentId} onPress={() => setOpenStudent(e.studentId)}>
              <Card style={styles.card}>
                <View style={styles.row}>
                  <View style={[styles.bandDot, { backgroundColor: BAND_COLOR[e.band] ?? theme.border }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: theme.text }]}>{e.studentName}</Text>
                    <Text style={[styles.meta, { color: theme.textSecondary }]}>
                      {e.className ?? 'No class'} · risk {Math.round(e.riskScore)}
                    </Text>
                  </View>
                  {e.improving && <Badge label="Improving" variant="success" small />}
                  <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                </View>

                {e.reasons.slice(0, 2).map((r, i) => (
                  <Text key={i} style={[styles.reason, { color: theme.textSecondary }]}>· {r}</Text>
                ))}

                <Text style={[styles.actionCount, {
                  color: e.openInterventions > 0 ? Colors.primary[500] : Colors.warning,
                }]}>
                  {e.openInterventions > 0
                    ? `${e.openInterventions} action${e.openInterventions === 1 ? '' : 's'} in progress`
                    : 'Nothing tried yet'}
                </Text>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>

      <StudentRiskModal
        studentId={openStudent}
        onClose={() => { setOpenStudent(null); qc.invalidateQueries({ queryKey: ['ew-watchlist'] }); }}
      />
    </>
  );
}

/** Detail sheet: why this student is flagged, and what to do about it. */
function StudentRiskModal({ studentId, onClose }: { studentId: number | null; onClose: () => void }) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const [completing, setCompleting] = useState<number | null>(null);

  const risk = useQuery({
    queryKey: ['ew-student', studentId],
    queryFn: () => earlyWarningApi.student(studentId!),
    enabled: !!studentId,
  });
  const data = risk.data?.data;

  const start = useMutation({
    mutationFn: (action: string) =>
      earlyWarningApi.create({ studentId: studentId!, action }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ew-student', studentId] });
      Alert.alert('Started', 'This action is now tracked against the student.');
    },
    onError: (e: any) => Alert.alert('Could not start', e?.response?.data?.message ?? 'Please try again'),
  });

  const complete = useMutation({
    mutationFn: ({ id, outcome }: { id: number; outcome: string }) =>
      earlyWarningApi.update(id, { status: 'COMPLETED', outcome }),
    onSuccess: () => {
      setCompleting(null); setNote('');
      qc.invalidateQueries({ queryKey: ['ew-student', studentId] });
    },
    onError: (e: any) => Alert.alert('Could not close', e?.response?.data?.message ?? 'Please try again'),
  });

  return (
    <Modal visible={!!studentId} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: theme.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>
            {data?.studentName ?? 'Student'}
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={theme.text} />
          </Pressable>
        </View>

        {risk.isLoading || !data ? (
          <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.bandDot, { backgroundColor: BAND_COLOR[data.band] ?? theme.border }]} />
                <Text style={[styles.name, { color: theme.text, flex: 1 }]}>
                  {data.bandLabel} · risk {Math.round(data.riskScore)}
                </Text>
              </View>
              {!!data.summary && (
                <Text style={[styles.summaryText, { color: theme.textSecondary }]}>{data.summary}</Text>
              )}
              {data.source === 'template' && (
                <Text style={[styles.templateNote, { color: Colors.warning }]}>
                  Wording generated from rules, not AI.
                </Text>
              )}
            </Card>

            {data.signals.length > 0 && (
              <Card style={styles.card}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Signals</Text>
                {data.signals.map((s, i) => (
                  <View key={i} style={styles.signal}>
                    <Text style={[styles.signalLabel, { color: theme.text }]}>{s.label}</Text>
                    <Text style={[styles.signalValue, { color: theme.textSecondary }]}>
                      {Math.round(s.value)} vs {Math.round(s.cohortMean)} class avg · {s.trend.toLowerCase()}
                    </Text>
                  </View>
                ))}
              </Card>
            )}

            {data.strengths.length > 0 && (
              <Card style={styles.card}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Doing well</Text>
                {data.strengths.map((s, i) => (
                  <Text key={i} style={[styles.reason, { color: Colors.success }]}>· {s}</Text>
                ))}
              </Card>
            )}

            {data.suggestedActions.length > 0 && (
              <Card style={styles.card}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Things you could try</Text>
                <Text style={[styles.hint, { color: theme.textSecondary }]}>
                  Conversation starters, not a diagnosis. Tap one to track it.
                </Text>
                {data.suggestedActions.map((a, i) => (
                  <Pressable
                    key={i}
                    onPress={() => start.mutate(a.action)}
                    disabled={start.isPending}
                    style={({ pressed }) => [
                      styles.suggestion,
                      { borderColor: theme.border },
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={Colors.primary[500]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.suggestionText, { color: theme.text }]}>{a.action}</Text>
                      {!!a.rationale && (
                        <Text style={[styles.hint, { color: theme.textSecondary }]}>{a.rationale}</Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </Card>
            )}

            <Card style={styles.card}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>What has been tried</Text>
              {data.interventions.length === 0 ? (
                <Text style={[styles.hint, { color: theme.textSecondary }]}>
                  Nothing yet. Start with a suggestion above.
                </Text>
              ) : (
                data.interventions.map((iv: InterventionView) => (
                  <View key={iv.id} style={[styles.intervention, { borderColor: theme.border }]}>
                    <View style={styles.row}>
                      <Text style={[styles.suggestionText, { color: theme.text, flex: 1 }]}>{iv.action}</Text>
                      <Badge
                        label={iv.status === 'COMPLETED' ? 'Done' : iv.status === 'CANCELLED' ? 'Dropped' : 'Open'}
                        variant={iv.status === 'COMPLETED' ? 'success' : iv.status === 'CANCELLED' ? 'default' : 'info'}
                        small
                      />
                    </View>
                    {!!iv.ownerName && (
                      <Text style={[styles.hint, { color: theme.textSecondary }]}>Owner: {iv.ownerName}</Text>
                    )}

                    {iv.status !== 'COMPLETED' && iv.status !== 'CANCELLED' && (
                      completing === iv.id ? (
                        <View style={{ gap: 8, marginTop: 8 }}>
                          <TextInput
                            value={note}
                            onChangeText={setNote}
                            placeholder="What happened? (required)"
                            placeholderTextColor={theme.textSecondary}
                            multiline
                            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                          />
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <Pressable
                              onPress={() => {
                                if (!note.trim()) {
                                  Alert.alert('Outcome needed',
                                    'Record what happened so the next teacher knows.');
                                  return;
                                }
                                complete.mutate({ id: iv.id, outcome: note.trim() });
                              }}
                              style={[styles.smallBtn, { backgroundColor: Colors.success }]}
                            >
                              <Text style={styles.smallBtnText}>Save & close</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => { setCompleting(null); setNote(''); }}
                              style={[styles.smallBtn, { backgroundColor: theme.border }]}
                            >
                              <Text style={[styles.smallBtnText, { color: theme.text }]}>Cancel</Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <Pressable onPress={() => setCompleting(iv.id)} style={{ marginTop: 6 }}>
                          <Text style={{ color: Colors.primary[500], fontSize: 12, fontWeight: '600' }}>
                            Mark as done
                          </Text>
                        </Pressable>
                      )
                    )}
                  </View>
                ))
              )}
            </Card>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function Stat({ value, label, color, theme }: {
  value: number; label: string; color: string; theme: typeof Colors.light;
}) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 10, textTransform: 'uppercase', color: theme.textSecondary, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  card: { padding: 16, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  warnLine: { fontSize: 11, marginTop: 8 },
  filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  bandDot: { width: 10, height: 10, borderRadius: 5 },
  name: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 11, marginTop: 1 },
  reason: { fontSize: 12, marginTop: 3 },
  actionCount: { fontSize: 11, fontWeight: '600', marginTop: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  summaryText: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  templateNote: { fontSize: 11, marginTop: 6 },
  hint: { fontSize: 11, lineHeight: 16 },
  signal: { marginTop: 8 },
  signalLabel: { fontSize: 12, fontWeight: '600' },
  signalValue: { fontSize: 11, marginTop: 1 },
  suggestion: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8,
  },
  suggestionText: { fontSize: 13, lineHeight: 18 },
  intervention: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 13, minHeight: 64, textAlignVertical: 'top' },
  smallBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  smallBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
});
