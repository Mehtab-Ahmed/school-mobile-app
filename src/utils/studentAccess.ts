import { AuthUser, Student } from '../types';
import api from '../api/axios';
import { studentsApi } from '../api/students';
import { parentApi } from '../api/parent';

/**
 * The students the signed-in person may look at, as Student-shaped records.
 * Parents get their linked children (the server returns a summary, reshaped
 * here); students get only themselves; staff get the school list.
 */
export async function getAccessibleStudents(user?: AuthUser | null): Promise<Student[]> {
  if (!user) return [];

  if (user.primaryRole === 'PARENT') {
    const res = await parentApi.children();
    return ((res.data.data ?? []) as any[]).map((c) => {
      const name: string = c.name ?? c.fullName ?? '';
      const [firstName = '', ...rest] = name.split(' ');
      return {
        ...c,
        id: c.studentId ?? c.id,
        user: c.user ?? { firstName, lastName: rest.join(' ') },
      } as Student;
    });
  }

  if (user.primaryRole === 'STUDENT') {
    const res = await api.get('/students/me');
    return res.data?.data ? [res.data.data as Student] : [];
  }

  const res = await studentsApi.list({ size: 200 });
  return res.data.data?.content ?? [];
}

export function studentDisplayName(student?: Student | null) {
  if (!student) return 'Student';
  const name = `${student.user?.firstName ?? ''} ${student.user?.lastName ?? ''}`.trim();
  return name || (student as any).name || student.admissionNumber || 'Student';
}
