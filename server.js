const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// 中間件 (Middleware)
app.use(cors());
app.use(express.json());

// 🍃 MongoDB 連線設定
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ 成功連接至 MongoDB Atlas！'))
  .catch(err => console.error('❌ MongoDB 連接失敗:', err));

// 📹 定義 Video 資料模型
const videoSchema = new mongoose.Schema({
  title: String,
  category: String,
  thumbnail: String,
  videoUrl: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const Video = mongoose.models.Video || mongoose.model('Video', videoSchema);

// ------------------- 路由設定 (Routes) ------------------- //

// 1. 測試根目錄 (防止 404)
app.get('/', (req, res) => {
  res.send('🌐 樂活 API 伺服器正在正常運作中！');
});

// 2. 取得所有影片 API
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json({ success: true, videos });
  } catch (err) {
    console.error('❌ 抓取影片失敗:', err);
    res.status(500).json({ success: false, message: '無法讀取影片資料' });
  }
});

// 3. Dify AI 顧問 API (專為 Chatflow / Workflow 設計)
app.post('/api/dify/chat', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, message: '請提供查詢內容' });
    }

    console.log(`🤖 收到 AI 查詢: "${query}"，正在呼叫 Dify API...`);

    const response = await fetch(process.env.DIFY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {},                // Chatflow / Workflow 必需欄位
        query: query,
        response_mode: 'blocking', // 阻塞式一次返回
        user: 'lohas-user-client'
      })
    });

    const data = await response.json();

    if (response.ok) {
      // 相容 Chatflow 與一般 ChatApp 的回答結構
      let aiAnswer = data.answer;
      if (!aiAnswer && data.data && data.data.outputs) {
        aiAnswer = data.data.outputs.text || data.data.outputs.result || data.data.outputs.answer;
      }

      if (!aiAnswer) {
        aiAnswer = 'AI 顧問分析完成，請參考相關建議。';
      }

      console.log('✅ Dify 回應成功！');
      return res.json({ success: true, answer: aiAnswer });
    } else {
      console.error('❌ Dify API 報錯詳情:', data);
      return res.status(500).json({ success: false, message: data.message || 'Dify API 回應異常' });
    }
  } catch (err) {
    console.error('❌ 伺服器處理 Dify 請求失敗:', err);
    return res.status(500).json({ success: false, message: '後端連線異常' });
  }
});

// 🚀 啟動 Express 伺服器
app.listen(PORT, () => {
  console.log(`🌐 樂活後端 API 已在埠 ${PORT} 啟動`);
});
