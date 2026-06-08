import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, useColorScheme, TextInput, Switch,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { behaviorApi, BehaviorRemark } from '../../api/gamification';
import { Colors } from '../../theme/colors';
import { Button } from '../../components/ui/Button';

const CATEGORIES = ['ACADEMIC', 'DISCIPLINE', 'SOCIAL', 'SPORTS', 'PUNCTUALITY', 'PARTICIPATION'];
const CAT_ICONS: Record<string, string> = {
  ACADEMIC: '📚', DISCIPLINE: '⚖️', SOCIAL: '🤝',
  SPORTS: '⚽', PUNCTUALITY: '⏰', PARTICIPATION: '🙋',
};

const POSITIVE_PRESETS = [
  { title: 'Excellent participation', points: 5 },
  { title: 'Helped a classmate', points: 3 },
  { title: 'Outstanding performance', points: 8 },
  { title: 'Great attitude', points: 3 },
  { title: 'Class leader', points: 5 },
];

const NEGATIVE_PRESETS = [
  { title: 'Disrupted class', points: -5 },
  { title: 'Late to class', points: -2 },
  { title: 'Not completing work', points: -3 },
  { title: 'Disrespectful behavior', points: -8 },
  { title: 'Using phone in class', points: -3 },
];

interface Props {
  studentId: number;
  studentName: string;
  onClose: () => void;
}

export default function BehaviorRemarkScreen({ studentId, studentName, onClose }: Props) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const qc = useQueryClient();

  const [remarkType, setRemarkType] = useState<'POSITIVE' | 'NEGATIVE'>('POSITIVE');
  const [category, setCategory] = useState('ACADEMIC');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(5);
  const [visibleToParent, setVisibleToParent] = useState(true);
  const [tab, setTab] = useState<'add' | 'history'>('add');

  const remarksQuery = useQuery({
    queryKey: ['remarks', studentId],
    queryFn: () => behaviorApi.getStudentRemarks(studentId).then(r => r.data?.data ?? []),
    enabled: tab === 'history',
  });

  const mutation = useMutation({
    mutationFn: () => behaviorApi.addRemark({
      studentId,
      remarkType,
      category: category as any,
      title,
      description: description || undefined,
      pointsImpact: remarkType === 'POSITIVE' ? Math.abs(points) : -Math.abs(points),
      visibleToParent,
    }),
    onSuccess: () => {
      Alert.alert('Success', 'Remark added!');
      setTitle(''); setDescription('');
      qc.invalidateQueries({ queryKey: ['remarks', studentId] });
      qc.invalidateQueries({ queryKey: ['gamification'] });
    },
    onError: () => Alert.alert('Error', 'Could not add remark. Try again.'),
  });

  const presets = remarkType === 'POSITIVE' ? POSITIVE_PRESETS : NEGATIVE_PRESETS;

  return (
    <ScrollView style={[s.container, { backgroundColor: theme.background }]} keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <Text style={[s.title, { color: theme.text }]}>Behavior Remark</Text>
        <Text style={[s.subtitle, { color: theme.textSecondary }]}>{studentName}</Text>
      </View>

      {/* Tabs */}
      <View style={[s.tabs, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {(['add', 'history'] as const).map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)}
            style={[s.tab, tab === t && { backgroundColor: Colors.primary[500] }]}>
            <Text style={{ color: tab === t ? '#fff' : theme.textSecondary, fontWeight: '600', fontSize: 13 }}>
              {t === 'add' ? '➕ Add Remark' : '📋 History'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'add' ? (
        <View style={s.form}>
          {/* Positive / Negative toggle */}
          <View style={s.typeRow}>
            {(['POSITIVE', 'NEGATIVE'] as const).map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => { setRemarkType(type); setPoints(type === 'POSITIVE' ? 5 : 5); }}
                style={[
                  s.typeBtn,
                  remarkType === type && {
                    backgroundColor: type === 'POSITIVE' ? '#10b981' : '#ef4444',
                    borderColor: type === 'POSITIVE' ? '#10b981' : '#ef4444',
                  },
                  { borderColor: theme.border },
                ]}
              >
                <Text style={{ color: remarkType === type ? '#fff' : theme.text, fontWeight: '700' }}>
                  {type === 'POSITIVE' ? '👍 Positive' : '👎 Negative'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick presets */}
          <Text style={[s.label, { color: theme.textSecondary }]}>Quick Presets</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.presets}>
            {presets.map(p => (
              <TouchableOpacity
                key={p.title}
                onPress={() => { setTitle(p.title); setPoints(Math.abs(p.points)); }}
                style={[s.preset, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <Text style={[s.presetText, { color: theme.text }]}>{p.title}</Text>
                <Text style={{ color: remarkType === 'POSITIVE' ? '#10b981' : '#ef4444', fontSize: 11 }}>
                  {remarkType === 'POSITIVE' ? '+' : '−'}{Math.abs(p.points)} pts
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Category */}
          <Text style={[s.label, { color: theme.textSecondary }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={[s.catChip, category === c && { backgroundColor: Colors.primary[500] },
                        { borderColor: theme.border }]}
              >
                <Text style={{ fontSize: 11, color: category === c ? '#fff' : theme.text }}>
                  {CAT_ICONS[c]} {c}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Title */}
          <Text style={[s.label, { color: theme.textSecondary }]}>Title *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Describe the behavior..."
            placeholderTextColor={theme.textMuted}
            style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
          />

          {/* Description */}
          <Text style={[s.label, { color: theme.textSecondary }]}>Details (optional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Additional context..."
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={3}
            style={[s.input, s.textarea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
          />

          {/* Points */}
          <Text style={[s.label, { color: theme.textSecondary }]}>
            Points Impact: {remarkType === 'POSITIVE' ? '+' : '−'}{points}
          </Text>
          <View style={s.pointsRow}>
            {[1, 2, 3, 5, 8, 10].map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => setPoints(p)}
                style={[s.ptBtn, points === p && { backgroundColor: Colors.primary[500] },
                        { borderColor: theme.border }]}
              >
                <Text style={{ color: points === p ? '#fff' : theme.text, fontWeight: '700' }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Visible to parent */}
          <View style={s.switchRow}>
            <Text style={[s.label, { color: theme.text, marginBottom: 0 }]}>Visible to parent</Text>
            <Switch value={visibleToParent} onValueChange={setVisibleToParent}
              trackColor={{ true: Colors.primary[500] }} />
          </View>

          <Button
            label={mutation.isPending ? 'Saving...' : 'Add Remark'}
            onPress={() => {
              if (!title.trim()) { Alert.alert('Error', 'Please enter a title'); return; }
              mutation.mutate();
            }}
            loading={mutation.isPending}
            fullWidth
            style={{ marginTop: 8 }}
          />
        </View>
      ) : (
        <View style={s.history}>
          {remarksQuery.isLoading ? (
            <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>Loading...</Text>
          ) : (remarksQuery.data ?? []).length === 0 ? (
            <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>No remarks yet</Text>
          ) : (
            (remarksQuery.data ?? []).map((r: BehaviorRemark) => (
              <View key={r.id} style={[s.remarkCard, {
                backgroundColor: theme.card, borderColor: theme.border,
                borderLeftColor: r.remarkType === 'POSITIVE' ? '#10b981' : '#ef4444',
              }]}>
                <View style={s.remarkHeader}>
                  <Text style={{ fontSize: 12, color: r.remarkType === 'POSITIVE' ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                    {r.remarkType === 'POSITIVE' ? '👍' : '👎'} {r.remarkType}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                    {r.pointsImpact > 0 ? '+' : ''}{r.pointsImpact} pts
                  </Text>
                </View>
                <Text style={[s.remarkTitle, { color: theme.text }]}>{r.title}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1 },
  header:      { padding: 16, paddingBottom: 8 },
  title:       { fontSize: 20, fontWeight: '800' },
  subtitle:    { fontSize: 13, marginTop: 2 },
  tabs:        { flexDirection: 'row', margin: 16, borderRadius: 12, borderWidth: 1, padding: 3 },
  tab:         { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  form:        { padding: 16, gap: 8 },
  typeRow:     { flexDirection: 'row', gap: 10, marginBottom: 4 },
  typeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 12, borderWidth: 1.5,
  },
  label:       { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  presets:     { marginBottom: 4 },
  preset: {
    borderRadius: 10, borderWidth: 1, padding: 8,
    marginRight: 8, minWidth: 120, alignItems: 'center',
  },
  presetText:  { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  catRow:      { marginBottom: 4 },
  catChip: {
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 10,
    paddingVertical: 6, marginRight: 6,
  },
  input: {
    borderWidth: 1, borderRadius: 10, padding: 10,
    fontSize: 14,
  },
  textarea:    { minHeight: 80, textAlignVertical: 'top' },
  pointsRow:   { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  ptBtn: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, borderWidth: 1.5,
  },
  switchRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  history:     { padding: 16, gap: 8 },
  remarkCard: {
    borderRadius: 12, borderWidth: 1, borderLeftWidth: 4,
    padding: 12, gap: 4,
  },
  remarkHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  remarkTitle:  { fontSize: 14, fontWeight: '600' },
});
