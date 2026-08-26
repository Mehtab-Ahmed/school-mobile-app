import React from 'react';
import {
  View, Text, FlatList, ScrollView, StyleSheet,
  useColorScheme, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../theme/colors';
import { challengesApi } from '../../api/advanced';
import ScreenHeader from '../../components/ui/ScreenHeader';

const CHALLENGE_CONFIG: Record<string, { emoji: string; color: string }> = {
  ATTENDANCE: { emoji: '📅', color: '#10b981' },
  HOMEWORK:   { emoji: '📝', color: '#6366f1' },
  POINTS:     { emoji: '⭐', color: '#f59e0b' },
  BEHAVIOR:   { emoji: '😊', color: '#8b5cf6' },
  STREAK:     { emoji: '🔥', color: '#ef4444' },
};

export default function ChallengesScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const { user } = useAuthStore();
  const isStudent = user?.primaryRole === 'STUDENT';

  const { data: challengesData, isLoading } = useQuery({
    queryKey: ['challenges-active'],
    queryFn: () => challengesApi.getActive().then(r => r.data?.data ?? []),
  });

  const { data: progressData } = useQuery({
    queryKey: ['my-challenge-progress'],
    queryFn: () => challengesApi.getMyProgress().then(r => r.data?.data ?? []),
    enabled: isStudent,
  });

  const { data: levelsData } = useQuery({
    queryKey: ['xp-levels'],
    queryFn: () => challengesApi.getXPLevels().then(r => r.data?.data ?? []),
  });

  const { data: myLevelData } = useQuery({
    queryKey: ['my-level'],
    queryFn: () => challengesApi.getMyLevel().then(r => r.data?.data),
    enabled: isStudent,
  });

  const challenges: any[] = challengesData ?? [];
  const progressMap: Map<number, any> = new Map((progressData ?? []).map((p: any) => [p.challengeId, p]));
  const levels: any[] = levelsData ?? [];
  const myLevel = myLevelData;

  if (isLoading) return <ActivityIndicator style={{ marginTop: 60 }} color={Colors.primary[500]} />;

  const renderChallenge = ({ item }: { item: any }) => {
    const cfg = CHALLENGE_CONFIG[item.challengeType] ?? CHALLENGE_CONFIG.POINTS;
    const progress = progressMap.get(item.id);
    const pct = progress ? Math.min((progress.progress / item.targetValue) * 100, 100) : 0;
    const done = progress?.isCompleted;

    return (
      <View style={[s.challengeCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={s.row}>
          <Text style={s.bigEmoji}>{cfg.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.challengeTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={[s.challengeDesc, { color: theme.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={s.rewardRow}>
              <Text style={[s.reward, { color: Colors.warning }]}>⚡ {item.xpReward} XP</Text>
              <Text style={[s.reward, { color: Colors.primary[400] }]}>⭐ {item.pointsReward} pts</Text>
              <Text style={[s.reward, { color: theme.textMuted }]}>
                → {item.endDate}
              </Text>
            </View>
          </View>
          {done && <Text style={s.checkmark}>✅</Text>}
        </View>
        {isStudent && (
          <View style={s.progressRow}>
            <View style={[s.progressBg, { backgroundColor: theme.background }]}>
              <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: cfg.color }]} />
            </View>
            <Text style={[s.progressText, { color: theme.textSecondary }]}>
              {progress?.progress ?? 0}/{item.targetValue} ({Math.round(pct)}%)
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Challenges & XP" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>

        {/* XP hero for student */}
        {isStudent && myLevel && (
          <View style={[s.xpHero, { backgroundColor: myLevel.colorHex ?? Colors.primary[500] }]}>
            <Text style={s.xpLevel}>Level {myLevel.currentLevel}</Text>
            <Text style={s.xpName}>{myLevel.levelName}</Text>
            <Text style={s.xpXP}>⚡ {myLevel.totalXP} XP</Text>
          </View>
        )}

        {/* Active Challenges */}
        <Text style={[s.sectionTitle, { color: theme.text }]}>🏁 Active Challenges</Text>
        {challenges.length === 0 ? (
          <View style={s.emptyBlock}>
            <Text style={[{ color: theme.textSecondary, fontSize: 14 }]}>No active challenges right now</Text>
          </View>
        ) : (
          <FlatList
            data={challenges}
            keyExtractor={i => String(i.id)}
            renderItem={renderChallenge}
            scrollEnabled={false}
          />
        )}

        {/* XP Levels */}
        <Text style={[s.sectionTitle, { color: theme.text }]}>🎯 XP Levels</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
          {levels.map((l: any) => {
            const isMe = isStudent && myLevel?.currentLevel === l.levelNumber;
            return (
              <View
                key={l.id}
                style={[s.levelCard, { backgroundColor: l.colorHex + '22', borderColor: isMe ? l.colorHex : 'transparent', borderWidth: isMe ? 2 : 0 }]}
              >
                <View style={[s.levelCircle, { backgroundColor: l.colorHex }]}>
                  <Text style={s.levelNum}>{l.levelNumber}</Text>
                </View>
                <Text style={[s.levelName, { color: theme.text }]}>{l.levelName}</Text>
                <Text style={[s.levelXP, { color: theme.textMuted }]}>
                  {l.minXP >= 1000 ? `${(l.minXP / 1000).toFixed(0)}K` : l.minXP}+ XP
                </Text>
                {isMe && <Text style={[s.levelCurrent, { color: l.colorHex }]}>◉ YOU</Text>}
              </View>
            );
          })}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1 },
  xpHero:        { margin: 16, borderRadius: 16, padding: 20, alignItems: 'center' },
  xpLevel:       { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  xpName:        { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  xpXP:          { color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '700', marginTop: 6 },
  sectionTitle:  { fontSize: 16, fontWeight: '800', marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  challengeCard: { marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 14, borderWidth: 1 },
  row:           { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bigEmoji:      { fontSize: 26, marginTop: 2 },
  challengeTitle:{ fontSize: 14, fontWeight: '700', marginBottom: 3 },
  challengeDesc: { fontSize: 12, marginBottom: 6 },
  rewardRow:     { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  reward:        { fontSize: 11, fontWeight: '700' },
  checkmark:     { fontSize: 22 },
  progressRow:   { marginTop: 10, gap: 4 },
  progressBg:    { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 4 },
  progressText:  { fontSize: 11, textAlign: 'right' },
  emptyBlock:    { alignItems: 'center', paddingVertical: 24 },
  levelCard:     { width: 90, borderRadius: 14, padding: 12, marginRight: 12, alignItems: 'center', gap: 4 },
  levelCircle:   { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  levelNum:      { color: '#fff', fontWeight: '800', fontSize: 16 },
  levelName:     { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  levelXP:       { fontSize: 10, textAlign: 'center' },
  levelCurrent:  { fontSize: 10, fontWeight: '800' },
});
