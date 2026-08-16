import { useAuth, getDisplayName } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Calendar, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/utils';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your account information</p>
      </div>

      <div className="surface p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 text-xl font-semibold">
            {getDisplayName(user)?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{getDisplayName(user) || 'User'}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="surface p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Details</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{getDisplayName(user) || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{user?.email || '—'}</p>
            </div>
          </div>
          {user?.created_at && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Member since</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{formatDateTime(user.created_at)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="surface p-5">
        <Button variant="danger" icon={<LogOut className="w-4 h-4" />} onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
