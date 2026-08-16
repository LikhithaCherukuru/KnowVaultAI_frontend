import { Sun, Moon, Monitor, User as UserIcon, Mail, Calendar } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth, getDisplayName } from '@/contexts/AuthContext';
import { cn, formatDateTime } from '@/utils';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your preferences</p>
      </div>

      <div className="surface p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Appearance</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Choose how Smart File Finder looks</p>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors',
                  isActive
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="surface p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Account</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300">
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
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">About</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Smart File Finder — AI-powered personal knowledge management. Upload, search, and chat with your documents using semantic search and RAG.
        </p>
      </div>
    </div>
  );
}
