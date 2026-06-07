import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme,
  Alert, Modal, FlatList, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { communicationApi } from '../../api/communication';
import { leavesApi } from '../../api/academic';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { Badge, statusVariant } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  action: () => void;
};

export default function MoreScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const { user, logout } = useAuthStore();
  const qc = useQueryClient();

  const [showAnn, setShowAnn] = useState(false);
  const [showLeaves, setShowLeaves] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showApplyLeave, setShowApplyLeave] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });

  const { data: annData } = useQuery({
    queryKey: ['ann-all'],
    queryFn: () => communicationApi.announcements(),
  });

  const { data: notifData, refetch: refetchNotif } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => communicationApi.notifications(),
  });

  const { data: leavesData, refetch: refetchLeaves } = useQuery({
    queryKey: ['my-leaves'],
    queryFn: () => leavesApi.myApplications(),
    enabled: showLeaves,
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      leavesApi.apply({
        leaveTypeId: 1,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason,
      }),
    onSuccess: () => {
      Alert.alert('✅ Applied', 'Leave application submitted successfully.');
      setShowApplyLeave(false);
      setLeaveForm({ startDate: '', endDate: '', reason: '' });
      qc.invalidateQueries({ queryKey: ['my-leaves'] });
    },
    onError: () => Alert.alert('Error', 'Failed to apply for leave.'),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => communicationApi.markRead(id),
    onSuccess: () => refetchNotif(),
  });

  const announcements = annData?.data?.data ?? [];
  const notifications = notifData?.data?.data ?? [];
  const leaves = leavesData?.data?.data ?? [];
  const unread = notifications.filter((n) => !n.read).length;

  const doLogout = () =>
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);

  const role = user?.primaryRole;
  const canApplyLeave = role === 'TEACHER' || role === 'ADMIN';

  const menuItems: MenuItem[] = [
    {
      icon: 'megaphone-outline',
      label: 'Announcements',
      color: Colors.primary[500],
      action: () => setShowAnn(true),
    },
    {
      icon: 'notifications-outline',
      label: `Notifications${unread > 0 ? ` (${unread})` : ''}`,
      color: Colors.info,
      action: () => setShowNotifications(true),
    },
    ...(canApplyLeave ? [{
      icon: 'calendar-outline' as keyof typeof Ionicons.glyphMap,
      label: 'Leave Applications',
      color: Colors.warning,
      action: () => setShowLeaves(true),
    }] : []),
    {
      icon: 'log-out-outline',
      label: 'Logout',
      color: Colors.danger,
      action: doLogout,
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <Card style={styles.profileCard}>
        <Avatar name={user?.fullName ?? 'User'} size={64} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.profileName, { color: theme.text }]}>{user?.fullName}</Text>
          <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: Colors.primary[500] }]}>
            <Text style={styles.roleText}>{user?.primaryRole}</Text>
          </View>
        </View>
      </Card>

      {/* Menu */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.label}
          onPress={item.action}
          activeOpacity={0.8}
          style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <View style={[styles.menuIcon, { backgroundColor: item.color + '22' }]}>
            <Ionicons name={item.icon} size={22} color={item.color} />
          </View>
          <Text style={[styles.menuLabel, { color: item.color === Colors.danger ? Colors.danger : theme.text }]}>
            {item.label}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        </TouchableOpacity>
      ))}

      {/* App info */}
      <Card style={[styles.infoCard, { backgroundColor: theme.surface2 } as any]} padding={14}>
        <Text style={[styles.infoText, { color: theme.textMuted }]}>
          School ERP v1.0 · React Native + Expo{'\n'}Backend: Spring Boot 3.2
        </Text>
      </Card>

      {/* Announcements Modal */}
      <Modal visible={showAnn} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Announcements</Text>
            <TouchableOpacity onPress={() => setShowAnn(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={announcements}
            keyExtractor={(a) => String(a.id)}
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
            ListEmptyComponent={<EmptyState icon="megaphone-outline" title="No announcements" />}
            renderItem={({ item }) => (
              <Card style={{ gap: 8 }}>
                <View style={styles.annRow}>
                  <Badge
                    label={item.priority}
                    variant={item.priority === 'URGENT' ? 'danger' : item.priority === 'HIGH' ? 'warning' : 'info'}
                    small
                  />
                  <Text style={[styles.annDate, { color: theme.textMuted }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.annTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.annContent, { color: theme.textSecondary }]}>{item.content}</Text>
              </Card>
            )}
          />
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={showNotifications} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Notifications</Text>
            <TouchableOpacity onPress={() => setShowNotifications(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={notifications}
            keyExtractor={(n) => String(n.id)}
            contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
            ListEmptyComponent={<EmptyState icon="notifications-outline" title="No notifications" />}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => !item.read && markReadMutation.mutate(item.id)}>
                <Card style={[styles.notifCard, !item.read ? { borderLeftWidth: 3, borderLeftColor: Colors.primary[500] } : {}]}>
                  <View style={styles.notifRow}>
                    <View style={[styles.notifDot, { backgroundColor: item.read ? theme.surface2 : Colors.primary[500] }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.notifTitle, { color: theme.text }]}>{item.title}</Text>
                      <Text style={[styles.notifMsg, { color: theme.textSecondary }]} numberOfLines={2}>{item.message}</Text>
                      <Text style={[styles.notifDate, { color: theme.textMuted }]}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Leaves Modal */}
      <Modal visible={showLeaves} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Leave Applications</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => setShowApplyLeave(true)} style={[styles.addBtn, { backgroundColor: Colors.primary[500] }]}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowLeaves(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>
          <FlatList
            data={leaves}
            keyExtractor={(l) => String(l.id)}
            contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
            ListEmptyComponent={<EmptyState icon="calendar-outline" title="No leave applications" />}
            onRefresh={refetchLeaves}
            refreshing={false}
            renderItem={({ item }) => (
              <Card style={{ gap: 8 }}>
                <View style={styles.leaveTop}>
                  <Text style={[styles.leaveType, { color: theme.text }]}>{item.leaveType?.name ?? 'Leave'}</Text>
                  <Badge label={item.status} variant={statusVariant(item.status)} small />
                </View>
                <Text style={[styles.leaveDates, { color: theme.textSecondary }]}>
                  {item.startDate} → {item.endDate}
                </Text>
                <Text style={[styles.leaveReason, { color: theme.textMuted }]} numberOfLines={2}>{item.reason}</Text>
              </Card>
            )}
          />
        </View>
      </Modal>

      {/* Apply Leave Modal */}
      <Modal visible={showApplyLeave} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Apply for Leave</Text>
            <TouchableOpacity onPress={() => setShowApplyLeave(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24, gap: 4 }}>
            <Input
              label="Start Date (YYYY-MM-DD)"
              value={leaveForm.startDate}
              onChangeText={(t) => setLeaveForm((f) => ({ ...f, startDate: t }))}
              placeholder="2024-12-01"
            />
            <Input
              label="End Date (YYYY-MM-DD)"
              value={leaveForm.endDate}
              onChangeText={(t) => setLeaveForm((f) => ({ ...f, endDate: t }))}
              placeholder="2024-12-03"
            />
            <Input
              label="Reason"
              value={leaveForm.reason}
              onChangeText={(t) => setLeaveForm((f) => ({ ...f, reason: t }))}
              placeholder="Reason for leave…"
              multiline
            />
            <Button
              label="Submit Application"
              onPress={() => {
                if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
                  Alert.alert('Required', 'All fields are required.');
                  return;
                }
                applyMutation.mutate();
              }}
              loading={applyMutation.isPending}
              fullWidth
              style={{ marginTop: 8 }}
            />
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 60, gap: 10 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  profileName: { fontSize: 18, fontWeight: '800' },
  profileEmail: { fontSize: 13, marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, marginTop: 6 },
  roleText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderRadius: 14, borderWidth: 1, gap: 14,
  },
  menuIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  infoCard: { marginTop: 10 },
  infoText: { fontSize: 11, textAlign: 'center', lineHeight: 18 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  annRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  annDate: { fontSize: 11 },
  annTitle: { fontSize: 14, fontWeight: '600' },
  annContent: { fontSize: 13, lineHeight: 18 },
  notifCard: { overflow: 'hidden' },
  notifRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  notifDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  notifTitle: { fontSize: 14, fontWeight: '600' },
  notifMsg: { fontSize: 13, marginTop: 2 },
  notifDate: { fontSize: 11, marginTop: 4 },
  leaveTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leaveType: { fontSize: 14, fontWeight: '700' },
  leaveDates: { fontSize: 13 },
  leaveReason: { fontSize: 12 },
});
