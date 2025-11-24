import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase, IoTDevice } from '../lib/supabase';
import { Plus, Wifi, WifiOff, Thermometer, Droplets, Power, Trash2, Home, Activity } from 'lucide-react'; // ✨ 引入 Activity 图标
import { usePiData } from '../hooks/usePiData'; // ✨ 1. 引入获取树莓派数据的 Hook

export default function DevicesPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDevice, setNewDevice] = useState({
    device_name: '',
    device_type: 'sensor',
    location: ''
  });

  // ✨ 2. 获取树莓派实时数据
  // 每 3 秒刷新一次，你可以根据需要调整
  const { data: piData, error: piError } = usePiData(3000); 

  useEffect(() => {
    if (user) {
      fetchDevices();
    }
  }, [user]);

  const fetchDevices = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('iot_devices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setDevices(data);
    }
  };

  const addDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const deviceData: any = {
      user_id: user.id,
      ...newDevice,
      is_online: true // ✨ 默认设为在线，方便直接看到效果
    };

    // 数据库里存个初始值即可，反正展示时会被实时数据覆盖
    if (newDevice.device_type === 'sensor') {
      deviceData.temperature = 0; 
      deviceData.humidity = 0;
    } else if (newDevice.device_type === 'humidifier') {
      deviceData.humidity = 0;
    }

    await supabase.from('iot_devices').insert(deviceData);

    setNewDevice({ device_name: '', device_type: 'sensor', location: '' });
    setShowAddDevice(false);
    fetchDevices();
  };

  const deleteDevice = async (deviceId: string) => {
    await supabase.from('iot_devices').delete().eq('id', deviceId);
    fetchDevices();
  };

  const toggleDevice = async (deviceId: string, currentStatus: boolean) => {
    await supabase
      .from('iot_devices')
      .update({ is_online: !currentStatus, last_update: new Date().toISOString() })
      .eq('id', deviceId);
    fetchDevices();
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'sensor': return Thermometer;
      case 'humidifier': return Droplets;
      case 'purifier': return Power;
      default: return Wifi;
    }
  };

  const getDeviceTypeLabel = (type: string) => {
    const types: Record<string, { zh: string; en: string }> = {
      sensor: { zh: '温湿度传感器', en: 'Temperature & Humidity Sensor' },
      humidifier: { zh: '加湿器', en: 'Humidifier' },
      purifier: { zh: '空气净化器', en: 'Air Purifier' }
    };
    return t(types[type]?.zh || type, types[type]?.en || type);
  };

  if (!user) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 shadow-lg border border-green-100 text-center">
        <Wifi className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">{t('请登录后管理您的IoT设备', 'Please login to manage your IoT devices')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-green-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{t('我的IoT设备', 'My IoT Devices')}</h2>
            <p className="text-sm text-gray-600 mt-1">{t('管理您的智能家居设备', 'Manage your smart home devices')}</p>
          </div>
          
          {/* ✨ 可选：在右上角显示树莓派连接状态，方便调试 */}
          <div className="flex items-center gap-2 text-xs">
             {piData ? (
                <span className="text-green-600 flex items-center gap-1"><Activity className="w-3 h-3" /> 温湿度传感器数据源正常</span>
             ) : (
                <span className="text-gray-400">正在搜索智能家居...</span>
             )}
          </div>

          <button
            onClick={() => setShowAddDevice(!showAddDevice)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <Plus className="w-5 h-5" />
            {t('添加设备', 'Add Device')}
          </button>
        </div>

        {showAddDevice && (
          <form onSubmit={addDevice} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-100">
             {/* ... 表单部分保持不变 ... */}
             {/* 为节省篇幅，此处省略表单代码，请保持你原有的表单代码 */}
             {/* ... 如果你需要我把表单代码也贴出来请告诉我 ... */}
             <h3 className="font-semibold text-gray-800 mb-4">{t('添加新设备', 'Add New Device')}</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('设备名称', 'Device Name')}
                </label>
                <input
                  type="text"
                  value={newDevice.device_name}
                  onChange={(e) => setNewDevice({ ...newDevice, device_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('设备类型', 'Device Type')}
                </label>
                <select
                  value={newDevice.device_type}
                  onChange={(e) => setNewDevice({ ...newDevice, device_type: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="sensor">{t('传感器', 'Sensor')}</option>
                  <option value="humidifier">{t('加湿器', 'Humidifier')}</option>
                  <option value="purifier">{t('净化器', 'Purifier')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('位置', 'Location')}
                </label>
                <input
                  type="text"
                  value={newDevice.location}
                  onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                  placeholder={t('例如：卧室', 'e.g., Bedroom')}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button type="submit" className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium">
                {t('添加', 'Add')}
              </button>
              <button type="button" onClick={() => setShowAddDevice(false)} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium">
                {t('取消', 'Cancel')}
              </button>
            </div>
          </form>
        )}

        {devices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => {
              const DeviceIcon = getDeviceIcon(device.device_type);

              // ✨ 3. 关键逻辑：数据覆盖
              // 如果设备类型是 'sensor' 且我们获取到了 piData，就使用 piData 的数据
              // 否则，使用数据库里的数据 (device.temperature)
              let displayTemp = device.temperature;
              let displayHum = device.humidity;
              let lastUpdate = device.last_update;

              if (device.device_type === 'sensor' && piData) {
                  displayTemp = piData.temperature;
                  displayHum = piData.humidity;
                  // 如果想展示树莓派的更新时间，可以用 piData.timestamp
                  // 这里我们保留数据库时间，或者你可以拼接显示
              }

              // 加湿器也可以展示树莓派的湿度数据
              if (device.device_type === 'humidifier' && piData) {
                  displayHum = piData.humidity;
              }

              return (
                <div
                  key={device.id}
                  className={`bg-gradient-to-br rounded-2xl p-6 shadow-lg border transition-all hover:shadow-xl ${
                    device.is_online
                      ? 'from-green-50 to-emerald-50 border-green-200'
                      : 'from-gray-50 to-slate-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${device.is_online ? 'bg-green-100' : 'bg-gray-200'}`}>
                        <DeviceIcon className={`w-6 h-6 ${device.is_online ? 'text-green-600' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{device.device_name}</h3>
                        <p className="text-xs text-gray-500">{getDeviceTypeLabel(device.device_type)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {device.is_online ? (
                        <Wifi className="w-5 h-5 text-green-500" />
                      ) : (
                        <WifiOff className="w-5 h-5 text-gray-400" />
                      )}
                      
                      {/* ✨ 使用 displayTemp 变量 */}
                      {device.is_online && device.device_type === 'sensor' && displayTemp !== null && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{displayTemp}°C</div>
                          {/* 可选：显示来源标记 */}
                          {piData && <div className="text-[10px] text-green-400">Live</div>}
                        </div>
                      )}
                      
                       {/* ✨ 使用 displayHum 变量 */}
                      {device.is_online && device.device_type === 'humidifier' && displayHum !== null && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">{displayHum}%</div>
                        </div>
                      )}
                      
                      {device.is_online && device.device_type === 'purifier' && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-purple-600">{t('良好', 'Good')}</div>
                          <div className="text-xs text-gray-500">PM2.5: 35</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {device.location && (
                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                      <Home className="w-4 h-4" />
                      <span>{device.location}</span>
                    </div>
                  )}

                  {/* ✨ 卡片内部的详细数据展示，也使用 displayTemp/Hum */}
                  {device.is_online && (device.device_type === 'sensor' || device.device_type === 'humidifier') && (
                    <div className="bg-white/80 rounded-lg p-3 mb-3 border border-green-100">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {(device.device_type === 'sensor') && (
                            <div>
                            <p className="text-gray-600 mb-1">{t('温度', 'Temp')}</p>
                            <p className="font-bold text-gray-800">{displayTemp}°C</p>
                            </div>
                        )}
                        <div>
                          <p className="text-gray-600 mb-1">{t('湿度', 'Humidity')}</p>
                          <p className="font-bold text-gray-800">{displayHum}%</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleDevice(device.id, device.is_online)}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        device.is_online
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {device.is_online ? t('关闭', 'Turn Off') : t('开启', 'Turn On')}
                    </button>
                    <button
                      onClick={() => deleteDevice(device.id)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    {t('最后更新', 'Last updated')}: {piData && device.is_online ? piData.timestamp : new Date(device.last_update).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          // ... 空状态部分保持不变 ...
           <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200">
            <Wifi className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">{t('您还没有添加任何设备', 'You haven\'t added any devices yet')}</p>
            <button
              onClick={() => setShowAddDevice(true)}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              {t('添加第一个设备', 'Add Your First Device')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}