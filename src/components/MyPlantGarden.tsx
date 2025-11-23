import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { generatePlantCareGuide } from '../lib/deepseek';
import { Leaf, Plus, Camera, MessageSquare, X, Calendar, Image as ImageIcon, Search, Loader2, Trash2 } from 'lucide-react';

interface Plant {
  id: string;
  name_zh: string;
  name_en: string;
  care_guide_zh: string;
  care_guide_en: string;
  image_url: string;
}

interface UserPlant {
  id: string;
  plant_id: string;
  custom_name: string | null;
  plant_image_url: string | null;
  notes: string | null;
  created_at: string;
  plants: Plant;
}

interface PlantRecord {
  id: string;
  record_type: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

export default function MyPlantGarden() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [userPlants, setUserPlants] = useState<UserPlant[]>([]);
  const [availablePlants, setAvailablePlants] = useState<Plant[]>([]);
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<UserPlant | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [newPlant, setNewPlant] = useState({
    plant_id: '',
    custom_name: '',
    plant_image_url: '',
    notes: '',
    custom_plant_name: '',
    ai_care_guide: ''
  });
  const [newRecord, setNewRecord] = useState({
    record_type: 'text',
    content: '',
    image_url: ''
  });
  const [records, setRecords] = useState<PlantRecord[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [useCustomPlant, setUseCustomPlant] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchUserPlants();
      fetchAvailablePlants();
    }
  }, [user]);

  const fetchUserPlants = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_plants')
      .select(`
        *,
        plants (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setUserPlants(data as any);
    }
  };

  const fetchAvailablePlants = async () => {
    const { data } = await supabase
      .from('plants')
      .select('*')
      .order('name_zh');

    if (data) {
      setAvailablePlants(data);
    }
  };

  const fetchPlantRecords = async (userPlantId: string) => {
    const { data } = await supabase
      .from('plant_records')
      .select('*')
      .eq('user_plant_id', userPlantId)
      .order('created_at', { ascending: false });

    if (data) {
      setRecords(data);
    }
  };

  const searchPlantCareGuide = async () => {
    if (!newPlant.custom_plant_name.trim()) return;

    setIsSearching(true);

    try {
      const plantName = newPlant.custom_plant_name;
      const careGuide = await generatePlantCareGuide(plantName, language);

      setNewPlant({ ...newPlant, ai_care_guide: careGuide });
    } catch (error) {
      console.error('Error generating care guide:', error);
      alert(t('生成养护指南失败，请重试', 'Failed to generate care guide, please try again'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'plant' | 'record') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (target === 'plant') {
        setNewPlant({ ...newPlant, plant_image_url: base64 });
      } else {
        setUploadedImage(base64);
        setNewRecord({ ...newRecord, image_url: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  // ⬇️ 复制这个新函数，替换掉你原来的 addPlant 函数 ⬇️
  const addPlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // 我们只保留“自定义植物”的逻辑
    if (!newPlant.custom_plant_name) {
      alert(t('请输入植物名称', 'Please enter a plant name'));
      return;
    }

    const { data: newCustomPlant } = await supabase
      .from('plants')
      .insert({
        name_zh: newPlant.custom_plant_name,
        name_en: newPlant.custom_plant_name,
        description_zh: `用户自定义植物：${newPlant.custom_plant_name}`,
        description_en: `Custom plant: ${newPlant.custom_plant_name}`,
        care_guide_zh: newPlant.ai_care_guide || '暂无养护指南',
        care_guide_en: newPlant.ai_care_guide || 'No care guide available',
        image_url: newPlant.plant_image_url || '/logo.jpg',
        optimal_temp_min: 18,
        optimal_temp_max: 28,
        optimal_humidity_min: 40,
        optimal_humidity_max: 70
      })
      .select()
      .single();

    if (newCustomPlant) {
      await supabase.from('user_plants').insert({
        user_id: user.id,
        plant_id: newCustomPlant.id,
        custom_name: newPlant.custom_name,
        plant_image_url: newPlant.plant_image_url,
        notes: newPlant.notes
      });
    }

    // 重置表单
    setNewPlant({
      plant_id: '',
      custom_name: '',
      plant_image_url: '',
      notes: '',
      custom_plant_name: '',
      ai_care_guide: ''
    });
    setUseCustomPlant(true); // 确保下次打开还是自定义表单
    setShowAddPlant(false);
    fetchUserPlants();
  };

  const addRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPlant) return;

    await supabase.from('plant_records').insert({
      user_plant_id: selectedPlant.id,
      ...newRecord
    });

    setNewRecord({
      record_type: 'text',
      content: '',
      image_url: ''
    });
    setUploadedImage('');
    fetchPlantRecords(selectedPlant.id);
  };

  const deleteRecord = async (recordId: string) => {
    if (!window.confirm(t('确定要删除这条记录吗？', 'Are you sure you want to delete this record?'))) {
      return;
    }

    try {
      await supabase
        .from('plant_records')
        .delete()
        .eq('id', recordId);

      if (selectedPlant) {
        fetchPlantRecords(selectedPlant.id);
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      alert(t('删除失败，请重试', 'Failed to delete, please try again'));
    }
  };

  // 删除植物花园的植物
  const handleDeletePlant = async (plantToDelete: UserPlant) => {
    const plantName = plantToDelete.custom_name || (language === 'zh' ? plantToDelete.plants.name_zh : plantToDelete.plants.name_en);
    if (!window.confirm(t(`确定要删除 "${plantName}" 吗？此操作无法撤销。`, `Are you sure you want to delete "${plantName}"? This action cannot be undone.`))) {
      return;
    }
  
    try {
      // 1. 删除所有相关的“生长记录”
      await supabase
        .from('plant_records')
        .delete()
        .eq('user_plant_id', plantToDelete.id);
  
      // 2. 删除“用户植物”本身
      const { error } = await supabase
        .from('user_plants')
        .delete()
        .eq('id', plantToDelete.id);
  
      if (error) {
        throw error;
      }
  
      // 3. 更新前端状态，移除已删除的植物
      setUserPlants(currentPlants =>
        currentPlants.filter(plant => plant.id !== plantToDelete.id)
      );
      
      // 4. 关闭详情弹窗 (如果它开着)
      if (selectedPlant?.id === plantToDelete.id) {
        setShowRecordModal(false);
        setSelectedPlant(null); // 清除选中的植物
      }
      
      console.log("删除成功!");
  
    } catch (error: any) {
      console.error("删除植物时出错:", error.message);
    }
  };
  
  const openPlantDetails = (plant: UserPlant) => {
    setSelectedPlant(plant);
    setShowRecordModal(true);
    fetchPlantRecords(plant.id);
  };

  const getTodayCareGuide = (plant: Plant) => {
    return language === 'zh' ? plant.care_guide_zh : plant.care_guide_en;
  };

  if (!user) return null;

  return (
    <>
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 shadow-lg border border-green-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-bold text-gray-800">{t('我的植物花园', 'My Plant Garden')}</h3>
          </div>
          <button
            onClick={() => setShowAddPlant(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {t('添加植物', 'Add Plant')}
          </button>
        </div>

        {userPlants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userPlants.map((userPlant) => (
              <div
                key={userPlant.id}
                onClick={() => openPlantDetails(userPlant)}
                className="relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group h-48"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${userPlant.plant_image_url || userPlant.plants.image_url})`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                </div>

                <div className="relative h-full flex flex-col justify-between p-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 self-start">
                    <h4 className="font-bold text-gray-800 text-sm">
                      {userPlant.custom_name || (language === 'zh' ? userPlant.plants.name_zh : userPlant.plants.name_en)}
                    </h4>
                  </div>

                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-600 mb-1">{t('今日养护指南', 'Today\'s Care')}</div>
                    <p className="text-xs text-gray-700 line-clamp-2">
                      {getTodayCareGuide(userPlant.plants)}
                    </p>
                  </div>
                </div>

                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // 阻止打开详情
                      handleDeletePlant(userPlant); // 调用你新增的删除函数
                    }}
                    className="bg-red-500/90 backdrop-blur-sm rounded-full p-2 hover:bg-red-600"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                    <Camera className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Leaf className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">{t('还没有添加植物，开始你的绿色旅程吧！', 'No plants yet, start your green journey!')}</p>
            <button
              onClick={() => setShowAddPlant(true)}
              className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <Plus className="w-5 h-5" />
              {t('添加第一株植物', 'Add Your First Plant')}
            </button>
          </div>
        )}
      </div>

      {showAddPlant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddPlant(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">{t('添加植物', 'Add Plant')}</h3>
              <button onClick={() => setShowAddPlant(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={addPlant} className="p-6 space-y-4">

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('植物名称', 'Plant Name')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPlant.custom_plant_name}
                        onChange={(e) => setNewPlant({ ...newPlant, custom_plant_name: e.target.value })}
                        placeholder={t('输入植物名称', 'Enter plant name')}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required={useCustomPlant}
                      />
                      <button
                        type="button"
                        onClick={searchPlantCareGuide}
                        disabled={!newPlant.custom_plant_name.trim() || isSearching}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSearching ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t('搜索中', 'Searching')}
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4" />
                            {t('搜索', 'Search')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {newPlant.ai_care_guide && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Search className="w-4 h-4 text-green-600" />
                        {t('AI 养护指南', 'AI Care Guide')}
                      </h4>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap font-sans prose prose-sm max-w-none prose-headings:text-gray-800 prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base prose-h2:mt-3 prose-h2:mb-2 prose-p:my-1 prose-ul:my-1">
                        {newPlant.ai_care_guide}
                      </div>
                    </div>
                  )}
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('自定义名称 (可选)', 'Custom Name (Optional)')}
                </label>
                <input
                  type="text"
                  value={newPlant.custom_name}
                  onChange={(e) => setNewPlant({ ...newPlant, custom_name: e.target.value })}
                  placeholder={t('给你的植物起个名字', 'Give your plant a name')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('上传植物照片 (可选)', 'Upload Photo (Optional)')}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'plant')}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {newPlant.plant_image_url && (
                  <img src={newPlant.plant_image_url} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('备注 (可选)', 'Notes (Optional)')}
                </label>
                <textarea
                  value={newPlant.notes}
                  onChange={(e) => setNewPlant({ ...newPlant, notes: e.target.value })}
                  rows={3}
                  placeholder={t('记录一些特殊的养护注意事项', 'Record special care notes')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium"
              >
                {t('添加', 'Add')}
              </button>
            </form>
          </div>
        </div>
      )}

      {showRecordModal && selectedPlant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRecordModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                {selectedPlant.custom_name || (language === 'zh' ? selectedPlant.plants.name_zh : selectedPlant.plants.name_en)}
              </h3>
              <button onClick={() => setShowRecordModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="w-full h-48 rounded-xl overflow-hidden shadow-md">
                <img
                  src={selectedPlant.plant_image_url || selectedPlant.plants.image_url}
                  alt={selectedPlant.custom_name || selectedPlant.plants.name_zh}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-green-600" />
                  {t('养护指南', 'Care Guide')}
                </h4>
                <div className="text-sm text-gray-700 whitespace-pre-wrap font-sans prose prose-sm max-w-none prose-headings:text-gray-800 prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base prose-h2:mt-3 prose-h2:mb-2 prose-p:my-1 prose-ul:my-1">
                  {getTodayCareGuide(selectedPlant.plants)}
                </div>
              </div>

              <form onSubmit={addRecord} className="bg-green-50 rounded-xl p-4 border border-green-200 space-y-3">
                <h4 className="font-bold text-gray-800">{t('记录生长状态', 'Record Growth')}</h4>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRecord({ ...newRecord, record_type: 'text' })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      newRecord.record_type === 'text'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    {t('文字', 'Text')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRecord({ ...newRecord, record_type: 'photo' })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      newRecord.record_type === 'photo'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Camera className="w-4 h-4 inline mr-1" />
                    {t('照片', 'Photo')}
                  </button>
                </div>

                <textarea
                  value={newRecord.content}
                  onChange={(e) => setNewRecord({ ...newRecord, content: e.target.value })}
                  rows={3}
                  placeholder={t('记录你的观察...', 'Record your observations...')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />

                {newRecord.record_type === 'photo' && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'record')}
                      className="hidden"
                      id="record-image-upload"
                    />
                    <label
                      htmlFor="record-image-upload"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 transition-all cursor-pointer"
                    >
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">{t('上传照片', 'Upload Photo')}</span>
                    </label>
                    {uploadedImage && (
                      <img src={uploadedImage} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium"
                >
                  {t('保存记录', 'Save Record')}
                </button>
              </form>

              <div className="space-y-3">
                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {t('生长记录', 'Growth Records')}
                </h4>
                {records.length > 0 ? (
                  records.map((record) => (
                    <div key={record.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative group">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-xs text-gray-500">
                          {new Date(record.created_at).toLocaleDateString()} {new Date(record.created_at).toLocaleTimeString()}
                        </div>
                        <button
                          onClick={() => deleteRecord(record.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 rounded-lg"
                          title={t('删除记录', 'Delete record')}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                      {record.image_url && (
                        <img src={record.image_url} alt="Record" className="w-full h-32 object-cover rounded-lg mb-2" />
                      )}
                      <p className="text-sm text-gray-700">{record.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">{t('还没有生长记录', 'No growth records yet')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
