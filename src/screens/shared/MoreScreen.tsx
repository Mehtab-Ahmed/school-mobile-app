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

// New screens
import StudentLibrary from '../student/StudentLibrary';
import StudentTransport from '../student/StudentTransport';
import StudentTimetable from '../student/StudentTimetable';
import StudentBusTracking from '../student/StudentBusTracking';
import TeacherExams from '../teacher/TeacherExams';
import TeacherStudents from '../teacher/TeacherStudents';
import ParentHomework from '../parent/ParentHomework';
import DriverPortal from '../driver/DriverPortal';
import GamificationDashboard from './GamificationDashboard';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  color: string;
  action: () => void;
};

type ModalScreen =
  | 'announcements' | 'notifications' | 'leaves' | 'applyLeave'
  | 'library' | 'transport' | 'timetable' | 'busTracking'
  | 'teacherExams' | 'teacherStudents'
  | 'parentHomework'
  | 'driverPortal'
  | 'gamification'
  | null;

export default function MoreScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const { user, logout } = useAuthStore();
  const qc = useQueryClient();

  const [screen, setScreen] = useState<ModalScreen>(null);
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
    enabled: screen === 'leaves',
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
      Alert.alert('Applied', 'Leave application submitted successfully.');
      setScreen('leaves');
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

  // Role-based menu items
  const roleMenuItems: MenuItem[] = [];

  if (role === 'DRIVER') {
    roleMenuItems.push(
      { icon: 'bus', label: 'My Route & Trip', subtitle: 'Start trip, mark boarding/alighting', color: '#22c55e', action: () => setScreen('driverPortal') },
      { icon: 'notifications-outline', label: `Notifications${unread > 0 ? ` (${unread})` : ''}`, subtitle: 'Recent alerts', color: Colors.warning, action: () => setScreen('notifications') },
    );
  } else if (role === 'STUDENT') {
    roleMenuItems.push(
      { icon: 'trophy-outline', label: '🏆 Leaderboard & Points', subtitle: 'Badges, points & rankings', color: '#f59e0b', action: () => setScreen('gamification') },
      { icon: 'book-outline', label: 'Library', subtitle: 'Browse & issued books', color: Colors.primary[500], action: () => setScreen('library') },
      { icon: 'location-outline', label: 'Live Bus Tracking', subtitle: 'Track your school bus in real-time', color: '#22c55e', action: () => setScreen('busTracking') },
      { icon: 'bus-outline', label: 'Transport Info', subtitle: 'Route & stop info', color: '#0ea5e9', action: () => setScreen('transport') },
      { icon: 'calendar-outline', label: 'Timetable', subtitle: 'Class schedule', color: '#8b5cf6', action: () => setScreen('timetable') },
      { icon: 'megaphone-outline', label: 'Announcements', subtitle: 'School notices', color: Colors.info, action: () => setScreen('announcements') },
      { icon: 'notifications-outline', label: `Notifications${unread > 0 ? ` (${unread})` : ''}`, subtitle: 'Recent alerts', color: Colors.warning, action: () => setScreen('notifications') },
    );
  } else if (role === 'TEACHER') {
    roleMenuItems.push(
      { icon: 'document-text-outline', label: 'Exams & Marks', subtitle: 'Enter student marks', color: '#7c3aed', action: () => setScreen('teacherExams') },
      { icon: 'trophy-outline', label: 'Leaderboard', subtitle: 'Class & school rankings', color: '#f59e0b', action: () => setScreen('gamification') },
      { icon: 'people-outline', label: 'My Students', subtitle: 'View student profiles', color: '#059669', action: () => setScreen('teacherStudents') },
      { icon: 'book-outline', label: 'Library', subtitle: 'Browse books', color: Colors.primary[500], action: () => setScreen('library') },
      { icon: 'megaphone-outline', label: 'Announcements', subtitle: 'School notices', color: Colors.info, action: () => setScreen('announcements') },
      { icon: 'calendar-outline', label: 'Leave Applications', subtitle: 'Apply & track leaves', color: Colors.warning, action: () => setScreen('leaves') },
    );
  } else if (role === 'PARENT') {
    roleMenuItems.push(
      { icon: 'book-outline', label: "Child's Homework", subtitle: 'Track assignments', color: '#d97706', action: () => setScreen('parentHomework') },
      { icon: 'location-outline', label: 'Live Bus Tracking', subtitle: "Track child's school bus", color: '#22c55e', action: () => setScreen('busTracking') },
      { icon: 'megaphone-outline', label: 'Announcements', subtitle: 'School notices', color: Colors.info, action: () => setScreen('announcements') },
      { icon: 'bus-outline', label: 'Transport Info', subtitle: "Child's route & stop", color: '#0ea5e9', action: () => setScreen('transport') },
      { icon: 'notifications-outline', label: `Notifications${unread > 0 ? ` (${unread})` : ''}`, subtitle: 'Recent alerts', color: Colors.warning, action: () => setScreen('notifications') },
    );
  } else {
    // ADMIN or fallback
    roleMenuItems.push(
      { icon: 'megaphone-outline', label: 'Announcements', subtitle: 'School notices', color: Colors.primary[500], action: () => setScreen('announcements') },
      { icon: 'notifications-outline', label: `Notifications${unread > 0 ? ` (${unread})` : ''}`, subtitle: 'Recent alerts', color: Colors.info, action: () => setScreen('notifications') },
      { icon: 'calendar-outline', label: 'Leave Applications', subtitle: 'Apply & track leaves', color: Colors.warning, action: () => setScreen('leaves') },
    );
  }

  // Full-screen modal screens (Library, Transport, Timetable, etc.)
  const fullScreenModal = (
    screenKey: ModalScreen,
    title: string,
    component: React.ReactNode,
    headerColor: string = Colors.primary[500]
  ) => (
    <Modal
      visible={screen === screenKey}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setScreen(null)}
    >
      <View style={[styles.fullModal, { backgroundColor: theme.background }]}>
        <View style={[styles.fullModalHeader, { backgroundColor: headerColor }]}>
          <TouchableOpacity onPress={() => setScreen(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.fullModalTitle}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1 }}>{component}</View>
      </View>
    </Modal>
  );

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
      {roleMenuItems.map((item) => (
        <TouchableOpacity
          key={item.label}
          onPress={item.action}
          activeOpacity={0.8}
          style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <View style={[styles.menuIcon, { backgroundColor: item.color + '22' }]}>
            <Ionicons name={item.icon} size={22} color={item.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
            {item.subtitle && (
              <Text style={[styles.menuSub, { color: theme.textMuted }]}>{item.subtitle}</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        </TouchableOpacity>
      ))}

      {/* Logout */}
      <TouchableOpacity
        onPress={doLogout}
        activeOpacity={0.8}
        style={[styles.menuItem, styles.logoutItem, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <View style={[styles.menuIcon, { backgroundColor: Colors.danger + '22' }]}>
          <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
        </View>
        <Text style={[styles.menuLabel, { color: Colors.danger }]}>Logout</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
      </TouchableOpacity>

      {/* App info */}
      <Card style={[styles.infoCard, { backgroundColor: theme.surface2 } as any]} padding={14}>
        <Text style={[styles.infoText, { color: theme.textMuted }]}>
          School ERP v1.0 · React Native + Expo{'\n'}Backend: Spring Boot 3.2
        </Text>
      </Card>

      {/* Full-screen screens */}
      {fullScreenModal('library', 'Library', <StudentLibrary />, Colors.primary[500])}
      {fullScreenModal('transport', 'Transport Info', <StudentTransport />, '#0ea5e9')}
      {fullScreenModal('timetable', 'Timetable', <StudentTimetable />, Colors.primary[600])}
      {fullScreenModal('busTracking', '🚌 Live Bus Tracking', <StudentBusTracking />, '#0f4c2e')}
      {fullScreenModal('teacherExams', 'Exams & Marks', <TeacherExams />, '#7c3aed')}
      {fullScreenModal('teacherStudents', 'My Students', <TeacherStudents />, '#059669')}
      {fullScreenModal('parentHomework', "Child's Homework", <ParentHomework />, '#d97706')}
      {fullScreenModal('driverPortal', '🚌 Driver Portal', <DriverPortal />, '#0f4c2e')}
      {fullScreenModal('gamification', '🏆 Points & Leaderboard', <GamificationDashboard />, '#f59e0b')}

      {/* Announcements Modal */}
      <Modal visible={screen === 'announcements'} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Announcements</Text>
            <TouchableOpacity onPress={() => setScreen(null)}>
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
      <Modal visible={screen === 'notifications'} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Notifications</Text>
            <TouchableOpacity onPress={() => setScreen(null)}>
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
      <Modal visible={screen === 'leaves'} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Leave Applications</Text>
            <View style={styles.headerRight}>
              {canApplyLeave && (
                <TouchableOpacity onPress={() => setScreen('applyLeave')} style={[styles.addBtn, { backgroundColor: Colors.primary[500] }]}>
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setScreen(null)}>
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
      <Modal visible={screen === 'applyLeave'} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Apply for Leave</Text>
            <TouchableOpacity onPress={() => setScreen('leaves')}>
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
  logoutItem: { marginTop: 4 },
  menuIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 15, fontWeight: '600' },
  menuSub: { fontSize: 12, marginTop: 1 },
  infoCard: { marginTop: 10 },
  infoText: { fontSize: 11, textAlign: 'center', lineHeight: 18 },

  // Full screen modal
  fullModal: { flex: 1 },
  fullModalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    paddingTop: 50,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  fullModalTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },

  // Sheet modals
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
