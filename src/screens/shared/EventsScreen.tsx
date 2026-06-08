import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, useColorScheme, FlatList, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../theme/colors';
import { eventsApi } from '../../api/advanced';
import ScreenHeader from '../../components/ui/ScreenHeader';

const EVENT_TYPE_CONFIG: Record<string, { emoji: string; color: string }> = {
  HOLIDAY:        { emoji: '🏖️', color: '#ef4444' },
  EXAM:           { emoji: '📝', color: '#6366f1' },
  SPORTS:         { emoji: '⚽', color: '#10b981' },
  MEETING:        { emoji: '🤝', color: '#f59e0b' },
  CULTURAL:       { emoji: '🎭', color: '#8b5cf6' },
  ASSIGNMENT_DUE: { emoji: '📚', color: '#f97316' },
  PARENT_TEACHER: { emoji: '👨‍👩‍👧', color: '#06b6d4' },
  TRIP:           { emoji: '🚌', color: '#22c55e' },
  OTHER:          { emoji: '📌', color: '#9ca3af' },
};

const EVENT_TYPES = Object.keys(EVENT_TYPE_CONFIG);

const BLANK = { title: '', startDate: '', endDate: '', eventType: 'OTHER', location: '', audience: 'ALL' };

export default function EventsScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const { user } = useAuthStore();
  const role = user?.primaryRole ?? 'STUDENT';
  const canCreate = role === 'ADMIN' || role === 'TEACHER';
  const qc = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK);

  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.list().then(r => r.data?.data ?? []),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => eventsApi.create(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); setShowModal(false); setForm(BLANK); },
  });

  const events: any[] = data ?? [];

  const renderEvent = ({ item }: { item: any }) => {
    const cfg = EVENT_TYPE_CONFIG[item.eventType] ?? EVENT_TYPE_CONFIG.OTHER;
    return (
      <View style={[s.card, { backgroundColor: theme.card, borderLeftColor: cfg.color }]}>
        <View style={s.cardRow}>
          <Text style={s.emoji}>{cfg.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: theme.text }]}>{item.title}</Text>
            <Text style={[s.meta, { color: theme.textSecondary }]}>
              {item.startDate}{item.endDate !== item.startDate ? ` → ${item.endDate}` : ''}
            </Text>
            {item.location ? (
              <Text style={[s.meta, { color: theme.textMuted }]}>📍 {item.location}</Text>
            ) : null}
          </View>
          <View style={[s.typeBadge, { backgroundColor: cfg.color + '22' }]}>
            <Text style={[s.typeText, { color: cfg.color }]}>{item.eventType?.replace('_', ' ')}</Text>
          </View>
        </View>
        {item.description ? (
          <Text style={[s.desc, { color: theme.textSecondary }]} numberOfLines={2}>{item.description}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="School Calendar" />
      {canCreate && (
        <TouchableOpacity
          style={[s.addBtn, { backgroundColor: Colors.primary[500] }]}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={s.addBtnText}>Add Event</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary[500]} />
      ) : events.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>📅</Text>
          <Text style={[s.emptyText, { color: theme.textSecondary }]}>No events scheduled</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={i => String(i.id)}
          renderItem={renderEvent}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      {/* Add Event Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={[s.modal, { backgroundColor: theme.card }]}>
            <Text style={[s.modalTitle, { color: theme.text }]}>Add Event</Text>
            <TextInput
              style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Title *" placeholderTextColor={theme.textMuted}
              value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))}
            />
            <TextInput
              style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Start Date (YYYY-MM-DD) *" placeholderTextColor={theme.textMuted}
              value={form.startDate} onChangeText={v => setForm(f => ({ ...f, startDate: v }))}
            />
            <TextInput
              style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="End Date (YYYY-MM-DD)" placeholderTextColor={theme.textMuted}
              value={form.endDate} onChangeText={v => setForm(f => ({ ...f, endDate: v }))}
            />
            <TextInput
              style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Location" placeholderTextColor={theme.textMuted}
              value={form.location} onChangeText={v => setForm(f => ({ ...f, location: v }))}
            />
            <Text style={[s.label, { color: theme.textSecondary }]}>Event Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {EVENT_TYPES.map(t => {
                const sel = form.eventType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setForm(f => ({ ...f, eventType: t }))}
                    style={[s.chip, { backgroundColor: sel ? Colors.primary[500] : theme.background, borderColor: theme.border }]}
                  >
                    <Text style={{ color: sel ? '#fff' : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>
                      {EVENT_TYPE_CONFIG[t].emoji} {t.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.btnSecondary, { borderColor: theme.border }]} onPress={() => setShowModal(false)}>
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btnPrimary, { backgroundColor: Colors.primary[500] }]}
                onPress={() => createMutation.mutate(form)}
                disabled={!form.title || !form.startDate}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {createMutation.isPending ? 'Saving...' : 'Create'}
                </Text>
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
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, margin: 16, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, alignSelf: 'flex-start' },
  addBtnText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  card:        { marginHorizontal: 16, marginBottom: 12, borderRadius: 12, borderLeftWidth: 4, padding: 14 },
  cardRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  emoji:       { fontSize: 22, marginTop: 2 },
  title:       { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  meta:        { fontSize: 12, marginBottom: 1 },
  desc:        { fontSize: 12, marginTop: 6 },
  typeBadge:   { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeText:    { fontSize: 10, fontWeight: '700' },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyEmoji:  { fontSize: 48 },
  emptyText:   { fontSize: 16 },
  overlay:     { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modal:       { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
  modalTitle:  { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  input:       { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 12 },
  label:       { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  chip:        { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  modalBtns:   { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnPrimary:  { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  btnSecondary:{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
});
