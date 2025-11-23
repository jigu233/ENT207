import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { Sparkles, Book, Heart, ShoppingCart, X } from 'lucide-react';

interface Plant {
  id: string;
  name_zh: string;
  name_en: string;
  description_zh: string;
  description_en: string;
  image_url: string;
  care_guide_zh: string;
  care_guide_en: string;
  meaning_zh: string;
  meaning_en: string;
  flower_meaning: string;
  encyclopedia_info: string;
  purchase_link: string | null;
  optimal_temp_min: number;
  optimal_temp_max: number;
  optimal_humidity_min: number;
  optimal_humidity_max: number;
}

export default function DailyPlantRecommendation() {
  const { t, language } = useLanguage();
  const [featuredPlant, setFeaturedPlant] = useState<Plant | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchDailyPlant();
  }, []);

  const fetchDailyPlant = async () => {
    const { data } = await supabase
      .from('plants')
      .select('*')
      .eq('is_daily_featured', true)
      .maybeSingle();

    if (data) {
      setFeaturedPlant(data);
    } else {
      const { data: randomPlant } = await supabase
        .from('plants')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (randomPlant) {
        await supabase
          .from('plants')
          .update({ is_daily_featured: true, featured_date: new Date().toISOString().split('T')[0] })
          .eq('id', randomPlant.id);
        setFeaturedPlant(randomPlant);
      }
    }
  };

  if (!featuredPlant) return null;

  return (
    <>
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-lg border border-green-200">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          <h3 className="text-xl font-bold text-gray-800">{t('每日植物推荐', 'Daily Plant Recommendation')}</h3>
        </div>

        <div className="flex gap-4">
          <div className="w-32 h-32 rounded-xl overflow-hidden shadow-md flex-shrink-0">
            <img
              src={featuredPlant.image_url}
              alt={language === 'zh' ? featuredPlant.name_zh : featuredPlant.name_en}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1">
            <h4 className="text-lg font-bold text-gray-800 mb-1">
              {language === 'zh' ? featuredPlant.name_zh : featuredPlant.name_en}
            </h4>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {language === 'zh' ? featuredPlant.description_zh : featuredPlant.description_en}
            </p>
            <button
              onClick={() => setShowDetails(true)}
              className="text-sm text-green-600 hover:text-green-700 font-medium hover:underline"
            >
              {t('查看详情 →', 'View Details →')}
            </button>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-800">
                {language === 'zh' ? featuredPlant.name_zh : featuredPlant.name_en}
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="w-full h-64 rounded-xl overflow-hidden shadow-md">
                <img
                  src={featuredPlant.image_url}
                  alt={language === 'zh' ? featuredPlant.name_zh : featuredPlant.name_en}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="bg-pink-50 rounded-xl p-4 border border-pink-200">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-pink-600" />
                  <h4 className="font-bold text-gray-800">{t('花语寓意', 'Flower Meaning')}</h4>
                </div>
                <p className="text-gray-700">{featuredPlant.flower_meaning}</p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Book className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-gray-800">{t('植物百科', 'Encyclopedia')}</h4>
                </div>
                <p className="text-gray-700">{featuredPlant.encyclopedia_info}</p>
              </div>

              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h4 className="font-bold text-gray-800 mb-2">{t('养护指南', 'Care Guide')}</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>{language === 'zh' ? featuredPlant.care_guide_zh : featuredPlant.care_guide_en}</p>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-500">{t('适宜温度', 'Temperature')}</div>
                      <div className="font-semibold text-gray-800">
                        {featuredPlant.optimal_temp_min}°C - {featuredPlant.optimal_temp_max}°C
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-500">{t('适宜湿度', 'Humidity')}</div>
                      <div className="font-semibold text-gray-800">
                        {featuredPlant.optimal_humidity_min}% - {featuredPlant.optimal_humidity_max}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (featuredPlant.purchase_link) {
                    window.open(featuredPlant.purchase_link, '_blank');
                  } else {
                    alert(t('购买链接即将上线', 'Purchase link coming soon'));
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium"
              >
                <ShoppingCart className="w-5 h-5" />
                {t('一键下单', 'Buy Now')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
