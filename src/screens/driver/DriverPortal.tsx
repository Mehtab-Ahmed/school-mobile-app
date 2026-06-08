import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, useColorScheme, FlatList, Switch,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from '../../api/axios';
import { Colors } from '../../theme/colors';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';

// ── API helpers ───────────────────────────────────────────────────────────────

const driverApi = {
  myRoute: () => axios.get('/transport/driver/my-route'),
  myStops: () => axios.get('/transport/driver/my-route/stops'),
  startTrip: () => axios.post('/transport/driver/trip/start'),
  endTrip: () => axios.post('/transport/driver/trip/end'),
  updateLocation: (lat: number, lng: number) =>
    axios.post('/transport/driver/location', { latitude: lat, longitude: lng }),
  markBoarding: (studentId: number, stopId: number) =>
    axios.post('/transport/driver/boarding', { studentId, stopId }),
  markAlighting: (studentId: number, stopId: number) =>
    axios.post('/transport/driver/alighting', { studentId, stopId }),
};

// ── Types ─────────────────────────────────────────────────────────────────────

type Student = {
  id: number;
  user: { firstName: string; lastName: string };
  lastBoardedStopId?: number;
  lastAlightedStopId?: number;
  lastBoardedAt?: string;
};

type Stop = {
  id: number;
  stopName: string;
  sequence: number;
  students: { student: Student; lastBoardedStopId?: number; lastAlightedStopId?: number }[];
};

type Route = {
  id: number;
  name: string;
  routeCode: string;
  tripActive: boolean;
  vehicle?: { vehicleNumber: string; make: string };
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DriverPortal() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;

  const [tripActive, setTripActive] = useState(false);
  const [locationWatcher, setLocationWatcher] = useState<Location.LocationSubscription | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [expandedStop, setExpandedStop] = useState<number | null>(null);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const { data: routeData, isLoading: routeLoading } = useQuery({
    queryKey: ['driver-route'],
    queryFn: driverApi.myRoute,
  });

  const { data: stopsData, isLoading: stopsLoading, refetch: refetchStops } = useQuery({
    queryKey: ['driver-stops'],
    queryFn: driverApi.myStops,
    refetchInterval: tripActive ? 15000 : false,
  });

  const route: Route | null = routeData?.data?.data ?? null;
  const stops: Stop[] = stopsData?.data?.data ?? [];

  // Sync trip state from route
  useEffect(() => {
    if (route) setTripActive(route.tripActive ?? false);
  }, [route]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const startTripMutation = useMutation({
    mutationFn: driverApi.startTrip,
    onSuccess: () => {
      setTripActive(true);
      startLocationTracking();
      Alert.alert('Trip Started', 'GPS tracking is now active. Drive safely! 🚌');
    },
    onError: () => Alert.alert('Error', 'Failed to start trip'),
  });

  const endTripMutation = useMutation({
    mutationFn: driverApi.endTrip,
    onSuccess: () => {
      setTripActive(false);
      stopLocationTracking();
      Alert.alert('Trip Ended', 'Trip completed successfully.');
    },
    onError: () => Alert.alert('Error', 'Failed to end trip'),
  });

  const boardingMutation = useMutation({
    mutationFn: ({ studentId, stopId }: { studentId: number; stopId: number }) =>
      driverApi.markBoarding(studentId, stopId),
    onSuccess: () => refetchStops(),
    onError: () => Alert.alert('Error', 'Failed to mark boarding'),
  });

  const alightingMutation = useMutation({
    mutationFn: ({ studentId, stopId }: { studentId: number; stopId: number }) =>
      driverApi.markAlighting(studentId, stopId),
    onSuccess: () => refetchStops(),
    onError: () => Alert.alert('Error', 'Failed to mark alighting'),
  });

  // ── GPS Tracking ──────────────────────────────────────────────────────────

  const startLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required for live tracking.');
      return;
    }

    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 15000, distanceInterval: 20 },
      (location) => {
        const { latitude, longitude } = location.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        driverApi.updateLocation(latitude, longitude).catch(() => {});
      }
    );
    setLocationWatcher(sub);
  };

  const stopLocationTracking = () => {
    if (locationWatcher) {
      locationWatcher.remove();
      setLocationWatcher(null);
    }
  };

  useEffect(() => {
    return () => {
      if (locationWatcher) locationWatcher.remove();
    };
  }, [locationWatcher]);

  const handleTripToggle = () => {
    if (tripActive) {
      Alert.alert('End Trip', 'Are you sure you want to end the trip?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Trip', style: 'destructive', onPress: () => endTripMutation.mutate() },
      ]);
    } else {
      Alert.alert('Start Trip', 'Start the bus trip and enable GPS tracking?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: () => startTripMutation.mutate() },
      ]);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const isBoarded = (student: any, stopId: number) =>
    student.lastBoardedStopId === stopId && !student.lastAlightedStopId;

  const isAlighted = (student: any, stopId: number) =>
    student.lastAlightedStopId === stopId;

  // ── Loading State ─────────────────────────────────────────────────────────

  if (routeLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading route...</Text>
      </View>
    );
  }

  if (!route) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Ionicons name="bus-outline" size={64} color={theme.textMuted} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No Route Assigned</Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          Contact admin to assign a route to your account.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>

      {/* Route Header */}
      <Card style={[styles.routeCard, { backgroundColor: tripActive ? '#0f4c2e' : theme.card }]}>
        <View style={styles.routeRow}>
          <View style={[styles.busIcon, { backgroundColor: tripActive ? '#22c55e33' : Colors.primary[500] + '22' }]}>
            <Ionicons name="bus" size={28} color={tripActive ? '#22c55e' : Colors.primary[500]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.routeName, { color: tripActive ? '#fff' : theme.text }]}>{route.name}</Text>
            <Text style={[styles.routeCode, { color: tripActive ? '#86efac' : theme.textSecondary }]}>
              {route.routeCode} · {route.vehicle?.make ?? ''} {route.vehicle?.vehicleNumber ?? ''}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: tripActive ? '#22c55e' : '#6b7280' }]}>
            <Text style={styles.statusText}>{tripActive ? 'LIVE' : 'IDLE'}</Text>
          </View>
        </View>

        {/* GPS Status */}
        {tripActive && currentLocation && (
          <View style={styles.gpsRow}>
            <Ionicons name="location" size={14} color="#86efac" />
            <Text style={styles.gpsText}>
              GPS Active · {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
            </Text>
          </View>
        )}

        {/* Trip Toggle Button */}
        <TouchableOpacity
          onPress={handleTripToggle}
          style={[
            styles.tripBtn,
            { backgroundColor: tripActive ? '#dc2626' : '#22c55e' }
          ]}
          disabled={startTripMutation.isPending || endTripMutation.isPending}
        >
          {(startTripMutation.isPending || endTripMutation.isPending) ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name={tripActive ? 'stop-circle' : 'play-circle'} size={20} color="#fff" />
              <Text style={styles.tripBtnText}>{tripActive ? 'End Trip' : 'Start Trip'}</Text>
            </>
          )}
        </TouchableOpacity>
      </Card>

      {/* Stops */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Route Stops</Text>

      {stopsLoading ? (
        <ActivityIndicator color={Colors.primary[500]} />
      ) : stops.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={[{ color: theme.textMuted, textAlign: 'center' }]}>No stops configured for this route.</Text>
        </Card>
      ) : (
        stops.map((stop, idx) => {
          const isExpanded = expandedStop === stop.id;
          const boardedCount = (stop.students ?? []).filter(
            (s: any) => s.lastBoardedStopId && !s.lastAlightedStopId
          ).length;

          return (
            <View key={stop.id}>
              {/* Stop Header */}
              <TouchableOpacity
                style={[styles.stopHeader, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => setExpandedStop(isExpanded ? null : stop.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.stopSeq, { backgroundColor: Colors.primary[500] }]}>
                  <Text style={styles.stopSeqText}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stopName, { color: theme.text }]}>{stop.stopName}</Text>
                  <Text style={[styles.stopStudentCount, { color: theme.textMuted }]}>
                    {(stop.students ?? []).length} students · {boardedCount} on bus
                  </Text>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18} color={theme.textMuted}
                />
              </TouchableOpacity>

              {/* Student list */}
              {isExpanded && (
                <View style={[styles.studentList, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
                  {(stop.students ?? []).length === 0 ? (
                    <Text style={[styles.noStudents, { color: theme.textMuted }]}>No students at this stop</Text>
                  ) : (
                    (stop.students as any[]).map((item: any) => {
                      const student = item.student ?? item;
                      const fullName = `${student.user?.firstName ?? ''} ${student.user?.lastName ?? ''}`.trim();
                      const boarded = item.lastBoardedStopId && !item.lastAlightedStopId;
                      const alighted = !!item.lastAlightedStopId;

                      return (
                        <View key={student.id} style={[styles.studentRow, { borderBottomColor: theme.border }]}>
                          <Avatar name={fullName} size={38} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.studentName, { color: theme.text }]}>{fullName}</Text>
                            {boarded && (
                              <Text style={[styles.statusLabel, { color: '#22c55e' }]}>🚌 On Bus</Text>
                            )}
                            {alighted && (
                              <Text style={[styles.statusLabel, { color: '#6b7280' }]}>✅ Dropped</Text>
                            )}
                          </View>
                          {/* Action buttons */}
                          {tripActive && !boarded && !alighted && (
                            <TouchableOpacity
                              style={[styles.actionBtn, { backgroundColor: '#22c55e' }]}
                              onPress={() => boardingMutation.mutate({ studentId: student.id, stopId: stop.id })}
                              disabled={boardingMutation.isPending}
                            >
                              <Ionicons name="enter-outline" size={16} color="#fff" />
                              <Text style={styles.actionText}>Board</Text>
                            </TouchableOpacity>
                          )}
                          {tripActive && boarded && (
                            <TouchableOpacity
                              style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]}
                              onPress={() => alightingMutation.mutate({ studentId: student.id, stopId: stop.id })}
                              disabled={alightingMutation.isPending}
                            >
                              <Ionicons name="exit-outline" size={16} color="#fff" />
                              <Text style={styles.actionText}>Alight</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          );
        })
      )}

      {!tripActive && (
        <Card style={[styles.hintCard, { backgroundColor: '#fef3c7' }]}>
          <Ionicons name="information-circle-outline" size={18} color="#d97706" />
          <Text style={[styles.hintText, { color: '#92400e' }]}>
            Start the trip to enable boarding & alighting controls and live GPS tracking.
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

  routeCard: { gap: 12, padding: 16 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  busIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  routeName: { fontSize: 17, fontWeight: '700' },
  routeCode: { fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gpsText: { color: '#86efac', fontSize: 12 },
  tripBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 12,
  },
  tripBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: 4 },

  stopHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1,
    marginBottom: 2,
  },
  stopSeq: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  stopSeqText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  stopName: { fontSize: 14, fontWeight: '600' },
  stopStudentCount: { fontSize: 12, marginTop: 2 },

  studentList: {
    borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12, marginBottom: 8, overflow: 'hidden',
  },
  noStudents: { textAlign: 'center', padding: 16, fontSize: 13 },
  studentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderBottomWidth: 1,
  },
  studentName: { fontSize: 14, fontWeight: '600' },
  statusLabel: { fontSize: 11, marginTop: 2 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  emptyCard: { alignItems: 'center', padding: 20 },
  hintCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 14, borderRadius: 12 },
  hintText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
