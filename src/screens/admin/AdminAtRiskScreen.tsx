import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  useColorScheme, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../theme/colors';
import { academicIntelApi } from '../../api/advanced';
import ScreenHeader from '../../components/ui/ScreenHeader';

const RISK_LEVELS = [
  { label: 'Critical', min: 80, max: 100, color: '#ef4444', bg: '#fef2f2' },
  { label: 'High',     min: 60, max: 79,  color: '#f97316', bg: '#fff7ed' },
  { label: 'Medium',   min: 40, max: 59,  color: '#f59e0b', bg: '#fffbeb' },
  { label: 'Low',      min: 0,  max: 39,  color: '#10b981', bg: '#f0fdf4' },
];

function getRiskLevel(score: number) {
  return RISK_LEVELS.find(r => score >= r.min && score <= r.max) ?? RISK_LEVELS[3];
}

type FilterTab = 'ACTIVE' | 'RESOLVED' | 'DISMISSED';

export default function AdminAtRiskScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const qc = useQueryClient();

  const [tab, setTab] = useState<FilterTab>('ACTIVE');
  const [showCreate, setShowCreate] = useState(false);
  const [showResolve, setShowResolve] = useState<any>(null);
  const [form, setForm] = useState({ studentId: '', riskScore: '', riskFactors: '', notes: '' });
  const [resolveNote, setResolveNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['at-risk', tab],
    queryFn: () => academicIntelApi.getAtRisk(tab).then(r => r.data?.data ?? []),
  });

  const createMut = useMutation({
    mutationFn: academicIntelApi.createAtRisk,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['at-risk'] }); setShowCreate(false); },
  });

  const resolveMut = useMutation({
    mutationFn: ({ id, notes }: any) => academicIntelApi.resolveAtRisk(id, notes),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['at-risk'] }); setShowResolve(null); },
  });

  const dismissMut = useMutation({
    mutationFn: academicIntelApi.dismissAtRisk,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['at-risk'] }),
  });

  const flags: any[] = data ?? [];

  const renderFlag = ({ item }: { item: any }) => {
    const rl = getRiskLevel(item.riskScore ?? 0);
    const factors: string[] = (item.riskFactors ?? '').split(',').filter(Boolean);
    return (
      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={s.cardTop}>
          <View style={[s.badge, { backgroundColor: rl.color + '22' }]}>
            <Text style={[s.badgeText, { color: rl.color }]}>{rl.label}</Text>
          </View>
          <View style={s.scoreCircle}>
            <Text style={[s.scoreNum, { color: rl.color }]}>{item.riskScore}</Text>
          </View>
        </View>
        <Text style={[s.studentId, { color: theme.text }]}>Student #{item.studentId}</Text>
        {factors.length > 0 && (
          <View style={s.factorsRow}>
            {factors.map((f, i) => (
              <View key={i} style={[s.factorChip, { backgroundColor: rl.color + '15' }]}>
                <Text style={[s.factorText, { color: rl.color }]}>{f.trim()}</Text>
              </View>
            ))}
          </View>
        )}
        {item.notes ? (
          <Text style={[s.notes, { color: theme.textSecondary }]}>{item.notes}</Text>
        ) : null}
        {tab === 'ACTIVE' && (
          <View style={s.actionsRow}>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: '#10b981' }]}
              onPress={() => { setShowResolve(item); setResolveNote(''); }}
            >
              <Ionicons name="checkmark-circle-outline" size={15} color="#fff" />
              <Text style={s.actionBtnText}>Resolve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: '#9ca3af' }]}
              onPress={() => dismissMut.mutate(item.id)}
            >
              <Ionicons name="close-circle-outline" size={15} color="#fff" />
              <Text style={s.actionBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}
        {item.resolvedAt && (
          <Text style={[s.resolvedAt, { color: theme.textMuted }]}>
            ✓ Resolved {item.resolvedAt?.substring(0, 10)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="At-Risk Students" />

      {/* Filter tabs */}
      <View style={[s.tabs, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {(['ACTIVE', 'RESOLVED', 'DISMISSED'] as FilterTab[]).map(t => (
          <TouchableOpacity
            key={t} onPress={() => setTab(t)}
            style={[s.tabItem, tab === t && { backgroundColor: Colors.primary[500] }]}
          >
            <Text style={{ color: tab === t ? '#fff' : theme.textSecondary, fontWeight: '600', fontSize: 12 }}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[s.addBtn, { backgroundColor: Colors.primary[500] }]}
        onPress={() => { setShowCreate(true); setForm({ studentId: '', riskScore: '', riskFactors: '', notes: '' }); }}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={s.addBtnText}>Flag Student</Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary[500]} />
      ) : flags.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 40 }}>🎉</Text>
          <Text style={[{ color: theme.textSecondary, fontSize: 15, textAlign: 'center' }]}>
            No {tab.toLowerCase()} flags
          </Text>
        </View>
      ) : (
        <FlatList
          data={flags}
          keyExtractor={i => String(i.id)}
          renderItem={renderFlag}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      {/* Create Flag Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={[s.modal, { backgroundColor: theme.card }]}>
            <Text style={[s.modalTitle, { color: theme.text }]}>Flag At-Risk Student</Text>
            <TextInput style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Student ID *" placeholderTextColor={theme.textMuted}
              value={form.studentId} onChangeText={v => setForm(f => ({ ...f, studentId: v }))}
              keyboardType="numeric"
            />
            <TextInput style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Risk Score (0-100) *" placeholderTextColor={theme.textMuted}
              value={form.riskScore} onChangeText={v => setForm(f => ({ ...f, riskScore: v }))}
              keyboardType="numeric"
            />
            <TextInput style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Risk Factors (comma-separated)" placeholderTextColor={theme.textMuted}
              value={form.riskFactors} onChangeText={v => setForm(f => ({ ...f, riskFactors: v }))}
            />
            <TextInput style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background, minHeight: 70 }]}
              placeholder="Notes (optional)" placeholderTextColor={theme.textMuted}
              value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))}
              multiline
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.btnSecondary, { borderColor: theme.border }]} onPress={() => setShowCreate(false)}>
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btnPrimary, { backgroundColor: Colors.primary[500] }]}
                onPress={() => createMut.mutate({ studentId: Number(form.studentId), riskScore: Number(form.riskScore), riskFactors: form.riskFactors, notes: form.notes })}
                disabled={!form.studentId || !form.riskScore}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Flag Student</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Resolve Modal */}
      <Modal visible={!!showResolve} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={[s.modal, { backgroundColor: theme.card }]}>
            <Text style={[s.modalTitle, { color: theme.text }]}>Resolve Flag</Text>
            <Text style={[{ color: theme.textSecondary, marginBottom: 12, fontSize: 13 }]}>
              Student #{showResolve?.studentId}
            </Text>
            <TextInput style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background, minHeight: 80 }]}
              placeholder="Resolution notes (optional)" placeholderTextColor={theme.textMuted}
              value={resolveNote} onChangeText={setResolveNote} multiline
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.btnSecondary, { borderColor: theme.border }]} onPress={() => setShowResolve(null)}>
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btnPrimary, { backgroundColor: '#10b981' }]}
                onPress={() => resolveMut.mutate({ id: showResolve.id, notes: resolveNote })}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Mark Resolved</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1 },
  tabs:        { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 12, borderWidth: 1, padding: 3 },
  tabItem:     { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, margin: 16, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, alignSelf: 'flex-start' },
  addBtnText:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  card:        { marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 14, borderWidth: 1 },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText:   { fontSize: 12, fontWeight: '700' },
  scoreCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  scoreNum:    { fontSize: 16, fontWeight: '900' },
  studentId:   { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  factorsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  factorChip:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  factorText:  { fontSize: 11, fontWeight: '600' },
  notes:       { fontSize: 12, marginBottom: 8, fontStyle: 'italic' },
  actionsRow:  { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 10 },
  actionBtnText:{ color: '#fff', fontWeight: '700', fontSize: 12 },
  resolvedAt:  { fontSize: 11, marginTop: 4 },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 60 },
  overlay:     { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modal:       { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle:  { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  input:       { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 12 },
  modalBtns:   { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnPrimary:  { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  btnSecondary:{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
});
