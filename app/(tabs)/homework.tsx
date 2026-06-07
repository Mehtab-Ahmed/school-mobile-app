import { useAuthStore } from '../../src/store/authStore';
import TeacherHomework from '../../src/screens/teacher/TeacherHomework';
import StudentHomework from '../../src/screens/student/StudentHomework';

export default function HomeworkTab() {
  const role = useAuthStore((s) => s.user?.primaryRole);
  if (role === 'TEACHER') return <TeacherHomework />;
  return <StudentHomework />;
}
