import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MessageSquare, Send, CheckCircle, ArrowLeft } from 'lucide-react';

interface FeedbackPageProps {
  onNavigateHome: () => void;
}

export default function FeedbackPage({ onNavigateHome }: FeedbackPageProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await supabase.from('user_feedback').insert({
        name: name || null,
        email: null,
        content
      });

      setSubmitted(true);
      setName('');
      setContent('');

      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onNavigateHome}
        className="mb-4 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-xl hover:bg-white/95 transition-all shadow-md hover:shadow-lg text-gray-700 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('返回主页', 'Back to Home')}
      </button>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-green-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
            <MessageSquare className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{t('用户反馈', 'User Feedback')}</h2>
            <p className="text-sm text-gray-600">{t('您的反馈对我们很重要', 'Your feedback is important to us')}</p>
          </div>
        </div>

        {submitted ? (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 text-center border border-green-200">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t('提交成功！', 'Submitted Successfully!')}</h3>
            <p className="text-gray-600 mb-6">{t('感谢您的反馈，我们会认真阅读并改进。', 'Thank you for your feedback. We will review and improve.')}</p>
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('返回主页', 'Back to Home')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('姓名', 'Name')} <span className="text-gray-400">({t('可选', 'Optional')})</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('请输入您的姓名', 'Enter your name')}
                className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('反馈内容', 'Feedback')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('请详细描述您的建议或遇到的问题...', 'Please describe your suggestions or issues in detail...')}
                rows={8}
                className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>{t('提交中...', 'Submitting...')}</span>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>{t('提交反馈', 'Submit Feedback')}</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            {t('反馈将发送至', 'Feedback will be sent to')}: <span className="font-semibold">3148788504@qq.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
