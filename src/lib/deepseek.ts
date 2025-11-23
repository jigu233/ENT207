const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatWithDeepSeek(
  messages: Message[],
  temperature: number = 0.7
): Promise<string> {
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature,
        max_tokens: 2000,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('DeepSeek API error:', errorData);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '抱歉，我现在无法回复。';
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    throw error;
  }
}

export async function getOutfitAdvice(
  temperature: number,
  humidity: number,
  city: string,
  language: 'zh' | 'en'
): Promise<string> {
  const systemPrompt = language === 'zh'
    ? '你是一位专业的穿搭顾问，根据天气情况为用户提供穿搭建议。请给出简洁、实用的建议，包括上衣、下装、鞋子和配饰的推荐。'
    : 'You are a professional fashion consultant who provides outfit recommendations based on weather conditions. Give concise and practical advice including tops, bottoms, shoes, and accessories.';

  const userPrompt = language === 'zh'
    ? `我在${city}，现在的温度是${temperature}°C，湿度是${humidity}%。请给我一些穿搭建议。`
    : `I'm in ${city}, the current temperature is ${temperature}°C and humidity is ${humidity}%. Please give me some outfit suggestions.`;

  return await chatWithDeepSeek([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]);
}

export async function getPlantCareAdvice(
  plantName: string,
  userQuestion: string,
  language: 'zh' | 'en'
): Promise<string> {
  const systemPrompt = language === 'zh'
    ? '你是一位专业的植物养护专家，为用户提供植物养护建议。请给出准确、详细的养护指导，包括浇水、光照、温度、湿度、施肥等方面的建议。'
    : 'You are a professional plant care expert who provides plant care advice. Give accurate and detailed care instructions including watering, light, temperature, humidity, and fertilization.';

  const userPrompt = language === 'zh'
    ? `我种植的是${plantName}，我想问：${userQuestion}`
    : `I'm growing ${plantName}, and I want to ask: ${userQuestion}`;

  return await chatWithDeepSeek([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]);
}

export async function generalChat(
  messages: Message[],
  context: 'outfit' | 'plant',
  language: 'zh' | 'en'
): Promise<string> {
  const systemPrompt = context === 'outfit'
    ? (language === 'zh'
      ? '你是一位友好的穿搭助手，帮助用户选择合适的服装搭配。请提供实用、时尚的建议。'
      : 'You are a friendly outfit assistant helping users choose suitable clothing combinations. Provide practical and fashionable advice.')
    : (language === 'zh'
      ? '你是一位友好的植物养护助手，帮助用户照顾好他们的植物。请提供专业、易懂的建议。'
      : 'You are a friendly plant care assistant helping users take care of their plants. Provide professional and easy-to-understand advice.');

  const conversationMessages: Message[] = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  return await chatWithDeepSeek(conversationMessages);
}

interface WeatherData {
  temperature: number;
  humidity: number;
  pm25: number;
  valid: boolean;
  cityName?: string;
}

interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
}

async function geocodeCity(cityName: string): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=zh&format=json`
    );

    if (!response.ok) {
      console.error('Geocoding API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.log('City not found in geocoding');
      return null;
    }

    const result = data.results[0];
    return {
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      country: result.country
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

async function getAirQuality(lat: number, lon: number): Promise<number> {
  try {
    const response = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5`
    );

    if (!response.ok) {
      return 50;
    }

    const data = await response.json();
    return Math.round(data.current?.pm2_5 || 50);
  } catch (error) {
    console.error('Air quality error:', error);
    return 50;
  }
}

export async function getCityWeather(
  cityName: string,
  language: 'zh' | 'en'
): Promise<WeatherData> {
  try {
    console.log('Searching for city:', cityName);

    const geoResult = await geocodeCity(cityName);

    if (!geoResult) {
      console.log('City not found');
      return { temperature: 0, humidity: 0, pm25: 0, valid: false };
    }

    console.log('Found city:', geoResult.name, 'at', geoResult.latitude, geoResult.longitude);

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${geoResult.latitude}&longitude=${geoResult.longitude}&current=temperature_2m,relative_humidity_2m&timezone=auto`
    );

    if (!weatherResponse.ok) {
      console.error('Weather API error:', weatherResponse.status);
      return { temperature: 0, humidity: 0, pm25: 0, valid: false };
    }

    const weatherData = await weatherResponse.json();

    const temperature = Math.round(weatherData.current?.temperature_2m || 20);
    const humidity = Math.round(weatherData.current?.relative_humidity_2m || 60);

    console.log('Fetching air quality...');
    const pm25 = await getAirQuality(geoResult.latitude, geoResult.longitude);

    console.log('Weather data:', { temperature, humidity, pm25 });

    return {
      valid: true,
      cityName: geoResult.name,
      temperature,
      humidity,
      pm25
    };
  } catch (error) {
    console.error('Error getting weather data:', error);
    return { temperature: 0, humidity: 0, pm25: 0, valid: false };
  }
}

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

export async function getCityBackgroundImage(
  cityName: string,
  language: 'zh' | 'en'
): Promise<string> {
  try {
    console.log('Fetching photo for city:', cityName);

    const searchQuery = `${cityName} city skyline landmark`;

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=15&orientation=landscape`,
      {
        headers: {
          'Authorization': PEXELS_API_KEY
        }
      }
    );

    if (!response.ok) {
      console.error('Pexels API error:', response.status);
      return 'https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=1920';
    }

    const data = await response.json();

    if (!data.photos || data.photos.length === 0) {
      console.log('No photos found, trying alternative search');

      const altResponse = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(cityName)}&per_page=15&orientation=landscape`,
        {
          headers: {
            'Authorization': PEXELS_API_KEY
          }
        }
      );

      if (altResponse.ok) {
        const altData = await altResponse.json();
        if (altData.photos && altData.photos.length > 0) {
          const photo = altData.photos[0];
          console.log('Found photo:', photo.src.large2x);
          return photo.src.large2x;
        }
      }

      return 'https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=1920';
    }

    const photo = data.photos[0];
    console.log('Found city photo:', photo.src.large2x);
    return photo.src.large2x;

  } catch (error) {
    console.error('Error getting city background:', error);
    return 'https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=1920';
  }
}

export async function generatePlantCareGuide(
  plantName: string,
  language: 'zh' | 'en'
): Promise<string> {
  const systemPrompt = language === 'zh'
    ? `你是一位专业的园艺专家。用户会输入植物名称，请提供详细的养护指南。

请按以下格式输出（使用markdown格式）：

# ${plantName}养护指南

## 1. 光照需求
[详细说明该植物的光照需求，包括光照强度、时长等]

## 2. 浇水方法
[详细说明浇水频率、水量、季节差异等]

## 3. 温度要求
[说明适宜的生长温度范围]

## 4. 湿度控制
[说明空气湿度要求和调节方法]

## 5. 施肥建议
[说明施肥类型、频率和注意事项]

## 6. 土壤配置
[说明土壤类型和配方]

## 7. 常见问题
[列举3-4个常见问题及解决方法]

## 8. 特别提示
[给出重要的养护提醒]

请确保内容专业、实用、易懂。如果该植物名称不存在或无法识别，请说明并提供最接近的植物建议。`
    : `You are a professional horticulture expert. Users will input plant names, and you should provide detailed care guides.

Please output in the following format (using markdown):

# ${plantName} Care Guide

## 1. Light Requirements
[Detailed explanation of light needs, including intensity and duration]

## 2. Watering Method
[Detailed watering frequency, amount, and seasonal variations]

## 3. Temperature Requirements
[Specify optimal temperature range]

## 4. Humidity Control
[Explain humidity requirements and adjustment methods]

## 5. Fertilizing Recommendations
[Specify fertilizer types, frequency, and precautions]

## 6. Soil Configuration
[Explain soil types and formulas]

## 7. Common Issues
[List 3-4 common problems and solutions]

## 8. Special Notes
[Provide important care reminders]

Ensure content is professional, practical, and easy to understand. If the plant name doesn't exist or cannot be identified, explain this and suggest the closest alternative.`;

  const userPrompt = language === 'zh'
    ? `请为"${plantName}"提供详细的养护指南。`
    : `Please provide a detailed care guide for "${plantName}".`;

  try {
    console.log('Generating care guide for:', plantName);

    const careGuide = await chatWithDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], 0.7);

    console.log('Care guide generated successfully');
    return careGuide;

  } catch (error) {
    console.error('Error generating plant care guide:', error);

    const fallbackGuide = language === 'zh'
      ? `# ${plantName}养护指南

## 1. 光照需求
建议放置在光线明亮处，避免强烈直射阳光。

## 2. 浇水方法
保持土壤湿润，但避免积水。春夏季节每2-3天浇水一次，秋冬季节适当减少。

## 3. 温度要求
适宜温度为18-28°C，注意避免温度剧烈变化。

## 4. 湿度控制
喜欢较高的空气湿度，可定期向叶面喷水。

## 5. 施肥建议
生长期每月施肥1-2次，使用稀释的液体肥料。

## 6. 土壤配置
使用疏松透气、排水良好的土壤。

## 7. 常见问题
- 叶片发黄：可能是浇水过多或光照不足
- 生长缓慢：可能需要增加施肥频率
- 叶片干枯：空气湿度可能过低

## 8. 特别提示
注：以上为通用养护建议，具体养护方式请根据植物实际情况调整。`
      : `# ${plantName} Care Guide

## 1. Light Requirements
Place in bright, indirect light. Avoid strong direct sunlight.

## 2. Watering Method
Keep soil moist but not waterlogged. Water every 2-3 days in spring/summer, reduce in fall/winter.

## 3. Temperature Requirements
Ideal temperature is 18-28°C. Avoid sudden temperature changes.

## 4. Humidity Control
Prefers higher humidity. Mist leaves regularly.

## 5. Fertilizing Recommendations
Apply diluted liquid fertilizer 1-2 times monthly during growing season.

## 6. Soil Configuration
Use loose, well-draining soil mix.

## 7. Common Issues
- Yellowing leaves: Overwatering or insufficient light
- Slow growth: May need more frequent fertilization
- Dry leaves: Air humidity may be too low

## 8. Special Notes
Note: These are general care guidelines. Adjust based on your plant's specific needs.`;

    return fallbackGuide;
  }
}
