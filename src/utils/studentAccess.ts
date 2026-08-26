import { AuthUser, Student } from '../types';
import { studentsApi } from '../api/students';
import { parentApi } from '../api/parent';

export async function getAccessibleStudents(user?: AuthUser | null): Promise<Student[]> {
  if (!user) return [];

  if (user.primaryRole === 'PARENT') {
    const res = await parentApi.children();
    return (res.data.data as Student[]) ?? [];
  }

  if (user.primaryRole === 'STUDENT') {
    const res = await studentsApi.list({ size: 200 });
    const students = res.data.data?.content ?? [];
    return students.filter((s) => s.user?.id === user.userId || s.id === user.id);
  }

  const res = await studentsApi.list({ size: 200 });
  return res.data.data?.content ?? [];
}

export function studentDisplayName(student?: Student | null) {
  if (!student) return 'Student';
  const name = `${student.user?.firstName ?? ''} ${student.user?.lastName ?? ''}`.trim();
  return name || student.admissionNumber || `Student #${student.id}`;
}
