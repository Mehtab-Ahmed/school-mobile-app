import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, useColorScheme, ActivityIndicator, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../theme/colors';
import { ptmApi } from '../../api/advanced';
import ScreenHeader from '../../components/ui/ScreenHeader';

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: '#f59e0b', CONFIRMED: '#3b82f6', COMPLETED: '#10b981', CANCELLED: '#ef4444',
};

export default function PTMScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const { user } = useAuthStore();
  const role = user?.primaryRole ?? 'STUDENT';
  const isParent  = role === 'PARENT';
  const isTeacher = role === 'TEACHER';
  const qc = useQueryClient();

  const [showRequest, setShowRequest] = useState(false);
  const [showConfirm, setShowConfirm] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState<any>(null);
  const [reqForm, setReqForm]    = useState({ teacherId: '', title: '', notes: '' });
  const [confForm, setConfForm]  = useState({ scheduledDate: '', meetingLink: '' });
  const [stars, setStars]        = useState(0);
  const [comment, setComment]    = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['ptm-meetings'],
    queryFn: () => ptmApi.getMyMeetings().then(r => r.data?.data ?? []),
  });

  const requestMut  = useMutation({ mutationFn: ptmApi.requestMeeting,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ptm-meetings'] }); setShowRequest(false); } });
  const confirmMut  = useMutation({ mutationFn: ({ id, data }: any) => ptmApi.confirmMeeting(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ptm-meetings'] }); setShowConfirm(null); } });
  const completeMut = useMutation({ mutationFn: ({ id, notes }: any) => ptmApi.completeMeeting(id, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ptm-meetings'] }) });
  const cancelMut   = useMutation({ mutationFn: ptmApi.cancelMeeting,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ptm-meetings'] }) });
  const feedbackMut = useMutation({ mutationFn: ptmApi.submitFeedback,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ptm-meetings'] }); setShowFeedback(null); } });

  const meetings: any[] = data ?? [];

  const renderMeeting = ({ item }: { item: any }) => {
    const sc = STATUS_COLORS[item.status] ?? '#9ca3af';
    return (
      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={s.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={[s.meetTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={[s.meetSub, { color: theme.textSecondary }]}>
              P: {item.parentId} · T: {item.teacherId}
            </Text>
            {item.scheduledDate ? (
              <Text style={[s.meetSub, { color: theme.textSecondary }]}>
                📅 {item.scheduledDate?.substring(0, 16)?.replace('T', ' ')}
              </Text>
            ) : null}
          </View>
          <View style={[s.statusBadge, { backgroundColor: sc + '22' }]}>
            <Text style={[s.statusText, { color: sc }]}>{item.status}</Text>
          </View>
        </View>

        {/* Meeting link */}
        {item.meetingLink && item.status === 'CONFIRMED' && (
          <TouchableOpacity
            style={[s.linkBtn, { backgroundColor: Colors.primary[500] + '22' }]}
            onPress={() => Linking.openURL(item.meetingLink)}
          >
            <Ionicons name="videocam-outline" size={14} color={Colors.primary[500]} />
            <Text style={[s.linkText, { color: Colors.primary[500] }]}>Join Meeting</Text>
          </TouchableOpacity>
        )}

        {/* Teacher actions */}
        {isTeacher && item.status === 'REQUESTED' && (
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: Colors.primary[500] }]}
            onPress={() => { setShowConfirm(item); setConfForm({ scheduledDate: '', meetingLink: '' }); }}
          >
            <Text style={s.actionBtnText}>Confirm Meeting</Text>
          </TouchableOpacity>
        )}
        {isTeacher && item.status === 'CONFIRMED' && (
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: Colors.success }]}
            onPress={() => completeMut.mutate({ id: item.id, notes: 'Completed' })}
          >
            <Text style={s.actionBtnText}>Mark Complete</Text>
          </TouchableOpacity>
        )}

        {/* Parent: feedback button */}
        {isParent && item.status === 'COMPLETED' && (
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: Colors.warning }]}
            onPress={() => { setShowFeedback(item); setStars(0); setComment(''); }}
          >
            <Text style={s.actionBtnText}>Leave Feedback ⭐</Text>
          </TouchableOpacity>
        )}

        {/* Cancel */}
        {item.status !== 'COMPLETED' && item.status !== 'CANCELLED' && (
          <TouchableOpacity onPress={() => cancelMut.mutate(item.id)}>
            <Text style={[s.cancelText, { color: Colors.danger }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="PTM Meetings" />

      {isParent && (
        <TouchableOpacity
          style={[s.addBtn, { backgroundColor: Colors.primary[500] }]}
          onPress={() => { setShowRequest(true); setReqForm({ teacherId: '', title: '', notes: '' }); }}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={s.addBtnText}>Request Meeting</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary[500]} />
      ) : meetings.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 40 }}>🤝</Text>
          <Text style={[{ color: theme.textSecondary, fontSize: 15 }]}>No meetings yet</Text>
        </View>
      ) : (
        <FlatList
          data={meetings}
          keyExtractor={i => String(i.id)}
          renderItem={renderMeeting}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      {/* Request Modal */}
      <Modal visible={showRequest} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={[s.modal, { backgroundColor: theme.card }]}>
            <Text style={[s.modalTitle, { color: theme.text }]}>Request Meeting</Text>
            <TextInput style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Teacher ID *" placeholderTextColor={theme.textMuted}
              value={reqForm.teacherId} onChangeText={v => setReqForm(f => ({ ...f, teacherId: v }))}
              keyboardType="numeric"
            />
            <TextInput style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Meeting title *" placeholderTextColor={theme.textMuted}
              value={reqForm.title} onChangeText={v => setReqForm(f => ({ ...f, title: v }))}
            />
            <TextInput style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background, minHeight: 80 }]}
              placeholder="Notes (optional)" placeholderTextColor={theme.textMuted}
              value={reqForm.notes} onChangeText={v => setReqForm(f => ({ ...f, notes: v }))}
              multiline
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.btnSecondary, { borderColor: theme.border }]} onPress={() => setShowRequest(false)}>
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btnPrimary, { backgroundColor: Colors.primary[500] }]}
                onPress={() => requestMut.mutate({ teacherId: Number(reqForm.teacherId), title: reqForm.title, notes: reqForm.notes })}
                disabled={!reqForm.teacherId || !reqForm.title}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Send Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Modal */}
      <Modal visible={!!showConfirm} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={[s.modal, { backgroundColor: theme.card }]}>
            <Text style={[s.modalTitle, { color: theme.text }]}>Confirm Meeting</Text>
            <TextInput style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Date & time (YYYY-MM-DDTHH:MM) *" placeholderTextColor={theme.textMuted}
              value={confForm.scheduledDate} onChangeText={v => setConfForm(f => ({ ...f, scheduledDate: v }))}
            />
            <TextInput style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Meeting link (https://...)" placeholderTextColor={theme.textMuted}
              value={confForm.meetingLink} onChangeText={v => setConfForm(f => ({ ...f, meetingLink: v }))}
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.btnSecondary, { borderColor: theme.border }]} onPress={() => setShowConfirm(null)}>
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btnPrimary, { backgroundColor: Colors.primary[500] }]}
                onPress={() => confirmMut.mutate({ id: showConfirm.id, data: confForm })}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal visible={!!showFeedback} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={[s.modal, { backgroundColor: theme.card }]}>
            <Text style={[s.modalTitle, { color: theme.text }]}>Teacher Feedback</Text>
            <View style={s.starsRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setStars(n)} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 32 }}>{n <= stars ? '⭐' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background, minHeight: 80 }]}
              placeholder="Comment (optional)" placeholderTextColor={theme.textMuted}
              value={comment} onChangeText={setComment} multiline
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.btnSecondary, { borderColor: theme.border }]} onPress={() => setShowFeedback(null)}>
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btnPrimary, { backgroundColor: Colors.warning }]}
                onPress={() => feedbackMut.mutate({ teacherId: showFeedback.teacherId, studentId: showFeedback.studentId, rating: stars, comment, meetingId: showFeedback.id })}
                disabled={stars === 0}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Submit</Text>
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
  card:        { marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 14, borderWidth: 1 },
  cardTop:     { flexDirection: 'row', gap: 10, marginBottom: 10 },
  meetTitle:   { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  meetSub:     { fontSize: 12, marginBottom: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' },
  statusText:  { fontSize: 11, fontWeight: '700' },
  linkBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8, marginBottom: 8 },
  linkText:    { fontSize: 13, fontWeight: '700' },
  actionBtn:   { paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginBottom: 6 },
  actionBtnText:{ color: '#fff', fontWeight: '700', fontSize: 13 },
  cancelText:  { textAlign: 'center', fontSize: 12, marginTop: 4, padding: 4 },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  overlay:     { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modal:       { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle:  { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  input:       { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 12 },
  starsRow:    { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  modalBtns:   { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnPrimary:  { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  btnSecondary:{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
});
