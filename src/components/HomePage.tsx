import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { getCityWeather } from '../lib/deepseek';
import { MapPin, Thermometer, Droplets, Wind, TrendingUp, Shirt, Home as HomeIcon, Leaf, Loader2, AlertCircle } from 'lucide-react';

interface HomePageProps {
  city: string;
  onCityChange: (city: string) => void;
}

export default function HomePage({ city, onCityChange }: HomePageProps) {
  const { t, language } = useLanguage();
  const [cityInput, setCityInput] = useState(city);
  const [weatherData, setWeatherData] = useState({
    temperature: 22,
    humidity: 65,
    pm25: 35
  });
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [cityError, setCityError] = useState(false);

  useEffect(() => {
    const fetchCityData = async () => {
      if (city) {
        setIsLoadingWeather(true);
        setCityError(false);

        const weatherResult = await getCityWeather(city, language);

        if (weatherResult.valid) {
          setWeatherData({
            temperature: weatherResult.temperature,
            humidity: weatherResult.humidity,
            pm25: weatherResult.pm25
          });

          await supabase
            .from('cities')
            .upsert({
              name: city,
              temperature: weatherResult.temperature,
              humidity: weatherResult.humidity,
              pm25: weatherResult.pm25,
              updated_at: new Date().toISOString()
            }, { onConflict: 'name' });
        } else {
          setCityError(true);
        }

        setIsLoadingWeather(false);
      }
    };
    fetchCityData();
  }, [city, language]);

  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cityInput.trim()) {
      setCityError(false);
      setIsLoadingWeather(true);

      const weatherResult = await getCityWeather(cityInput.trim(), language);

      if (weatherResult.valid) {
        onCityChange(weatherResult.cityName || cityInput.trim());
      } else {
        setCityError(true);
        setIsLoadingWeather(false);
      }
    }
  };

  const getClothingRecommendation = () => {
    const temp = weatherData.temperature;
    if (temp < 10) {
      return {
        commute: t('羽绒服、厚外套、围巾', 'Down jacket, thick coat, scarf'),
        home: t('毛衣、长裤、拖鞋', 'Sweater, pants, slippers'),
        sport: t('运动外套、长袖运动服', 'Sports jacket, long-sleeve sportswear')
      };
    } else if (temp < 20) {
      return {
        commute: t('风衣、薄外套、长裤', 'Windbreaker, light jacket, pants'),
        home: t('长袖T恤、休闲裤', 'Long-sleeve t-shirt, casual pants'),
        sport: t('运动夹克、运动裤', 'Sports jacket, sports pants')
      };
    } else if (temp < 28) {
      return {
        commute: t('衬衫、轻薄外套、长裤', 'Shirt, light jacket, pants'),
        home: t('T恤、短裤或长裤', 'T-shirt, shorts or pants'),
        sport: t('运动T恤、运动短裤', 'Sports t-shirt, sports shorts')
      };
    } else {
      return {
        commute: t('短袖、轻薄衣物、防晒', 'Short sleeves, light clothing, sun protection'),
        home: t('背心、短裤、凉鞋', 'Tank top, shorts, sandals'),
        sport: t('速干T恤、运动短裤', 'Quick-dry t-shirt, sports shorts')
      };
    }
  };

  const getEnvironmentAdvice = () => {
    const { humidity, pm25 } = weatherData;
    const advice = [];

    if (humidity < 40) {
      advice.push(t('💧 湿度偏低，建议开启加湿器', '💧 Low humidity, recommend using humidifier'));
    } else if (humidity > 70) {
      advice.push(t('🌡️ 湿度偏高，建议开启除湿器', '🌡️ High humidity, recommend using dehumidifier'));
    }

    if (pm25 < 50) {
      advice.push(t('🪟 空气质量良好，适合开窗通风', '🪟 Good air quality, suitable for opening windows'));
    } else if (pm25 > 100) {
      advice.push(t('😷 空气质量差，建议开启空气净化器', '😷 Poor air quality, recommend using air purifier'));
    }

    return advice.length > 0 ? advice : [t('✅ 环境状况良好', '✅ Environment conditions are good')];
  };

  const clothingRec = getClothingRecommendation();
  const envAdvice = getEnvironmentAdvice();

  return (
    <div className="space-y-6">
      <form onSubmit={handleCitySubmit} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-green-100">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-green-600" />
          <input
            type="text"
            value={cityInput}
            onChange={(e) => {
              setCityInput(e.target.value);
              if (cityError) setCityError(false);
            }}
            placeholder={t('输入城市名称...', 'Enter city name...')}
            disabled={isLoadingWeather}
            className={`flex-1 px-4 py-2 bg-white/80 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              cityError ? 'border-red-500' : 'border-gray-200'
            }`}
          />
          <button
            type="submit"
            disabled={isLoadingWeather}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoadingWeather ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('搜索中...', 'Searching...')}
              </>
            ) : (
              t('搜索', 'Search')
            )}
          </button>
        </div>
        {cityError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span>{t('无法找到该城市，请检查城市名称后重新输入', 'City not found, please check the name and try again')}</span>
          </div>
        )}
        {city && !cityError && (
          <p className="mt-3 text-sm text-gray-600">
            {t('当前城市', 'Current city')}: <span className="font-semibold text-green-700">{city}</span>
          </p>
        )}
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-red-50 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-800">{t('温度', 'Temperature')}</h3>
            </div>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-4xl font-bold text-orange-600">{weatherData.temperature}°C</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">{t('湿度', 'Humidity')}</h3>
            </div>
          </div>
          <p className="text-4xl font-bold text-blue-600">{weatherData.humidity}%</p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-slate-50 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">PM2.5</h3>
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-600">{weatherData.pm25}</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-green-100">
        <div className="flex items-center gap-2 mb-4">
          <Shirt className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-bold text-gray-800">{t('穿衣建议', 'Clothing Recommendations')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
            <p className="font-semibold text-green-700 mb-2">{t('通勤', 'Commute')}</p>
            <p className="text-sm text-gray-700">{clothingRec.commute}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
            <p className="font-semibold text-green-700 mb-2">{t('居家', 'Home')}</p>
            <p className="text-sm text-gray-700">{clothingRec.home}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
            <p className="font-semibold text-green-700 mb-2">{t('运动', 'Sport')}</p>
            <p className="text-sm text-gray-700">{clothingRec.sport}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-green-100">
        <div className="flex items-center gap-2 mb-4">
          <HomeIcon className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-bold text-gray-800">{t('环境调节建议', 'Environment Advice')}</h2>
        </div>
        <div className="space-y-2">
          {envAdvice.map((advice, index) => (
            <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-100">
              <p className="text-sm text-gray-700">{advice}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-100 to-emerald-100 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-green-200">
        <div className="flex items-center gap-2 mb-3">
          <Leaf className="w-5 h-5 text-green-700" />
          <h2 className="text-xl font-bold text-gray-800">{t('植物养护提示', 'Plant Care Tips')}</h2>
        </div>
        <p className="text-gray-700 mb-2">
          {t(
            '当前环境适合养护喜欢温暖湿润的植物，如绿萝、吊兰、富贵竹等。',
            'Current environment is suitable for plants that prefer warm and humid conditions, such as pothos, spider plant, and lucky bamboo.'
          )}
        </p>
        <p className="text-sm text-gray-600">
          {t('查看"植物中心"了解更多养护指南', 'Visit "Plant Care" for more guidance')}
        </p>
      </div>
    </div>
  );
}
