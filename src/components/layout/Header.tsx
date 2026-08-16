import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Sun, Moon, Monitor, LogOut, User as UserIcon, Search as SearchIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth, getDisplayName } from '@/contexts/AuthContext';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { cn } from '@/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/files': 'Files',
  '/folders': 'Folders',
  '/search': 'AI Search',
  '/chat': 'AI Chat',
  '/jobs': 'Jobs',
  '/history': 'History',
  '/settings': 'Settings',
  '/profile': 'Profile',
};

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = '/' + location.pathname.split('/')[1];
  const pageTitle = pageTitles[currentPath] || 'Smart File Finder';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const themeIcon = theme === 'light' ? <Sun className="w-4 h-4" /> : theme === 'dark' ? <Moon className="w-4 h-4" /> : <Monitor className="w-4 h-4" />;

  return (
    <header className="sticky top-0 z-20 h-14 border-b border-gray-200 bg-white/80 dark:border-gray-800 dark:bg-[#0b0e14]/80 backdrop-blur-md flex items-center px-4 gap-3">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{pageTitle}</h1>

      <div className="flex-1" />

      {/* Quick search shortcut */}
      <button
        onClick={() => navigate('/search')}
        className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors w-48 md:w-64"
      >
        <SearchIcon className="w-4 h-4" />
        <span>Search...</span>
      </button>

      {/* Theme switcher */}
      <Dropdown
        trigger={
          <button
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Change theme"
          >
            {themeIcon}
          </button>
        }
      >
        <DropdownItem onClick={() => setTheme('light')} icon={<Sun className="w-4 h-4" />}>
          Light
        </DropdownItem>
        <DropdownItem onClick={() => setTheme('dark')} icon={<Moon className="w-4 h-4" />}>
          Dark
        </DropdownItem>
        <DropdownItem onClick={() => setTheme('system')} icon={<Monitor className="w-4 h-4" />}>
          System
        </DropdownItem>
      </Dropdown>

      {/* User menu */}
      <Dropdown
        trigger={
          <button className="flex items-center gap-2 p-1 pr-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 text-xs font-semibold">
              {getDisplayName(user)?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="hidden sm:block text-sm text-gray-700 dark:text-gray-200 max-w-[120px] truncate">
              {getDisplayName(user) || user?.email}
            </span>
          </button>
        }
      >
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{getDisplayName(user) || 'User'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
        </div>
        <DropdownSeparator />
        <DropdownItem onClick={() => navigate('/profile')} icon={<UserIcon className="w-4 h-4" />}>
          Profile
        </DropdownItem>
        <DropdownItem onClick={() => navigate('/settings')} icon={<UserIcon className="w-4 h-4" />}>
          Settings
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem onClick={handleLogout} icon={<LogOut className="w-4 h-4" />} danger>
          Sign out
        </DropdownItem>
      </Dropdown>
    </header>
  );
}
