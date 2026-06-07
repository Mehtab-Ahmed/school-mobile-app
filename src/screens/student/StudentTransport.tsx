import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, useColorScheme,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { studentsApi } from '../../api/students';
import { transportApi } from '../../api/transport';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';
import { StudentTransport as StudentTransportType } from '../../types';

export default function StudentTransport() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore(s => s.user);

  const { data: studentsData } = useQuery({
    queryKey: ['student-profile', user?.userId],
    queryFn: () => studentsApi.list({ size: 100 }),
    enabled: !!user,
  });

  const student = studentsData?.data?.data?.content?.find(s => s.user?.id === user?.userId);
  const studentId = student?.id;

  const { data: transportData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['student-transport', studentId],
    queryFn: () => transportApi.studentTransport(studentId!),
    enabled: !!studentId,
  });

  const transport: StudentTransportType | null = transportData?.data ?? null;

  if (isLoading || !studentId) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary[500]} />}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#0ea5e9' }]}>
        <Ionicons name="bus" size={36} color="#fff" />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Transport</Text>
          <Text style={styles.headerSub}>Route & stop information</Text>
        </View>
      </View>

      {!transport ? (
        <EmptyState
          icon="bus-outline"
          title="No transport assigned"
          subtitle="You have not been assigned to any transport route. Contact admin for assistance."
        />
      ) : (
        <>
          {/* Route Card */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Assigned Route</Text>
          <Card style={styles.routeCard}>
            <View style={[styles.routeIcon, { backgroundColor: '#0ea5e9' + '22' }]}>
              <Ionicons name="map" size={24} color="#0ea5e9" />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.routeName, { color: theme.text }]}>{transport.route.name}</Text>
              {transport.route.vehicle && (
                <>
                  <Text style={[styles.vehicleInfo, { color: theme.textSecondary }]}>
                    {transport.route.vehicle.make} {transport.route.vehicle.model}
                  </Text>
                  <View style={[styles.regBadge, { backgroundColor: theme.surface2 }]}>
                    <Ionicons name="car" size={12} color={theme.textMuted} />
                    <Text style={[styles.regText, { color: theme.textSecondary }]}>
                      {transport.route.vehicle.registrationNumber}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </Card>

          {/* Stops Card */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>My Stops</Text>
          <Card style={{ gap: 14 }}>
            {transport.boardingStop && (
              <View style={styles.stopRow}>
                <View style={[styles.stopDot, { backgroundColor: Colors.success }]}>
                  <Ionicons name="arrow-up" size={14} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stopLabel, { color: theme.textMuted }]}>Morning Pickup</Text>
                  <Text style={[styles.stopName, { color: theme.text }]}>{transport.boardingStop.name}</Text>
                  {transport.boardingStop.morningPickupTime && (
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={13} color={theme.textMuted} />
                      <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                        {transport.boardingStop.morningPickupTime}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {transport.boardingStop && transport.dropStop && (
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
            )}

            {transport.dropStop && (
              <View style={styles.stopRow}>
                <View style={[styles.stopDot, { backgroundColor: Colors.warning }]}>
                  <Ionicons name="arrow-down" size={14} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stopLabel, { color: theme.textMuted }]}>Evening Drop</Text>
                  <Text style={[styles.stopName, { color: theme.text }]}>{transport.dropStop.name}</Text>
                  {transport.dropStop.eveningDropTime && (
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={13} color={theme.textMuted} />
                      <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                        {transport.dropStop.eveningDropTime}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {!transport.boardingStop && !transport.dropStop && transport.stop && (
              <View style={styles.stopRow}>
                <View style={[styles.stopDot, { backgroundColor: Colors.primary[500] }]}>
                  <Ionicons name="location" size={14} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stopLabel, { color: theme.textMuted }]}>My Stop</Text>
                  <Text style={[styles.stopName, { color: theme.text }]}>{transport.stop.name}</Text>
                  {transport.stop.morningPickupTime && (
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={13} color={theme.textMuted} />
                      <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                        Morning: {transport.stop.morningPickupTime}
                      </Text>
                    </View>
                  )}
                  {transport.stop.eveningDropTime && (
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={13} color={theme.textMuted} />
                      <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                        Evening: {transport.stop.eveningDropTime}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </Card>

          {/* Tips */}
          <Card style={[styles.tipsCard, { backgroundColor: '#0ea5e9' + '10' }]}>
            <Ionicons name="information-circle" size={18} color="#0ea5e9" />
            <Text style={[styles.tipsText, { color: theme.textSecondary }]}>
              Please be at your stop 5 minutes before pickup time. Contact the school office if you miss your bus.
            </Text>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 24, marginBottom: 8,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: '#ffffff99', fontSize: 13, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 10, paddingHorizontal: 16 },
  routeCard: { flexDirection: 'row', gap: 14, marginHorizontal: 16 },
  routeIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  routeName: { fontSize: 16, fontWeight: '700' },
  vehicleInfo: { fontSize: 13 },
  regBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  regText: { fontSize: 12, fontWeight: '500' },
  stopRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  stopDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stopLabel: { fontSize: 11, fontWeight: '500' },
  stopName: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  timeText: { fontSize: 12 },
  divider: { height: 1, marginLeft: 46 },
  tipsCard: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginHorizontal: 16, marginTop: 16 },
  tipsText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
