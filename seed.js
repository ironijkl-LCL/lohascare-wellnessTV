const mongoose = require('mongoose');
require('dotenv').config();

const videoSchema = new mongoose.Schema({
  title: String,
  category: String,
  thumbnail: String,
  videoUrl: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const Video = mongoose.models.Video || mongoose.model('Video', videoSchema);

// 🎬 5 部精選樂活影片庫（已修正為 iframe 可播放的 embed 網址）
const initialVideos = [
  {
    title: '銀髮族 10 分鐘溫和座椅伸展操',
    category: '座椅伸展操',
    thumbnail: 'https://img.youtube.com/vi/W4K44n2vSzA/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/W4K44n2vSzA',
    description: '專為關節僵硬長者設計，坐著也能安全運動、促進血液循環。'
  },
  {
    title: '預防嗆咳與安全吞嚥護理指引',
    category: '養生飲食',
    thumbnail: 'https://img.youtube.com/vi/3P9x4uR34cQ/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/3P9x4uR34cQ',
    description: '介紹長者用餐安全、口腔肌肉鍛鍊與預防嗆咳的飲食調整技巧。'
  },
  {
    title: '太極八段錦 - 適合長者的溫和養生氣功',
    category: '溫和太極',
    thumbnail: 'https://img.youtube.com/vi/5g1_0C3S4v0/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/5g1_0C3S4v0',
    description: '動作平緩舒展，協助訓練下肢平衡感、呼吸調節與氣血順暢。'
  },
  {
    title: '森林鳥鳴與溪流聲 - 15分鐘身心放鬆自然音效',
    category: '自然音效',
    thumbnail: 'https://img.youtube.com/vi/eKFTSSKCzWA/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/eKFTSSKCzWA',
    description: '採集大自然真實白噪音，幫助長者舒緩焦慮情緒、提升睡眠品質。'
  },
  {
    title: '長者全身關節活絡 - 樂活椅上動一動',
    category: '座椅伸展操',
    thumbnail: 'https://img.youtube.com/vi/L_A_HjVR3_E/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/L_A_HjVR3_E',
    description: '動功配合深呼吸，針對肩頸與膝關節進行溫和放鬆。'
  }
];

async function seedDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🍃 連線成功，開始寫入 5 部樂活影片資料...');
    
    await Video.deleteMany({}); // 清空舊資料
    await Video.insertMany(initialVideos);
    console.log('✅ 5 部測試影片已成功寫入 MongoDB Atlas！');
  } catch (err) {
    console.error('❌ 寫入失敗:', err);
    process.exitCode = 1;
  } finally {
    // 確保無論成功或失敗，都會安全關閉連線
    await mongoose.disconnect();
    console.log('🔌 資料庫連線已安全斷開');
  }
}

seedDB();
