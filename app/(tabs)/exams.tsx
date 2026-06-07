import { useAuthStore } from '../../src/store/authStore';
import StudentExams from '../../src/screens/student/StudentExams';
import ParentExams from '../../src/screens/parent/ParentExams';

export default function ExamsTab() {
  const role = useAuthStore((s) => s.user?.primaryRole);
  if (role === 'PARENT') return <ParentExams />;
  return <StudentExams />;
}
