const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 請將下方 Lohas2026Pass 替換為你在 MongoDB Atlas 設定的新密碼
const mongoUri = process.env.MONGO_URI || "mongodb+srv://ironijkl_db_user:Lohas2026Pass@cluster0.z2o8iiv.mongodb.net/?appName=Cluster0";
const client = new MongoClient(mongoUri);

let db;

// 連接 MongoDB 資料庫
client.connect()
  .then(() => {
    db = client.db('lohas_db');
    console.log('✅ 成功連接至 MongoDB Atlas！');
  })
  .catch(err => console.error('❌ MongoDB 連接失敗:', err));

// 健康檢查 API
app.get('/', (req, res) => {
  res.send('🌿 樂活影音館 API 服務正常運作中！');
});

// 1. 獲取影片清單 API
app.get('/api/videos', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category && category !== '全部' ? { category } : {};
    const videos = await db.collection('videos').find(query).toArray();
    res.json({ success: true, data: videos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. 初始化測試資料 API
app.post('/api/seed', async (req, res) => {
  try {
    const sampleVideos = [
      {
        id: 1,
        title: "10分鐘晨間森林呼吸與全舒展操",
        category: "身心放鬆",
        duration: "10:00",
        thumb: "https://picsum.photos/id/106/400/225",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        desc: "歡迎來到樂活影音館。這套運動專為希望維持關節靈活、釋放壓力的人士設計。"
      },
      {
        id: 2,
        title: "座椅太極：適合久坐與銀髮族的溫和動態",
        category: "座椅伸展操",
        duration: "12:30",
        thumb: "https://picsum.photos/id/292/400/225",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        desc: "不需要站立，坐在椅子上即可跟隨老師練習太極基本招式，保護膝蓋同時活絡全身氣血。"
      }
    ];

    await db.collection('videos').deleteMany({}); 
    await db.collection('videos').insertMany(sampleVideos); 
    res.json({ success: true, message: '範例資料初始化成功！' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API 伺服器已啟動：http://localhost:${PORT}`);
});
