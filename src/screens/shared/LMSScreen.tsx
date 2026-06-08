import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Linking,
  Modal, TextInput, useColorScheme, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../theme/colors';
import { lmsApi } from '../../api/advanced';
import ScreenHeader from '../../components/ui/ScreenHeader';

const CONTENT_EMOJI: Record<string, string> = {
  PDF: '📄', VIDEO: '▶️', LINK: '🔗', IMAGE: '🖼️',
  DOC: '📝', PRESENTATION: '📊', OTHER: '📁',
};
const CONTENT_COLORS: Record<string, string> = {
  PDF: '#ef4444', VIDEO: '#3b82f6', LINK: '#10b981', IMAGE: '#ec4899',
  DOC: '#6366f1', PRESENTATION: '#f97316', OTHER: '#9ca3af',
};
const CONTENT_TYPES = Object.keys(CONTENT_EMOJI);
const BLANK = { title: '', fileUrl: '', contentType: 'OTHER', topicTag: '', description: '' };

export default function LMSScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const { user } = useAuthStore();
  const role = user?.primaryRole ?? 'STUDENT';
  const canCreate = role === 'ADMIN' || role === 'TEACHER';
  const isStudent = role === 'STUDENT';
  const qc = useQueryClient();

  const [tab, setTab] = useState<'all' | 'bookmarks'>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK);

  const { data: allData, isLoading } = useQuery({
    queryKey: ['lms-all'],
    queryFn: () => lmsApi.list().then(r => r.data?.data ?? []),
    enabled: tab === 'all',
  });

  const { data: bookmarkData } = useQuery({
    queryKey: ['lms-bookmarks'],
    queryFn: () => lmsApi.myBookmarks().then(r => r.data?.data ?? []),
    enabled: isStudent && tab === 'bookmarks',
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => lmsApi.create(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lms-all'] }); setShowModal(false); setForm(BLANK); },
  });

  const bookmarkMutation = useMutation({
    mutationFn: (id: number) => lmsApi.toggleBookmark(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lms-bookmarks'] }); },
  });

  const rawList: any[] = tab === 'bookmarks' ? (bookmarkData ?? []) : (allData ?? []);
  const materials = rawList.filter(m =>
    !search || m.title?.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: any }) => {
    const color = CONTENT_COLORS[item.contentType] ?? CONTENT_COLORS.OTHER;
    return (
      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={s.row}>
          <View style={[s.iconBox, { backgroundColor: color + '22' }]}>
            <Text style={s.typeEmoji}>{CONTENT_EMOJI[item.contentType] ?? '📁'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
            {item.topicTag ? (
              <View style={[s.tag, { backgroundColor: color + '22' }]}>
                <Text style={[s.tagText, { color }]}>{item.topicTag}</Text>
              </View>
            ) : null}
            <Text style={[s.meta, { color: theme.textMuted }]}>
              {item.contentType} · {item.createdAt?.substring(0, 10)}
            </Text>
          </View>
          <View style={s.actions}>
            {isStudent && (
              <TouchableOpacity
                onPress={() => bookmarkMutation.mutate(item.id)}
                style={{ padding: 6 }}
              >
                <Ionicons name="star-outline" size={18} color={Colors.warning} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => Linking.openURL(item.fileUrl)}
              style={[s.openBtn, { backgroundColor: Colors.primary[500] }]}
            >
              <Ionicons name="open-outline" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Study Materials" />

      {/* Search */}
      <View style={[s.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={16} color={theme.textMuted} />
        <TextInput
          style={[s.searchInput, { color: theme.text }]}
          placeholder="Search materials..." placeholderTextColor={theme.textMuted}
          value={search} onChangeText={setSearch}
        />
      </View>

      {/* Tabs for student */}
      {isStudent && (
        <View style={[s.tabs, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {(['all', 'bookmarks'] as const).map(t => (
            <TouchableOpacity
              key={t} onPress={() => setTab(t)}
              style={[s.tab, tab === t && { backgroundColor: Colors.primary[500] }]}
            >
              <Text style={{ color: tab === t ? '#fff' : theme.textSecondary, fontWeight: '600', fontSize: 13 }}>
                {t === 'all' ? '📚 All' : '⭐ Bookmarks'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {canCreate && (
        <TouchableOpacity
          style={[s.addBtn, { backgroundColor: Colors.primary[500] }]}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
          <Text style={s.addBtnText}>Upload Material</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary[500]} />
      ) : materials.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 40 }}>📭</Text>
          <Text style={[{ color: theme.textSecondary, fontSize: 15 }]}>No materials found</Text>
        </View>
      ) : (
        <FlatList
          data={materials}
          keyExtractor={i => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      {/* Upload Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={[s.modal, { backgroundColor: theme.card }]}>
            <Text style={[s.modalTitle, { color: theme.text }]}>Upload Material</Text>
            {(['title', 'fileUrl', 'topicTag'] as const).map(f => (
              <TextInput
                key={f}
                style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder={f === 'fileUrl' ? 'File URL (https://)' : f.charAt(0).toUpperCase() + f.slice(1)}
                placeholderTextColor={theme.textMuted}
                value={form[f]} onChangeText={v => setForm(x => ({ ...x, [f]: v }))}
              />
            ))}
            <Text style={[s.label, { color: theme.textSecondary }]}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {CONTENT_TYPES.map(t => {
                const sel = form.contentType === t;
                return (
                  <TouchableOpacity
                    key={t} onPress={() => setForm(x => ({ ...x, contentType: t }))}
                    style={[s.chip, { backgroundColor: sel ? Colors.primary[500] : theme.background, borderColor: theme.border }]}
                  >
                    <Text style={{ color: sel ? '#fff' : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>
                      {CONTENT_EMOJI[t]} {t}
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
                disabled={!form.title || !form.fileUrl}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {createMutation.isPending ? 'Uploading...' : 'Upload'}
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
  container:  { flex: 1 },
  searchBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  searchInput:{ flex: 1, fontSize: 14 },
  tabs:       { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, borderWidth: 1, padding: 3 },
  tab:        { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  addBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, alignSelf: 'flex-start' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card:       { marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 14, borderWidth: 1 },
  row:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox:    { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  typeEmoji:  { fontSize: 22 },
  title:      { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  tag:        { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 4 },
  tagText:    { fontSize: 11, fontWeight: '700' },
  meta:       { fontSize: 11 },
  actions:    { alignItems: 'center', gap: 6 },
  openBtn:    { padding: 7, borderRadius: 8 },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  overlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modal:      { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  input:      { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 12 },
  label:      { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  chip:       { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  modalBtns:  { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnPrimary: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  btnSecondary:{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
});
