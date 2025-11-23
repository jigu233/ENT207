import { useState, useEffect } from 'react';

// 定义数据接口，确保字段名和类型与您的 JSON 数据一致
interface SensorData {
  humidity: number;
  status: string;
  temperature: number;
  timestamp: string;
}

interface PiDataState {
  data: SensorData | null;
  loading: boolean;
  error: string | null;
}

// 您的 cpolar 公网数据接口
const API_URL = "https://ent.vip.cpolar.cn/data"; 

export function usePiData(intervalMs = 5000): PiDataState {
  const [state, setState] = useState<PiDataState>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = async () => {
    try {
      // 正在加载中
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`网络请求失败: ${response.status}`);
      }
      
      const jsonData: SensorData = await response.json();
      
      // 更新状态
      setState({ data: jsonData, loading: false, error: null });
      
    } catch (err) {
      // 处理连接失败或 JSON 解析失败
      const errorMessage = err instanceof Error ? err.message : "连接树莓派失败，请检查 cpolar 隧道状态。";
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  };

  useEffect(() => {
    // 首次加载数据
    fetchData();

    // 设置定时器，每隔 intervalMs 毫秒（默认 5 秒）重新获取数据
    const intervalId = setInterval(fetchData, intervalMs);

    // 组件卸载时清理定时器，避免内存泄漏
    return () => clearInterval(intervalId);
  }, [intervalMs]);

  return state;
}