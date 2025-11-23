import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase, ForumPost } from '../lib/supabase';
import { Users, Shirt, Leaf, Heart, MessageCircle, Plus, TrendingUp, Send, Image as ImageIcon, X } from 'lucide-react';

type PostWithProfile = ForumPost & {
  profiles: { username: string | null; avatar_url: string | null };
  forum_comments: { count: number }[];
  forum_likes: { count: number }[];
};

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string | null;
  };
}

export default function CommunityPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [category, setCategory] = useState<'all' | 'outfit' | 'plant'>('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'outfit',
    temperature: 22,
    humidity: 65,
    image_url: ''
  });
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
  }, [category]);

  const fetchPosts = async () => {
    let query = supabase
      .from('forum_posts')
      .select(`
        *,
        profiles (username, avatar_url),
        forum_comments(count),
        forum_likes(count)
      `)
      .order('created_at', { ascending: false });

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data } = await query;
    if (data) {
      setPosts(data as any);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setUploadedImage(base64);
      setNewPost({ ...newPost, image_url: base64 });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setUploadedImage('');
    setNewPost({ ...newPost, image_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await supabase.from('forum_posts').insert({
      user_id: user.id,
      ...newPost
    });

    setNewPost({
      title: '',
      content: '',
      category: 'outfit',
      temperature: 22,
      humidity: 65,
      image_url: ''
    });
    setUploadedImage('');
    setShowCreatePost(false);
    fetchPosts();
  };

  const likePost = async (postId: string) => {
    if (!user) return;

    const { data: existingLike } = await supabase
      .from('forum_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingLike) {
      // 1. 用户取消点赞
      await supabase.from('forum_likes').delete().eq('id', existingLike.id);

      // 2. (setPosts ... 已被删除)

    } else {
      // 3. 用户点赞
      await supabase.from('forum_likes').insert({
        post_id: postId,
        user_id: user.id
      });

      // 4. (setPosts ... 已被删除)
    }

    // 5. ✅ (添加) 无论点赞还是取消，都刷新所有帖子的数据
    fetchPosts();
  };

  const fetchComments = async (postId: string) => {
    const { data } = await supabase
      .from('forum_comments')
      .select(`
        *,
        profiles (username)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (data) {
      setComments(data as any);
    }
  };

  const toggleComments = (postId: string) => {
    const isCurrentlyShown = showComments[postId];

    if (!isCurrentlyShown) {
      fetchComments(postId);
    }

    setShowComments({
      ...showComments,
      [postId]: !isCurrentlyShown
    });
    setSelectedPostId(isCurrentlyShown ? null : postId);
  };

  const addComment = async (postId: string) => {
    if (!user || !newComment.trim()) return;

    await supabase.from('forum_comments').insert({
      post_id: postId,
      user_id: user.id,
      content: newComment.trim()
    });

    setPosts(posts.map(p =>
      p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
    ));

    setNewComment('');
    fetchComments(postId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-green-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800">{t('社区互动', 'Community')}</h2>
            </div>
            <p className="text-sm text-gray-600">{t('分享您的穿搭和植物养护经验', 'Share your outfit and plant care experiences')}</p>
          </div>
          {user && (
            <button
              onClick={() => setShowCreatePost(!showCreatePost)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <Plus className="w-5 h-5" />
              {t('发布', 'Post')}
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              category === 'all'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('全部', 'All')}
          </button>
          <button
            onClick={() => setCategory('outfit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              category === 'outfit'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Shirt className="w-4 h-4" />
            {t('穿搭分享', 'Outfit')}
          </button>
          <button
            onClick={() => setCategory('plant')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              category === 'plant'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Leaf className="w-4 h-4" />
            {t('植物养护', 'Plant Care')}
          </button>
        </div>

        {showCreatePost && user && (
          <form onSubmit={createPost} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-100">
            <h3 className="font-semibold text-gray-800 mb-4">{t('创建新帖子', 'Create New Post')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('分类', 'Category')}
                </label>
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="outfit">{t('穿搭分享', 'Outfit')}</option>
                  <option value="plant">{t('植物养护', 'Plant Care')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('标题', 'Title')}
                </label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('内容', 'Content')}
                </label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('上传图片 (可选)', 'Upload Image (Optional)')}
                </label>
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 transition-all cursor-pointer"
                  >
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {isUploading ? t('上传中...', 'Uploading...') : t('点击上传图片', 'Click to upload image')}
                    </span>
                  </label>
                  {uploadedImage && (
                    <div className="relative inline-block">
                      <img
                        src={uploadedImage}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-green-200"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('温度 (°C)', 'Temperature (°C)')}
                  </label>
                  <input
                    type="number"
                    value={newPost.temperature}
                    onChange={(e) => setNewPost({ ...newPost, temperature: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('湿度 (%)', 'Humidity (%)')}
                  </label>
                  <input
                    type="number"
                    value={newPost.humidity}
                    onChange={(e) => setNewPost({ ...newPost, humidity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium"
                >
                  <Send className="w-4 h-4" />
                  {t('发布', 'Post')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreatePost(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
                >
                  {t('取消', 'Cancel')}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                  {post.profiles?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-800">{post.profiles?.username || t('匿名用户', 'Anonymous')}</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      {post.category === 'outfit' ? (
                        <span className="flex items-center gap-1">
                          <Shirt className="w-3 h-3" />
                          {t('穿搭', 'Outfit')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Leaf className="w-3 h-3" />
                          {t('植物', 'Plant')}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-800 mb-2">{post.title}</h3>
                  <p className="text-gray-700 mb-3">{post.content}</p>

                  {post.image_url && (
                    <div className="mb-3">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full max-w-md rounded-lg border-2 border-gray-200 object-cover"
                      />
                    </div>
                  )}

                  {(post.temperature !== null || post.humidity !== null) && (
                    <div className="flex gap-4 mb-3 text-sm">
                      {post.temperature !== null && (
                        <span className="text-gray-600">
                          {t('温度', 'Temp')}: <span className="font-semibold">{post.temperature}°C</span>
                        </span>
                      )}
                      {post.humidity !== null && (
                        <span className="text-gray-600">
                          {t('湿度', 'Humidity')}: <span className="font-semibold">{post.humidity}%</span>
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => likePost(post.id)}
                      className="flex items-center gap-1 text-gray-600 hover:text-pink-500 transition-colors"
                      disabled={!user}
                    >
                      <Heart className="w-5 h-5" />
                      <span className="text-sm">{post.forum_likes[0]?.count || 0}</span>
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1 text-gray-600 hover:text-blue-500 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">{post.forum_comments[0]?.count || 0}</span>
                    </button>
                  </div>

                  {showComments[post.id] && (
                    <div className="mt-4 border-t border-gray-200 pt-4 space-y-3">
                      <h4 className="font-semibold text-gray-800 mb-3">{t('评论', 'Comments')}</h4>

                      {user && (
                        <div className="flex gap-2 mb-4">
                          <input
                            type="text"
                            value={selectedPostId === post.id ? newComment : ''}
                            onChange={(e) => {
                              setSelectedPostId(post.id);
                              setNewComment(e.target.value);
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addComment(post.id);
                              }
                            }}
                            placeholder={t('写下你的评论...', 'Write your comment...')}
                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          />
                          <button
                            onClick={() => addComment(post.id)}
                            disabled={!newComment.trim() || selectedPostId !== post.id}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div className="space-y-2">
                        {selectedPostId === post.id && comments.length > 0 ? (
                          comments.map((comment) => (
                            <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-gray-800">
                                  {comment.profiles?.username || t('匿名用户', 'Anonymous')}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{comment.content}</p>
                            </div>
                          ))
                        ) : selectedPostId === post.id ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            {t('还没有评论，来发表第一条评论吧！', 'No comments yet, be the first to comment!')}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 text-center shadow-lg border border-gray-100">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">{t('暂无帖子，成为第一个发帖的人！', 'No posts yet, be the first to post!')}</p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-green-100 to-emerald-100 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-green-200">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-green-700" />
          <h3 className="font-bold text-gray-800">{t('热门话题', 'Trending Topics')}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-white/80 rounded-full text-sm text-gray-700">{t('梅雨季防潮', 'Rainy Season Tips')}</span>
          <span className="px-3 py-1 bg-white/80 rounded-full text-sm text-gray-700">{t('夏日穿搭', 'Summer Outfit')}</span>
          <span className="px-3 py-1 bg-white/80 rounded-full text-sm text-gray-700">{t('多肉养护', 'Succulent Care')}</span>
          <span className="px-3 py-1 bg-white/80 rounded-full text-sm text-gray-700">{t('室内空气', 'Indoor Air')}</span>
        </div>
      </div>
    </div>
  );
}
