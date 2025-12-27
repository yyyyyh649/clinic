// 云函数入口文件 - 二维码生成和验证
const cloud = require('wx-server-sdk');
const crypto = require('crypto');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action } = event;

  try {
    switch (action) {
      case 'verifyPassword':
        return await verifyPassword(openid, event.password);
      case 'setPassword':
        return await setPassword(openid, event.password);
      case 'generate':
        return await generateQRCode(openid);
      case 'verify':
        return await verifyQRCode(event.qrData);
      default:
        return { code: -1, message: '未知操作' };
    }
  } catch (err) {
    console.error('二维码云函数错误:', err);
    return {
      code: -1,
      message: err.message || '系统错误'
    };
  }
};

// 验证支付密码
async function verifyPassword(openid, password) {
  const users = await db.collection('users').where({ openid }).get();
  
  if (users.data.length === 0) {
    return { code: -1, message: '用户不存在' };
  }
  
  const user = users.data[0];
  
  // 如果用户未设置密码，默认通过（或者可以设置默认密码）
  if (!user.paymentPassword) {
    return { code: 0, message: '验证成功' };
  }
  
  // 验证密码（实际应使用加密比对）
  const hashedPassword = hashPassword(password);
  
  if (user.paymentPassword !== hashedPassword) {
    return { code: -1, message: '密码错误' };
  }
  
  return { code: 0, message: '验证成功' };
}

// 设置支付密码
async function setPassword(openid, password) {
  const hashedPassword = hashPassword(password);
  
  await db.collection('users').where({ openid }).update({
    data: {
      paymentPassword: hashedPassword,
      hasPaymentPassword: true
    }
  });
  
  return { code: 0, message: '设置成功' };
}

// 生成二维码数据
async function generateQRCode(openid) {
  const timestamp = new Date().toISOString();
  const token = generateToken();
  
  const qrcodeData = JSON.stringify({
    openid,
    timestamp,
    token
  });
  
  // 可以保存token到数据库用于验证
  await db.collection('qrcode_tokens').add({
    data: {
      openid,
      token,
      createdAt: new Date(),
      expireAt: new Date(Date.now() + 5 * 60 * 1000) // 5分钟后过期
    }
  });
  
  return {
    code: 0,
    data: {
      qrcodeData
    }
  };
}

// 验证二维码
async function verifyQRCode(qrData) {
  try {
    const data = JSON.parse(qrData);
    const { openid, timestamp, token } = data;
    
    // 验证二维码是否过期（5分钟）
    const qrTime = new Date(timestamp);
    const now = new Date();
    const diff = (now - qrTime) / 1000 / 60;
    
    if (diff > 5) {
      return { code: -1, message: '二维码已过期' };
    }
    
    // 验证token
    const tokens = await db.collection('qrcode_tokens').where({
      openid,
      token
    }).get();
    
    if (tokens.data.length === 0) {
      return { code: -1, message: '无效的二维码' };
    }
    
    // 获取用户信息
    const users = await db.collection('users').where({ openid }).get();
    
    if (users.data.length === 0) {
      return { code: -1, message: '用户不存在' };
    }
    
    return {
      code: 0,
      data: {
        user: users.data[0]
      }
    };
  } catch (err) {
    return { code: -1, message: '无效的二维码' };
  }
}

// 密码哈希
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'optical_store_salt').digest('hex');
}

// 生成随机token
function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}
