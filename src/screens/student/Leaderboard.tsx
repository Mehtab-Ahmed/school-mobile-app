import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, useColorScheme,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { gamificationApi, LeaderboardEntry, AcademicLeaderboardEntry } from '../../api/gamification';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../theme/colors';

const MEDAL = ['🥇', '🥈', '🥉'];

const GRADE_COLOR: Record<string, string> = {
  'A+': '#10b981', 'A': '#22c55e', 'B+': '#84cc16', 'B': '#f59e0b',
  'C': '#f97316', 'D': '#ef4444', 'F': '#9ca3af',
};

type MainTab = 'gamification' | 'academic';
type ScopeTab = 'class' | 'school';

// ── Gamification entry row ────────────────────────────────────────────────────

function PointsRow({ entry, idx, theme }: { entry: LeaderboardEntry; idx: number; theme: any }) {
  const isTop3 = idx < 3;
  return (
    <View style={[
      styles.row,
      { backgroundColor: theme.card, borderColor: isTop3 ? Colors.primary[400] : theme.border },
      isTop3 && styles.topRow,
    ]}>
      <View style={styles.rankWrap}>
        {idx < 3
          ? <Text style={styles.medal}>{MEDAL[idx]}</Text>
          : <Text style={[styles.rankNum, { color: theme.textSecondary }]}>#{entry.rank}</Text>}
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {entry.studentName}
        </Text>
        <View style={styles.metaRow}>
          {entry.streakDays > 0 && (
            <Text style={styles.streak}>🔥 {entry.streakDays}d</Text>
          )}
          <Text style={[styles.breakdownText, { color: theme.textMuted }]}>
            📝{entry.assignmentPoints} · ✅{entry.attendancePoints}
            {entry.behaviorPoints !== 0 ? ` · 💬${entry.behaviorPoints > 0 ? '+' : ''}${entry.behaviorPoints}` : ''}
          </Text>
        </View>
      </View>
      <View style={styles.rightCol}>
        <Text style={[styles.totalPts, { color: Colors.primary[500] }]}>
          {entry.totalPoints}
        </Text>
        <Text style={[styles.ptsLabel, { color: theme.textMuted }]}>pts</Text>
      </View>
    </View>
  );
}

// ── Academic entry row ────────────────────────────────────────────────────────

function AcademicRow({ entry, idx, theme }: { entry: AcademicLeaderboardEntry; idx: number; theme: any }) {
  const isTop3 = idx < 3;
  const gradeColor = GRADE_COLOR[entry.grade] ?? '#9ca3af';
  const pct = entry.totalMaxMarks > 0
    ? entry.averagePercentage
    : entry.totalMarksObtained; // class query: raw total, not percentage

  return (
    <View style={[
      styles.row,
      { backgroundColor: theme.card, borderColor: isTop3 ? gradeColor : theme.border },
      isTop3 && styles.topRow,
    ]}>
      <View style={styles.rankWrap}>
        {idx < 3
          ? <Text style={styles.medal}>{MEDAL[idx]}</Text>
          : <Text style={[styles.rankNum, { color: theme.textSecondary }]}>#{entry.rank}</Text>}
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {entry.studentName}
        </Text>
        <Text style={[styles.breakdownText, { color: theme.textMuted }]}>
          {entry.admissionNumber}
          {entry.pointsRank ? `  ·  🏆 #${entry.pointsRank} pts rank` : ''}
        </Text>
      </View>
      <View style={styles.rightCol}>
        <View style={[styles.gradeBadge, { backgroundColor: gradeColor + '22' }]}>
          <Text style={[styles.gradeText, { color: gradeColor }]}>{entry.grade}</Text>
        </View>
        {entry.totalMaxMarks > 0 ? (
          <Text style={[styles.ptsLabel, { color: theme.textMuted }]}>
            {pct.toFixed(1)}%
          </Text>
        ) : (
          <Text style={[styles.totalPts, { color: gradeColor }]}>
            {entry.totalMarksObtained.toFixed(0)}
          </Text>
        )}
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore(s => s.user);

  const [mainTab, setMainTab] = useState<MainTab>('gamification');
  const [scopeTab, setScopeTab] = useState<ScopeTab>('class');

  // Resolve class section from stored user data
  const classSectionId: number = (user as any)?.student?.classSectionId
    ?? (user as any)?.classSectionId
    ?? (user as any)?.student?.classSection?.id
    ?? 1;

  // ── Gamification queries ──────────────────────────────────────────────────
  const classGamifQ = useQuery({
    queryKey: ['lb', 'gamif', 'class', classSectionId],
    queryFn: () => gamificationApi.getClassLeaderboard(classSectionId).then(r => r.data?.data ?? []),
    enabled: mainTab === 'gamification' && scopeTab === 'class',
  });

  const schoolGamifQ = useQuery({
    queryKey: ['lb', 'gamif', 'school'],
    queryFn: () => gamificationApi.getSchoolLeaderboard(50).then(r => r.data?.data ?? []),
    enabled: mainTab === 'gamification' && scopeTab === 'school',
  });

  // ── Academic queries ──────────────────────────────────────────────────────
  const classAcademicQ = useQuery({
    queryKey: ['lb', 'academic', 'class', classSectionId],
    queryFn: () => gamificationApi.getAcademicClassLeaderboard(classSectionId).then(r => r.data?.data ?? []),
    enabled: mainTab === 'academic' && scopeTab === 'class',
  });

  const schoolAcademicQ = useQuery({
    queryKey: ['lb', 'academic', 'school'],
    queryFn: () => gamificationApi.getAcademicSchoolLeaderboard(50).then(r => r.data?.data ?? []),
    enabled: mainTab === 'academic' && scopeTab === 'school',
  });

  // Active query
  const activeQ = mainTab === 'gamification'
    ? (scopeTab === 'class' ? classGamifQ : schoolGamifQ)
    : (scopeTab === 'class' ? classAcademicQ : schoolAcademicQ);

  const { data, isLoading, refetch } = activeQ;
  const entries: any[] = data ?? [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      {/* ── Main Tab: Gamification vs Academic ─── */}
      <View style={[styles.mainTabs, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => setMainTab('gamification')}
          style={[styles.mainTab, mainTab === 'gamification' && { backgroundColor: Colors.primary[500] }]}
        >
          <Text style={[styles.mainTabText, { color: mainTab === 'gamification' ? '#fff' : theme.textSecondary }]}>
            🏆 Points Rank
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMainTab('academic')}
          style={[styles.mainTab, mainTab === 'academic' && { backgroundColor: '#10b981' }]}
        >
          <Text style={[styles.mainTabText, { color: mainTab === 'academic' ? '#fff' : theme.textSecondary }]}>
            📊 Academic Rank
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Description chip ──────────────────── */}
      <Text style={[styles.tabDesc, { color: theme.textMuted }]}>
        {mainTab === 'gamification'
          ? '⚡ Ranked by attendance, homework & behavior points'
          : '📝 Ranked by exam marks across all subjects'}
      </Text>

      {/* ── Scope Tab: Class vs School ────────── */}
      <View style={[styles.scopeTabs, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {(['class', 'school'] as const).map(s => (
          <TouchableOpacity
            key={s}
            onPress={() => setScopeTab(s)}
            style={[styles.scopeTab, scopeTab === s && styles.scopeTabActive]}
          >
            <Text style={[styles.scopeTabText, { color: scopeTab === s ? Colors.primary[500] : theme.textSecondary }]}>
              {s === 'class' ? '📚 My Class' : '🏫 School'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Content ───────────────────────────── */}
      {isLoading ? (
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
      ) : entries.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={{ fontSize: 44, marginBottom: 8 }}>
            {mainTab === 'gamification' ? '🏆' : '📊'}
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {mainTab === 'gamification'
              ? 'No points data yet — start earning!'
              : 'No exam marks recorded yet'}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {entries.map((entry, idx) => (
            mainTab === 'gamification'
              ? <PointsRow key={entry.studentId} entry={entry as LeaderboardEntry} idx={idx} theme={theme} />
              : <AcademicRow key={entry.studentId} entry={entry as AcademicLeaderboardEntry} idx={idx} theme={theme} />
          ))}
        </View>
      )}

      {/* ── Legend / footer ───────────────────── */}
      {entries.length > 0 && (
        <View style={[styles.legend, { borderColor: theme.border }]}>
          {mainTab === 'gamification' ? (
            <Text style={[styles.legendText, { color: theme.textMuted }]}>
              📝 Assignments · ✅ Attendance · 💬 Behavior · 🔥 Streak
            </Text>
          ) : (
            <Text style={[styles.legendText, { color: theme.textMuted }]}>
              Grade: A+(90%+) · A(80%) · B+(70%) · B(60%) · C(50%) · D(35%) · F
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  content:       { padding: 16, paddingBottom: 32 },
  mainTabs:      { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 4, marginBottom: 8 },
  mainTab:       { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  mainTabText:   { fontSize: 14, fontWeight: '700' },
  tabDesc:       { fontSize: 12, textAlign: 'center', marginBottom: 12 },
  scopeTabs:     { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 3, marginBottom: 16 },
  scopeTab:      { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  scopeTabActive:{ borderBottomWidth: 2, borderBottomColor: Colors.primary[500] },
  scopeTabText:  { fontSize: 13, fontWeight: '600' },
  list:          { gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1,
    paddingVertical: 12, paddingHorizontal: 14, gap: 10,
  },
  topRow:        { borderWidth: 2 },
  rankWrap:      { width: 36, alignItems: 'center' },
  medal:         { fontSize: 22 },
  rankNum:       { fontSize: 15, fontWeight: '700' },
  info:          { flex: 1 },
  name:          { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  metaRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  streak:        { fontSize: 11, color: '#f59e0b', fontWeight: '700' },
  breakdownText: { fontSize: 11 },
  rightCol:      { alignItems: 'flex-end', gap: 2 },
  totalPts:      { fontSize: 20, fontWeight: '800' },
  ptsLabel:      { fontSize: 10 },
  gradeBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  gradeText:     { fontSize: 14, fontWeight: '900' },
  emptyBox:      { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 4 },
  emptyText:     { fontSize: 14, textAlign: 'center' },
  legend:        { marginTop: 16, paddingTop: 12, borderTopWidth: 1 },
  legendText:    { fontSize: 11, textAlign: 'center' },
});
