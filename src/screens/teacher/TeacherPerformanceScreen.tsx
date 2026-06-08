import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  useColorScheme, ActivityIndicator, FlatList,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../theme/colors';
import { teacherPerfApi } from '../../api/advanced';
import ScreenHeader from '../../components/ui/ScreenHeader';

type Metric = { key: string; label: string; icon: string; color: string; weight: string };

const METRICS: Metric[] = [
  { key: 'homeworkCorrectionRate',    label: 'Homework Correction',  icon: '📝', color: '#6366f1', weight: '30%' },
  { key: 'attendancePunctualityScore',label: 'Punctuality',          icon: '⏰', color: '#10b981', weight: '20%' },
  { key: 'studentImprovementScore',   label: 'Student Improvement',  icon: '📈', color: '#f59e0b', weight: '30%' },
  { key: 'parentFeedbackScore',       label: 'Parent Feedback',      icon: '💬', color: '#8b5cf6', weight: '20%' },
];

function MetricBar({ metric, value }: { metric: Metric; value: number }) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const pct = Math.min(Math.max(value ?? 0, 0), 100);
  return (
    <View style={mb.metric}>
      <View style={mb.metricHeader}>
        <Text style={mb.metricIcon}>{metric.icon}</Text>
        <Text style={[mb.metricLabel, { color: theme.textSecondary }]}>{metric.label}</Text>
        <Text style={[mb.metricWeight, { color: metric.color }]}>{metric.weight}</Text>
        <Text style={[mb.metricVal, { color: theme.text }]}>{pct.toFixed(1)}%</Text>
      </View>
      <View style={[mb.barBg, { backgroundColor: theme.background }]}>
        <View style={[mb.barFill, { width: `${pct}%` as any, backgroundColor: metric.color }]} />
      </View>
    </View>
  );
}

export default function TeacherPerformanceScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const { user } = useAuthStore();
  const isAdmin = user?.primaryRole === 'ADMIN';
  const qc = useQueryClient();

  const { data: myData, isLoading: myLoading } = useQuery({
    queryKey: ['teacher-perf-my'],
    queryFn: () => teacherPerfApi.getMy().then(r => r.data?.data),
    enabled: !isAdmin,
  });

  const { data: lbData, isLoading: lbLoading } = useQuery({
    queryKey: ['teacher-perf-leaderboard'],
    queryFn: () => teacherPerfApi.getLeaderboard().then(r => r.data?.data ?? []),
    enabled: isAdmin,
  });

  const recalcMut = useMutation({
    mutationFn: teacherPerfApi.recalculate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-perf-leaderboard'] }),
  });

  const score: any = myData;
  const leaderboard: any[] = lbData ?? [];

  if (myLoading || lbLoading) {
    return <ActivityIndicator style={{ marginTop: 80 }} color={Colors.primary[500]} />;
  }

  // ---- Admin leaderboard view ----
  if (isAdmin) {
    return (
      <View style={[s.container, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Teacher Performance" />
        <TouchableOpacity
          style={[s.recalcBtn, { backgroundColor: Colors.primary[500] }]}
          onPress={() => recalcMut.mutate()}
          disabled={recalcMut.isPending}
        >
          <Text style={s.recalcBtnText}>{recalcMut.isPending ? 'Recalculating...' : '🔄 Recalculate All'}</Text>
        </TouchableOpacity>
        {leaderboard.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 40 }}>📊</Text>
            <Text style={[{ color: theme.textSecondary, fontSize: 15 }]}>No data yet — recalculate to populate</Text>
          </View>
        ) : (
          <FlatList
            data={leaderboard}
            keyExtractor={i => String(i.teacherId)}
            renderItem={({ item, index }) => {
              const rank = index + 1;
              const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
              const score = item.overallScore ?? 0;
              const barColor = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
              return (
                <View style={[s.lbCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={s.medal}>{medal}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.lbName, { color: theme.text }]}>Teacher #{item.teacherId}</Text>
                    <View style={[s.lbBar, { backgroundColor: theme.background }]}>
                      <View style={[s.lbFill, { width: `${score}%` as any, backgroundColor: barColor }]} />
                    </View>
                  </View>
                  <Text style={[s.lbScore, { color: barColor }]}>{score.toFixed(1)}</Text>
                </View>
              );
            }}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>
    );
  }

  // ---- Teacher own view ----
  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="My Performance" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Overall score card */}
        {score ? (
          <View style={[s.scoreCard, { backgroundColor: Colors.primary[500] }]}>
            <Text style={s.scoreLabel}>Overall Score</Text>
            <Text style={s.scoreValue}>{(score.overallScore ?? 0).toFixed(1)}</Text>
            <Text style={s.scoreMax}>/100</Text>
            <Text style={s.scoreDate}>Last calculated: {score.lastCalculated?.substring(0, 10) ?? 'N/A'}</Text>
          </View>
        ) : (
          <View style={[s.scoreCard, { backgroundColor: Colors.primary[500] }]}>
            <Text style={s.scoreLabel}>No data yet</Text>
            <Text style={s.scoreValue}>—</Text>
          </View>
        )}

        {/* Metric bars */}
        <View style={[s.metricsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[s.metricsTitle, { color: theme.text }]}>Performance Breakdown</Text>
          {METRICS.map(m => (
            <MetricBar key={m.key} metric={m} value={score?.[m.key] ?? 0} />
          ))}
        </View>

        {/* Formula legend */}
        <View style={[s.legendCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[s.legendTitle, { color: theme.text }]}>Scoring Formula</Text>
          {METRICS.map(m => (
            <View key={m.key} style={s.legendRow}>
              <Text style={s.legendIcon}>{m.icon}</Text>
              <Text style={[s.legendLabel, { color: theme.textSecondary }]}>{m.label}</Text>
              <Text style={[s.legendW, { color: m.color }]}>{m.weight}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const mb = StyleSheet.create({
  metric:       { marginBottom: 12 },
  metricHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 6 },
  metricIcon:   { fontSize: 14 },
  metricLabel:  { flex: 1, fontSize: 13, fontWeight: '600' },
  metricWeight: { fontSize: 11, fontWeight: '700' },
  metricVal:    { fontSize: 14, fontWeight: '800', minWidth: 45, textAlign: 'right' },
  barBg:        { height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: 5 },
});

const s = StyleSheet.create({
  container:    { flex: 1 },
  scoreCard:    { margin: 16, borderRadius: 20, padding: 24, alignItems: 'center', gap: 4 },
  scoreLabel:   { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  scoreValue:   { color: '#fff', fontSize: 56, fontWeight: '900', lineHeight: 64 },
  scoreMax:     { color: 'rgba(255,255,255,0.7)', fontSize: 16 },
  scoreDate:    { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 },
  metricsCard:  { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16, borderWidth: 1 },
  metricsTitle: { fontSize: 15, fontWeight: '800', marginBottom: 16 },
  legendCard:   { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16, borderWidth: 1 },
  legendTitle:  { fontSize: 15, fontWeight: '800', marginBottom: 12 },
  legendRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  legendIcon:   { fontSize: 16 },
  legendLabel:  { flex: 1, fontSize: 13 },
  legendW:      { fontSize: 13, fontWeight: '800' },
  recalcBtn:    { margin: 16, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  recalcBtnText:{ color: '#fff', fontWeight: '700', fontSize: 14 },
  lbCard:       { marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  medal:        { fontSize: 22, width: 32, textAlign: 'center' },
  lbName:       { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  lbBar:        { height: 8, borderRadius: 4, overflow: 'hidden' },
  lbFill:       { height: '100%', borderRadius: 4 },
  lbScore:      { fontSize: 18, fontWeight: '900', minWidth: 50, textAlign: 'right' },
  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 60 },
});
