import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, useColorScheme, Dimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import axios from '../../api/axios';
import { Colors } from '../../theme/colors';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

// ── API ───────────────────────────────────────────────────────────────────────

const trackingApi = {
  myTransport: (studentId: number) => axios.get(`/transport/student/${studentId}`),
  liveLocation: (routeId: number) => axios.get(`/transport/routes/${routeId}/live-location`),
  routeStops: (routeId: number) => axios.get(`/transport/routes/${routeId}/stops`),
};

// ── Types ─────────────────────────────────────────────────────────────────────

type LiveLocation = {
  routeId: number;
  routeName: string;
  tripActive: boolean;
  latitude?: number;
  longitude?: number;
  locationUpdatedAt?: string;
  tripStartedAt?: string;
};

type Stop = {
  id: number;
  stopName: string;
  sequence: number;
  morningTime?: string;
};

type StudentTransport = {
  id: number;
  route: { id: number; name: string; routeCode: string };
  stop: { stopName: string; sequence: number };
  lastBoardedAt?: string;
  lastAlightedAt?: string;
  lastBoardedStopId?: number;
  lastAlightedStopId?: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  try {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  } catch {
    return 'Unknown';
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StudentBusTracking() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const { user } = useAuthStore();

  const [routeId, setRouteId] = useState<number | null>(null);
  const [studentTransport, setStudentTransport] = useState<StudentTransport | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get student transport assignment
  const { data: transportData, isLoading: transportLoading } = useQuery({
    queryKey: ['student-transport', user?.id],
    queryFn: () => trackingApi.myTransport(user?.id ?? 0),
    enabled: !!user?.id,
  });

  useEffect(() => {
    const transport = transportData?.data?.data;
    if (transport) {
      setStudentTransport(transport);
      setRouteId(transport.route?.id);
    }
  }, [transportData]);

  // Live location polling (every 15s when trip active)
  const { data: locationData, isLoading: locationLoading, refetch: refetchLocation } = useQuery({
    queryKey: ['live-location', routeId, refreshCount],
    queryFn: () => trackingApi.liveLocation(routeId!),
    enabled: !!routeId,
    staleTime: 14000,
  });

  const { data: stopsData } = useQuery({
    queryKey: ['route-stops', routeId],
    queryFn: () => trackingApi.routeStops(routeId!),
    enabled: !!routeId,
  });

  const liveLocation: LiveLocation | null = locationData?.data?.data ?? null;
  const stops: Stop[] = stopsData?.data?.data ?? [];

  // Auto-refresh every 15s when trip is active
  useEffect(() => {
    if (liveLocation?.tripActive) {
      timerRef.current = setInterval(() => {
        setRefreshCount((c) => c + 1);
      }, 15000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [liveLocation?.tripActive]);

  const isBoarded = studentTransport?.lastBoardedStopId && !studentTransport?.lastAlightedStopId;
  const isAlighted = !!studentTransport?.lastAlightedStopId;

  if (transportLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading transport info...</Text>
      </View>
    );
  }

  if (!studentTransport) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Ionicons name="bus-outline" size={64} color={theme.textMuted} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No Transport Assigned</Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          You are not currently assigned to any school bus route. Contact admin to get assigned.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>

      {/* Status Banner */}
      {liveLocation && (
        <View style={[
          styles.statusBanner,
          { backgroundColor: liveLocation.tripActive ? '#0f4c2e' : '#374151' }
        ]}>
          <View style={[styles.pulseDot, { backgroundColor: liveLocation.tripActive ? '#22c55e' : '#6b7280' }]} />
          <Text style={styles.bannerText}>
            {liveLocation.tripActive ? '🚌 Bus is on the way!' : '🅿️ Bus has not started yet'}
          </Text>
          {liveLocation.tripActive && (
            <TouchableOpacity onPress={() => refetchLocation()} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={16} color="#86efac" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* My Transport Card */}
      <Card style={styles.myTransportCard}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>My Bus Route</Text>
        <View style={styles.routeInfoRow}>
          <View style={[styles.routeIcon, { backgroundColor: Colors.primary[500] + '22' }]}>
            <Ionicons name="bus" size={24} color={Colors.primary[500]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.routeName, { color: theme.text }]}>
              {studentTransport.route?.name ?? 'Unknown Route'}
            </Text>
            <Text style={[styles.routeCode, { color: theme.textSecondary }]}>
              Code: {studentTransport.route?.routeCode}
            </Text>
          </View>
        </View>
        <View style={[styles.stopInfo, { backgroundColor: theme.surface2 }]}>
          <Ionicons name="location" size={16} color={Colors.primary[500]} />
          <Text style={[styles.stopText, { color: theme.text }]}>
            Your Stop: <Text style={{ fontWeight: '700' }}>{studentTransport.stop?.stopName}</Text>
          </Text>
        </View>
      </Card>

      {/* Today's Status */}
      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Today's Status</Text>
        <View style={styles.statusGrid}>
          <View style={[styles.statusBox, { backgroundColor: isBoarded ? '#dcfce7' : theme.surface2 }]}>
            <Ionicons name="enter-outline" size={22} color={isBoarded ? '#22c55e' : theme.textMuted} />
            <Text style={[styles.statusBoxLabel, { color: isBoarded ? '#166534' : theme.textMuted }]}>Boarded</Text>
            {studentTransport.lastBoardedAt && (
              <Text style={[styles.statusTime, { color: '#166534' }]}>{formatTime(studentTransport.lastBoardedAt)}</Text>
            )}
          </View>
          <View style={[styles.statusBox, { backgroundColor: isAlighted ? '#fef3c7' : theme.surface2 }]}>
            <Ionicons name="exit-outline" size={22} color={isAlighted ? '#d97706' : theme.textMuted} />
            <Text style={[styles.statusBoxLabel, { color: isAlighted ? '#92400e' : theme.textMuted }]}>Alighted</Text>
            {studentTransport.lastAlightedAt && (
              <Text style={[styles.statusTime, { color: '#92400e' }]}>{formatTime(studentTransport.lastAlightedAt)}</Text>
            )}
          </View>
        </View>
        {!isBoarded && !isAlighted && (
          <Text style={[styles.waitingText, { color: theme.textMuted }]}>
            Waiting for your boarding to be marked by the driver.
          </Text>
        )}
      </Card>

      {/* Live Bus Location */}
      {liveLocation && liveLocation.tripActive && liveLocation.latitude && (
        <Card>
          <View style={styles.locationHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Live Bus Location</Text>
            <Text style={[styles.updatedText, { color: theme.textMuted }]}>
              Updated {getTimeSince(liveLocation.locationUpdatedAt)}
            </Text>
          </View>
          {/* Map placeholder — full GPS map would require react-native-maps (not in SDK 52 deps) */}
          <View style={[styles.mapPlaceholder, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="map-outline" size={48} color="#3b82f6" />
            <Text style={[styles.mapCoordsText, { color: '#1e3a5f' }]}>
              📍 {Number(liveLocation.latitude).toFixed(4)}, {Number(liveLocation.longitude).toFixed(4)}
            </Text>
            <Text style={[styles.mapHint, { color: '#3b82f6' }]}>
              Live GPS coordinates of bus
            </Text>
          </View>
          {liveLocation.tripStartedAt && (
            <Text style={[styles.tripStarted, { color: theme.textSecondary }]}>
              Trip started at {formatTime(liveLocation.tripStartedAt)}
            </Text>
          )}
        </Card>
      )}

      {/* Route Stops Timeline */}
      {stops.length > 0 && (
        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Route Stops</Text>
          <View style={{ gap: 0 }}>
            {stops.map((stop, idx) => {
              const isMyStop = stop.id === studentTransport.stop?.sequence;
              const isPast = idx < (studentTransport.stop?.sequence ?? 0) - 1;
              return (
                <View key={stop.id} style={styles.stopRow}>
                  <View style={styles.stopTimeline}>
                    <View style={[
                      styles.stopDot,
                      { backgroundColor: isMyStop ? Colors.primary[500] : isPast ? '#22c55e' : theme.border }
                    ]}>
                      {isMyStop && <Ionicons name="person" size={10} color="#fff" />}
                    </View>
                    {idx < stops.length - 1 && (
                      <View style={[styles.stopLine, { backgroundColor: theme.border }]} />
                    )}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 16 }}>
                    <Text style={[
                      styles.stopName,
                      { color: isMyStop ? Colors.primary[500] : theme.text },
                      isMyStop && { fontWeight: '700' }
                    ]}>
                      {stop.stopName}
                      {isMyStop ? ' ← Your Stop' : ''}
                    </Text>
                    {stop.morningTime && (
                      <Text style={[styles.stopTime, { color: theme.textMuted }]}>
                        Pickup: {stop.morningTime}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </Card>
      )}

      {/* Not started message */}
      {liveLocation && !liveLocation.tripActive && (
        <Card style={[styles.hintCard, { backgroundColor: '#fef3c7' }]}>
          <Ionicons name="time-outline" size={20} color="#d97706" />
          <Text style={[styles.hintText, { color: '#92400e' }]}>
            The bus hasn't started yet. You'll receive a push notification when the driver starts the trip.
          </Text>
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
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: 4, lineHeight: 20 },

  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 12,
  },
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
  statusBox: {
    flex: 1, alignItems: 'center', gap: 6, padding: 16, borderRadius: 12,
  },
  statusBoxLabel: { fontSize: 12, fontWeight: '600' },
  statusTime: { fontSize: 14, fontWeight: '700' },
  waitingText: { fontSize: 12, textAlign: 'center', marginTop: 8 },

  locationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  updatedText: { fontSize: 11 },
  mapPlaceholder: {
    height: 180, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  mapCoordsText: { fontSize: 16, fontWeight: '700' },
  mapHint: { fontSize: 12 },
  tripStarted: { fontSize: 12, textAlign: 'center', marginTop: 8 },

  stopRow: { flexDirection: 'row', gap: 12 },
  stopTimeline: { alignItems: 'center', width: 20 },
  stopDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stopLine: { width: 2, flex: 1, minHeight: 8 },
  stopName: { fontSize: 13, fontWeight: '500' },
  stopTime: { fontSize: 11, marginTop: 2 },

  hintCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12 },
  hintText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
