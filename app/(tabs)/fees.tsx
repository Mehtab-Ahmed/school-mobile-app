import { useAuthStore } from '../../src/store/authStore';
import AdminFees from '../../src/screens/admin/AdminFees';
import ParentFees from '../../src/screens/parent/ParentFees';
import StudentFees from '../../src/screens/student/StudentFees';

export default function FeesTab() {
  const role = useAuthStore((s) => s.user?.primaryRole);
  if (role === 'ADMIN') return <AdminFees />;
  if (role === 'PARENT') return <ParentFees />;
  return <StudentFees />;
}
