cat << 'EOF' > ~/lohas-backend/server.js
require('dotenv').config({ override: true });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Video = require('./models/Video');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 連線 MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('📦 Express 已連線至 MongoDB'))
  .catch(err => console.error('MongoDB 連線錯誤:', err));

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
    
    const videos = await Video.find(filter)
      .sort({ isVerified: -1, createdAt: -1 })
      .limit(60);

    res.json({ success: true, count: videos.length, videos });
  } catch (error) {
    res.status(500).json({ success: false, message: '伺服器內部錯誤' });
  }
});

// 2. 智慧精準匹配 AI 處方端點
app.post('/api/dify/chat', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ success: false, message: '請提供症狀' });

  try {
    // 智慧擴展關鍵字
    let searchKeywords = [query];
    for (const [symptom, tags] of Object.entries(SYMPTOM_MAPPING)) {
      if (query.includes(symptom)) {
        searchKeywords = searchKeywords.concat(tags);
      }
    }

    // 動態構建高精準 MongoDB 搜尋條件
    const regexQueries = searchKeywords.map(k => new RegExp(k, 'i'));
    const matchedVideo = await Video.findOne({
      $or: [
        { title: { $in: regexQueries } },
        { description: { $in: regexQueries } },
        { tags: { $in: regexQueries } },
        { category: { $in: regexQueries } }
      ]
    });

    // 若依然未配對到，按分類兜底提供最穩陣的長者影片
    const fallbackVideo = await Video.findOne({ category: '座椅伸展操' }) || await Video.findOne();
    const finalVideo = matchedVideo || fallbackVideo;

    // 依症狀生成大字結構化處方
    let actionTitle = "長者專屬運動處方";
    let summary = `為你搵到最啱嘅「${finalVideo.title.substring(0, 16)}...」，每日跟做 3-5 分鐘。`;
    let steps = ["保持坐姿端正，呼吸平穩", "跟隨影片動作慢慢活動", "量力而為，感到放鬆即可"];
    let safety = "如動作進行時感到劇烈痛楚或頭暈，請即停低休息。";

    if (query.includes('濁') || query.includes('咳') || query.includes('吞')) {
      actionTitle = "🗣️ 長者健口操・預防嗆咳";
      summary = "食嘢容易濁親多數因為喉部肌肉退化，跟住做吞嚥健口操，可以加強吞嚥力量！";
      steps = ["頭部慢慢向左右轉動放鬆頸肌", "鼓起兩腮含氣 3 秒，再慢慢吹氣", "伸出舌頭向前、向上伸展各 3 次"];
      safety = "練習前可先飲一啖溫水濕潤喉嚨。";
    } else if (query.includes('膝') || query.includes('關節') || query.includes('菠蘿蓋')) {
      actionTitle = "🦵 坐姿膝關節強化運動";
      summary = "菠蘿蓋痛唔好勉強企喺度行，坐喺穩陣椅子上伸展大腿肌肉最安全！";
      steps = ["坐穩椅子，單腳慢慢向前伸直抬平", "腳尖向上勾起，維持 5 秒感受大腿用力", "慢慢放低，左右腳輪流做 8 次"];
      safety = "切忌腳踢得太猛，關節有刺痛即停。";
    }

    res.json({
      success: true,
      answer: JSON.stringify({
        action_title: actionTitle,
        voice_summary: summary,
        recommended_video_id: finalVideo.videoId,
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
