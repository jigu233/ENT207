import { Home, Leaf, Users, MessageSquare, Settings, LogOut } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { t } = useLanguage();
  const { user, signOut, guestMode, setGuestMode } = useAuth();

  const navItems = [
    { id: 'home', icon: Home, label: t('首页', 'Home') },
    { id: 'plants', icon: Leaf, label: t('植物中心', 'Plant Care') },
    { id: 'community', icon: Users, label: t('社区', 'Community') },
    { id: 'devices', icon: Settings, label: t('设备', 'Devices') },
  ];

  const handleLogout = async () => {
    if (user) {
      await signOut();
    } else if (guestMode) {
      setGuestMode(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 group"
          >
            <img
              src="/logo.jpg"
              alt="ClimateLife Logo"
              className="h-10 w-10 object-contain transition-transform group-hover:scale-105"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              ClimateLife
            </span>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-green-50 text-green-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('feedback')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">{t('反馈', 'Feedback')}</span>
            </button>

            {(user || guestMode) && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all text-sm font-medium"
                title={t('退出登录', 'Logout')}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('退出', 'Logout')}</span>
              </button>
            )}
          </div>
        </div>

        <div className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
