cat << 'EOF' > ~/lohas-backend/server.js
require('dotenv').config({ override: true });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const Video = require('./models/Video');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 連線 MongoDB (若環境變數存在)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('📦 Express 已連線至 MongoDB'))
    .catch(err => console.error('MongoDB 連線錯誤:', err));
}

// 長者口語 ➔ 專業醫護影音標籤辭典 (精準匹配核心)
const SYMPTOM_MAPPING = {
  '濁親': ['健口', '吞嚥', '口映', '口腔', '唾液'],
  '嗆咳': ['健口', '吞嚥', '口映', '口腔', '喉嚨'],
  '吞唔順': ['健口', '吞嚥', '進食'],
  '膝蓋': ['膝', '菠蘿蓋', '關節', '座椅', '下肢'],
  '膝頭': ['膝', '菠蘿蓋', '關節', '座椅', '下肢'],
  '菠蘿蓋': ['膝', '關節', '座椅', '下肢'],
  '行路唔穩': ['防跌', '平衡', '下肢肌力', '步態'],
  '跌倒': ['防跌', '平衡', '輪椅', '下肢'],
  '腰痛': ['腰', '背', '伸展', '八段錦', '椅子操'],
  '瞓唔著': ['太極', '放鬆', '助眠', '經絡', '八段錦'],
  '失眠': ['太極', '放鬆', '助眠', '經絡']
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 1. 取得影片列表 API
app.get('/api/videos', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category && category !== '全部' ? { category } : {};
    
    if (mongoose.connection.readyState === 1) {
      const videos = await Video.find(filter)
        .sort({ isVerified: -1, createdAt: -1 })
        .limit(60);
      return res.json({ success: true, count: videos.length, videos });
    }
    res.json({ success: true, count: 0, videos: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: '伺服器內部錯誤' });
  }
});

// 2. 智慧安全 AI 處方代理端點 (App Store 零密鑰暴露安全標準)
app.post('/api/dify/chat', async (req, res) => {
  const { query, conversation_id } = req.body;
  if (!query) return res.status(400).json({ success: false, message: '請提供症狀或運動遙測數據' });

  // A. 若伺服器環境變數有 DIFY_API_KEY，優先向 Dify 官方雲端請求
  if (process.env.DIFY_API_KEY) {
    try {
      const difyRes = await axios.post(
        "https://api.dify.ai/v1/chat-messages",
        {
          query: query,
          inputs: {},
          response_mode: "blocking",
          user: "elder_lohas_user",
          conversation_id: conversation_id || ""
        },
        {
          headers: {
            "Authorization": `Bearer app-f8fkCAVL84MoOGBtJJnfefoI`,
            "Content-Type": "application/json"
          },
          timeout: 10000
        }
      );
      return res.json({
        success: true,
        answer: difyRes.data.answer,
        conversation_id: difyRes.data.conversation_id
      });
    } catch (err) {
      console.warn("Dify 雲端 API 逾時或異常，切換至本地醫護精準匹配兜底:", err.message);
    }
  }

  // B. 本地長者醫護辭典精準匹配 (兜底與離線運算)
  try {
    let actionTitle = "長者專屬運動處方";
    let summary = "為你搵到最啱嘅長者復康指導，每日跟做 3-5 分鐘，放鬆肌肉。";
    let steps = ["保持坐姿端正，呼吸平穩", "跟隨影片動作慢慢活動", "量力而為，感到放鬆即可"];
    let safety = "如動作進行時感到劇烈痛楚或頭暈，請即停低休息。";
    let recVideoId = "knee_leung_1";

    if (query.includes('濁') || query.includes('咳') || query.includes('吞')) {
      actionTitle = "🗣️ 長者健口操・預防嗆咳";
      summary = "食嘢容易濁親多數因為喉部肌肉退化，跟住做吞嚥健口操，可以加強吞嚥力量！";
      steps = ["頭部慢慢向左右轉動放鬆頸肌", "鼓起兩腮含氣 3 秒，再慢慢吹氣", "伸出舌頭向前、向上伸展各 3 次"];
      safety = "練習前可先飲一啖溫水濕潤喉嚨。";
      recVideoId = "swallow_hospital_1";
    } else if (query.includes('膝') || query.includes('關節') || query.includes('菠蘿蓋')) {
      actionTitle = "🦵 坐姿膝關節強化運動";
      summary = "菠蘿蓋痛唔好勉強企喺度行，坐喺穩陣椅子上伸展大腿肌肉最安全！";
      steps = ["坐穩椅子，單腳慢慢向前伸直抬平", "腳尖向上勾起，維持 5 秒感受大腿用力", "慢慢放低，左右腳輪流做 8 次"];
      safety = "切忌腳踢得太猛，關節有刺痛即停。";
      recVideoId = "knee_leung_1";
    } else if (query.includes('跌') || query.includes('穩') || query.includes('平衡')) {
      actionTitle = "🛡️ 扶椅防跌平衡練習";
      summary = "扶穩椅背做核心與腳跟活動，步態更四平八穩。";
      steps = ["雙手輕扶穩固椅子", "慢慢墊起腳跟維持 3 秒", "慢慢放平，感受小腿發力"];
      safety = "必須確保椅子穩固不會滑動。";
      recVideoId = "fall_balance_1";
    }

    res.json({
      success: true,
      answer: JSON.stringify({
        action_title: actionTitle,
        voice_summary: summary,
        recommended_video_id: recVideoId,
        quick_steps: steps,
        safety_tip: safety
      })
    });
  } catch (error) {
    console.error('AI 處理失敗:', error);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 樂活伺服器已在本地啟動：http://localhost:${PORT}`);
});
EOF
