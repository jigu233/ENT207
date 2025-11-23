import { useEffect, useState } from 'react';
import { getCityBackgroundImage } from '../lib/deepseek';
import { useLanguage } from '../contexts/LanguageContext';

interface DynamicBackgroundProps {
  city: string;
}

export default function DynamicBackground({ city }: DynamicBackgroundProps) {
  const [backgroundImage, setBackgroundImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const fetchCityPhoto = async () => {
      if (!city) {
        setBackgroundImage('https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg?auto=compress&cs=tinysrgb&w=1920');
        return;
      }

      setIsLoading(true);
      try {
        const imageUrl = await getCityBackgroundImage(city, language);
        setBackgroundImage(imageUrl);
      } catch (error) {
        console.error('Error loading city photo:', error);
        setBackgroundImage('https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg?auto=compress&cs=tinysrgb&w=1920');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCityPhoto();
  }, [city, language]);

  return (
    <div className="fixed inset-0 -z-10">
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            opacity: isLoading ? 0 : 1
          }}
        ></div>
      )}

      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-green-50/80 to-teal-50/80"></div>

      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/40"></div>
    </div>
  );
}
