import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Leaf, Globe } from 'lucide-react';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, setGuestMode } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, username);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setGuestMode(true);
  };

  const handleTestAccount = async () => {
    setError('');
    setLoading(true);

    try {
      await signIn('1234567890@qq.com', '1234567890');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-64 h-64 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-64 h-64 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700"></div>
          <div className="absolute bottom-20 left-1/2 w-64 h-64 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-green-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl mb-4 shadow-lg">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {t('ClimateLife', 'ClimateLife')}
            </h1>
            <p className="text-gray-600">
              {t('智能环境生活指南', 'Smart Environmental Living Guide')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('用户名', 'Username')}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('邮箱', 'Email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('密码', 'Password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? t('处理中...', 'Processing...') : isSignUp ? t('注册', 'Sign Up') : t('登录', 'Sign In')}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleTestAccount}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-medium py-3 rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {t('测试账号', 'Test Account')}
              </button>

              <button
                onClick={handleSkip}
                className="bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 transition-all"
              >
                {t('访客模式', 'Guest Mode')}
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <Globe className="w-4 h-4 text-green-600" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'zh' | 'en')}
                className="bg-transparent border-none outline-none cursor-pointer text-sm font-medium text-gray-700"
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </div>

            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-green-600 font-medium text-sm hover:text-green-700 transition-colors"
            >
              {isSignUp ? t('已有账号？登录', 'Have an account? Sign In') : t('没有账号？注册', 'No account? Sign Up')}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1 text-center">
              <p>{t('⚠️ 本应用为 Alpha 测试版本', '⚠️ This is an Alpha test version')}</p>
              <p>{t('👩‍💻 由西交利物浦大学学生开发', '👩‍💻 Developed by XJTLU students')}</p>
              <p>{t('🚫 本应用为非商业项目，仅供教学与实验使用', '🚫 Non-commercial project for educational purposes only')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
