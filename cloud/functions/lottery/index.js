// 云函数入口文件 - 抽奖功能
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 奖品配置
const PRIZES = [
  { id: 1, name: '全场8折券', icon: '🎫', probability: 0.1 },
  { id: 2, name: '免费清洗', icon: '🧹', probability: 0.25 },
  { id: 3, name: '眼镜布', icon: '🧴', probability: 0.25 },
  { id: 4, name: '眼镜盒', icon: '📦', probability: 0.15 },
  { id: 5, name: '10积分', icon: '⭐', probability: 0.15 },
  { id: 6, name: '谢谢参与', icon: '🙏', probability: 0.1 }
];

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action } = event;

  try {
    switch (action) {
      case 'draw':
        return await draw(openid);
      case 'checkToday':
        return await checkTodayLottery(openid);
      case 'getMyPrizes':
        return await getMyPrizes(openid);
      case 'usePrize':
        return await usePrize(openid, event.prizeId);
      default:
        return { code: -1, message: '未知操作' };
    }
  } catch (err) {
    console.error('抽奖云函数错误:', err);
    return {
      code: -1,
      message: err.message || '系统错误'
    };
  }
};

// 抽奖
async function draw(openid) {
  // 检查今日是否已抽奖
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const records = await db.collection('lottery_records').where({
    openid: openid,
    createdAt: _.gte(today)
  }).get();
  
  if (records.data.length > 0) {
    return { code: -1, message: '今日已抽奖' };
  }
  
  // 抽奖逻辑
  const random = Math.random();
  let cumulative = 0;
  let selectedPrize = PRIZES[PRIZES.length - 1];
  let prizeIndex = PRIZES.length - 1;
  
  for (let i = 0; i < PRIZES.length; i++) {
    cumulative += PRIZES[i].probability;
    if (random <= cumulative) {
      selectedPrize = PRIZES[i];
      prizeIndex = i;
      break;
    }
  }
  
  // 计算过期时间（3天后）
  const expireAt = new Date();
  expireAt.setDate(expireAt.getDate() + 3);
  
  // 保存抽奖记录
  const prizeRecord = {
    openid: openid,
    prizeId: selectedPrize.id,
    name: selectedPrize.name,
    icon: selectedPrize.icon,
    isUsed: false,
    expireAt: expireAt,
    createdAt: new Date()
  };
  
  await db.collection('lottery_records').add({ data: prizeRecord });
  
  // 如果是积分奖励，直接添加积分
  if (selectedPrize.id === 5) {
    await db.collection('users').where({ openid }).update({
      data: {
        points: _.inc(10)
      }
    });
  }
  
  return {
    code: 0,
    data: {
      prizeIndex: prizeIndex,
      prize: selectedPrize
    }
  };
}

// 检查今日是否已抽奖
async function checkTodayLottery(openid) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const records = await db.collection('lottery_records').where({
    openid: openid,
    createdAt: _.gte(today)
  }).get();
  
  return {
    code: 0,
    data: {
      hasDrawn: records.data.length > 0
    }
  };
}

// 获取我的奖品
async function getMyPrizes(openid) {
  const records = await db.collection('lottery_records').where({
    openid: openid
  }).orderBy('createdAt', 'desc').limit(50).get();
  
  return {
    code: 0,
    data: {
      prizes: records.data
    }
  };
}

// 使用奖品
async function usePrize(openid, prizeId) {
  const prizes = await db.collection('lottery_records').where({
    _id: prizeId,
    openid: openid
  }).get();
  
  if (prizes.data.length === 0) {
    return { code: -1, message: '奖品不存在' };
  }
  
  const prize = prizes.data[0];
  
  if (prize.isUsed) {
    return { code: -1, message: '奖品已使用' };
  }
  
  if (new Date(prize.expireAt) < new Date()) {
    return { code: -1, message: '奖品已过期' };
  }
  
  await db.collection('lottery_records').doc(prizeId).update({
    data: {
      isUsed: true,
      usedAt: new Date()
    }
  });
  
  return {
    code: 0,
    message: '核销成功'
  };
}
