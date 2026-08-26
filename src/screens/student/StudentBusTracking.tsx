import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, useColorScheme, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../theme/colors';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuthStore } from '../../store/authStore';
import { transportGpsApi } from '../../api/transportGps';
import { getAccessibleStudents, studentDisplayName } from '../../utils/studentAccess';

function formatTime(dateStr?: string): string {
  if (!dateStr) return '--';
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--';
  }
}

function getTimeSince(dateStr?: string): string {
  if (!dateStr) return 'Unknown';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export default function StudentBusTracking() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const { user } = useAuthStore();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const students = useQuery({
    queryKey: ['transport-accessible-students', user?.userId],
    queryFn: () => getAccessibleStudents(user),
    enabled: !!user,
  });

  const accessibleStudents = students.data ?? [];
  useEffect(() => {
    if (!selectedStudentId && accessibleStudents.length > 0) {
      setSelectedStudentId(accessibleStudents[0].id);
    }
  }, [accessibleStudents, selectedStudentId]);

  const transport = useQuery({
    queryKey: ['transport-child', selectedStudentId],
    queryFn: () => transportGpsApi.child(selectedStudentId!),
    enabled: !!selectedStudentId,
    refetchInterval: (query) => query.state.data?.data?.data?.tripActive ? 15000 : false,
  });

  const stops = useQuery({
    queryKey: ['transport-route-stops', transport.data?.data?.data?.routeId],
    queryFn: () => transportGpsApi.routeStops(transport.data!.data.data.routeId!),
    enabled: !!transport.data?.data?.data?.routeId,
  });

  const data = transport.data?.data?.data;
  const routeStops = stops.data?.data?.data ?? [];
  const refreshing = students.isRefetching || transport.isRefetching || stops.isRefetching;
  const refresh = () => { students.refetch(); transport.refetch(); stops.refetch(); };

  if (students.isLoading || transport.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading transport info...</Text>
      </View>
    );
  }

  if (!selectedStudentId || !data) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <EmptyState icon="bus-outline" title="No Transport Assigned" subtitle="No route was found for this student." />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary[500]} />}
    >
      {accessibleStudents.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcher}>
          {accessibleStudents.map((s) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => setSelectedStudentId(s.id)}
              style={[styles.chip, { backgroundColor: selectedStudentId === s.id ? Colors.primary[500] : theme.card, borderColor: selectedStudentId === s.id ? Colors.primary[500] : theme.border }]}
            >
              <Text style={[styles.chipText, { color: selectedStudentId === s.id ? '#fff' : theme.text }]}>{studentDisplayName(s)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={[styles.statusBanner, { backgroundColor: data.tripActive ? '#0f4c2e' : '#374151' }]}>
        <View style={[styles.pulseDot, { backgroundColor: data.tripActive ? '#22c55e' : '#6b7280' }]} />
        <Text style={styles.bannerText}>
          {data.tripActive ? 'Bus is on the way' : 'Bus has not started yet'}
        </Text>
        <TouchableOpacity onPress={() => transport.refetch()} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={16} color="#86efac" />
        </TouchableOpacity>
      </View>

      <Card style={styles.myTransportCard}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Bus Route</Text>
        <View style={styles.routeInfoRow}>
          <View style={[styles.routeIcon, { backgroundColor: Colors.primary[500] + '22' }]}>
            <Ionicons name="bus" size={24} color={Colors.primary[500]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.routeName, { color: theme.text }]}>{data.routeName ?? 'Unknown Route'}</Text>
            <Text style={[styles.routeCode, { color: theme.textSecondary }]}>Code: {data.routeCode ?? '--'}</Text>
          </View>
          <Badge label={data.status ?? (data.tripActive ? 'LIVE' : 'WAITING')} variant={data.tripActive ? 'success' : 'info'} small />
        </View>
        <View style={[styles.stopInfo, { backgroundColor: theme.surface2 }]}>
          <Ionicons name="location" size={16} color={Colors.primary[500]} />
          <Text style={[styles.stopText, { color: theme.text }]}>Stop: <Text style={{ fontWeight: '700' }}>{data.stopName ?? '--'}</Text></Text>
        </View>
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Today's Pickup / Drop</Text>
        <View style={styles.statusGrid}>
          <View style={[styles.statusBox, { backgroundColor: data.lastBoardedAt ? '#dcfce7' : theme.surface2 }]}>
            <Ionicons name="enter-outline" size={22} color={data.lastBoardedAt ? '#22c55e' : theme.textMuted} />
            <Text style={[styles.statusBoxLabel, { color: data.lastBoardedAt ? '#166534' : theme.textMuted }]}>Boarded</Text>
            <Text style={[styles.statusTime, { color: data.lastBoardedAt ? '#166534' : theme.textMuted }]}>{formatTime(data.lastBoardedAt)}</Text>
          </View>
          <View style={[styles.statusBox, { backgroundColor: data.lastAlightedAt ? '#fef3c7' : theme.surface2 }]}>
            <Ionicons name="exit-outline" size={22} color={data.lastAlightedAt ? '#d97706' : theme.textMuted} />
            <Text style={[styles.statusBoxLabel, { color: data.lastAlightedAt ? '#92400e' : theme.textMuted }]}>Dropped</Text>
            <Text style={[styles.statusTime, { color: data.lastAlightedAt ? '#92400e' : theme.textMuted }]}>{formatTime(data.lastAlightedAt)}</Text>
          </View>
        </View>
      </Card>

      {data.tripActive && data.latitude && data.longitude && (
        <Card>
          <View style={styles.locationHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Live Bus Location</Text>
            <Text style={[styles.updatedText, { color: theme.textMuted }]}>Updated {getTimeSince(data.locationUpdatedAt)}</Text>
          </View>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={48} color="#3b82f6" />
            <Text style={styles.mapCoordsText}>{Number(data.latitude).toFixed(4)}, {Number(data.longitude).toFixed(4)}</Text>
            <Text style={styles.mapHint}>Live GPS coordinates</Text>
          </View>
        </Card>
      )}

      {routeStops.length > 0 && (
        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Route Stops</Text>
          {routeStops.map((stop: any, idx: number) => (
            <View key={stop.id ?? idx} style={styles.stopRow}>
              <View style={styles.stopTimeline}>
                <View style={[styles.stopDot, { backgroundColor: (stop.stopName ?? stop.name) === data.stopName ? Colors.primary[500] : theme.border }]} />
                {idx < routeStops.length - 1 && <View style={[styles.stopLine, { backgroundColor: theme.border }]} />}
              </View>
              <View style={{ flex: 1, paddingBottom: 16 }}>
                <Text style={[styles.stopName, { color: theme.text }]}>{stop.stopName ?? stop.name}</Text>
                <Text style={[styles.stopTime, { color: theme.textMuted }]}>{stop.morningTime ?? stop.morningPickupTime ?? ''}</Text>
              </View>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 60, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  loadingText: { fontSize: 14 },
  switcher: { gap: 8, paddingRight: 12 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  chipText: { fontSize: 13, fontWeight: '800' },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12 },
  pulseDot: { width: 10, height: 10, borderRadius: 5 },
  bannerText: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
  refreshBtn: { padding: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  myTransportCard: { gap: 12 },
  routeInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  routeName: { fontSize: 15, fontWeight: '700' },
  routeCode: { fontSize: 12, marginTop: 2 },
  stopInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10 },
  stopText: { fontSize: 13 },
  statusGrid: { flexDirection: 'row', gap: 12 },
  statusBox: { flex: 1, alignItems: 'center', gap: 6, padding: 16, borderRadius: 12 },
  statusBoxLabel: { fontSize: 12, fontWeight: '600' },
  statusTime: { fontSize: 14, fontWeight: '700' },
  locationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  updatedText: { fontSize: 11 },
  mapPlaceholder: { height: 180, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#dbeafe' },
  mapCoordsText: { fontSize: 16, fontWeight: '700', color: '#1e3a5f' },
  mapHint: { fontSize: 12, color: '#3b82f6' },
  stopRow: { flexDirection: 'row', gap: 12 },
  stopTimeline: { alignItems: 'center', width: 20 },
  stopDot: { width: 20, height: 20, borderRadius: 10 },
  stopLine: { width: 2, flex: 1, minHeight: 8 },
  stopName: { fontSize: 13, fontWeight: '500' },
  stopTime: { fontSize: 11, marginTop: 2 },
});
