import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { generalChat } from '../lib/deepseek';
import { Bot, X, Minimize2, Maximize2, Send, Shirt, Leaf, Loader2 } from 'lucide-react';

export default function AIAssistant() {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'outfit' | 'plant'>('outfit');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message;
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await generalChat(
        newMessages,
        activeTab,
        language
      );

      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = language === 'zh'
        ? '抱歉，我现在无法回复。请稍后再试。'
        : 'Sorry, I cannot respond right now. Please try again later.';

      setMessages((prev) => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 flex items-center justify-center group"
      >
        <Bot className="w-7 h-7 transition-transform group-hover:rotate-12" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-green-100 transition-all ${
        isMinimized ? 'w-72' : 'w-96'
      }`}
      style={{ maxHeight: isMinimized ? '60px' : '600px' }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold">{t('AI 助手', 'AI Assistant')}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded-lg transition-all"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('outfit');
                setMessages([]);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 font-medium transition-all ${
                activeTab === 'outfit'
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Shirt className="w-4 h-4" />
              <span className="text-sm">{t('穿搭建议', 'Outfit')}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('plant');
                setMessages([]);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 font-medium transition-all ${
                activeTab === 'plant'
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Leaf className="w-4 h-4" />
              <span className="text-sm">{t('植物养护', 'Plant Care')}</span>
            </button>
          </div>

          {/* Messages */}
          <div className="p-4 h-96 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-12 h-12 text-green-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600">
                  {t(
                    '您好！我是 AI 助手，有什么可以帮您的吗？',
                    "Hello! I'm your AI assistant. How can I help you?"
                  )}
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 rounded-2xl px-4 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                placeholder={t('输入您的问题...', 'Type your question...')}
                disabled={isLoading}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !message.trim()}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
