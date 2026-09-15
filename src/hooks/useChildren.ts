import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { parentApi } from '../api/parent';
import { useAuthStore } from '../store/authStore';
import { useChildStore } from '../store/childStore';

/** A parent's child, in one shape for every screen. */
export interface Child {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  className?: string;
  rollNumber?: string;
}

function normalize(raw: any): Child | null {
  const id = raw?.studentId ?? raw?.id;
  if (id == null) return null;
  const fullName: string =
    raw.name ?? raw.fullName ?? raw.studentName ??
    `${raw.user?.firstName ?? ''} ${raw.user?.lastName ?? ''}`.trim();
  const [firstName = 'Child', ...rest] = (fullName || 'Child').split(' ');
  return {
    id: Number(id),
    firstName: raw.user?.firstName ?? firstName,
    lastName: raw.user?.lastName ?? rest.join(' '),
    fullName: fullName || 'Child',
    className: raw.className ?? [raw.classSection?.grade?.name, raw.classSection?.section?.name].filter(Boolean).join(' - '),
    rollNumber: raw.rollNumber ?? undefined,
  };
}

/**
 * The signed-in parent's children and the one currently selected. All parent
 * screens share one cache entry and one shape — screens used to cache different
 * shapes under the same key, which crashed whichever screen opened second.
 */
export function useChildren() {
  const user = useAuthStore((s) => s.user);
  const selectedChildId = useChildStore((s) => s.selectedChildId);
  const setSelectedChildId = useChildStore((s) => s.setSelectedChildId);

  const query = useQuery({
    queryKey: ['parent-children-normalized', user?.userId],
    queryFn: async () => {
      const res = await parentApi.children();
      return ((res.data?.data ?? []) as any[]).map(normalize).filter((c): c is Child => !!c);
    },
    enabled: user?.primaryRole === 'PARENT',
  });

  const children = query.data ?? [];
  const child = children.find((c) => c.id === selectedChildId) ?? children[0] ?? null;

  useEffect(() => {
    if (child && child.id !== selectedChildId) setSelectedChildId(child.id);
  }, [child, selectedChildId, setSelectedChildId]);

  return {
    children,
    child,
    childId: child?.id ?? null,
    setChildId: setSelectedChildId,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
