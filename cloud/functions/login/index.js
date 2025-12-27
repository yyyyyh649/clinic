// 云函数入口文件 - 用户登录和信息管理
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action } = event;

  try {
    switch (action) {
      case 'phoneLogin':
        return await phoneLogin(openid, event);
      case 'wechatLogin':
        return await wechatLogin(openid, event);
      case 'updateUserInfo':
        return await updateUserInfo(openid, event);
      case 'getUserInfo':
        return await getUserInfo(openid);
      case 'getPoints':
        return await getPoints(openid);
      case 'getBalance':
        return await getBalance(openid);
      default:
        // 默认返回openid，用于获取登录状态
        return {
          code: 0,
          openid: openid
        };
    }
  } catch (err) {
    console.error('登录云函数错误:', err);
    return {
      code: -1,
      message: err.message || '系统错误'
    };
  }
};

// 手机号登录
async function phoneLogin(openid, event) {
  const { phone, code } = event;
  
  // 这里应该验证短信验证码，暂时跳过
  // TODO: 接入短信验证码服务
  
  // 查找或创建用户
  const users = await db.collection('users').where({ phone }).get();
  
  if (users.data.length > 0) {
    // 用户已存在，更新openid
    const user = users.data[0];
    await db.collection('users').doc(user._id).update({
      data: {
        openid: openid,
        lastLoginAt: new Date()
      }
    });
    
    return {
      code: 0,
      data: {
        userInfo: {
          ...user,
          openid: openid
        }
      }
    };
  } else {
    // 创建新用户
    const userId = generateUserId();
    const newUser = {
      openid: openid,
      phone: phone,
      userId: userId,
      nickName: '用户' + userId,
      avatarUrl: '',
      gender: 0,
      age: null,
      points: 0,
      balance: 0,
      memberLevel: '普通会员',
      hasPaymentPassword: false,
      role: 'customer',
      createdAt: new Date(),
      lastLoginAt: new Date()
    };
    
    await db.collection('users').add({ data: newUser });
    
    return {
      code: 0,
      data: {
        userInfo: newUser
      }
    };
  }
}

// 微信登录
async function wechatLogin(openid, event) {
  const { userInfo } = event;
  
  // 查找或创建用户
  const users = await db.collection('users').where({ openid }).get();
  
  if (users.data.length > 0) {
    // 用户已存在，更新信息
    const user = users.data[0];
    await db.collection('users').doc(user._id).update({
      data: {
        nickName: userInfo.nickName || user.nickName,
        avatarUrl: userInfo.avatarUrl || user.avatarUrl,
        gender: userInfo.gender || user.gender,
        lastLoginAt: new Date()
      }
    });
    
    return {
      code: 0,
      data: {
        userInfo: {
          ...user,
          nickName: userInfo.nickName || user.nickName,
          avatarUrl: userInfo.avatarUrl || user.avatarUrl
        }
      }
    };
  } else {
    // 创建新用户
    const userId = generateUserId();
    const newUser = {
      openid: openid,
      phone: '',
      userId: userId,
      nickName: userInfo.nickName || '用户' + userId,
      avatarUrl: userInfo.avatarUrl || '',
      gender: userInfo.gender || 0,
      age: null,
      points: 0,
      balance: 0,
      memberLevel: '普通会员',
      hasPaymentPassword: false,
      role: 'customer',
      createdAt: new Date(),
      lastLoginAt: new Date()
    };
    
    await db.collection('users').add({ data: newUser });
    
    return {
      code: 0,
      data: {
        userInfo: newUser
      }
    };
  }
}

// 更新用户信息
async function updateUserInfo(openid, event) {
  const { userInfo } = event;
  
  const users = await db.collection('users').where({ openid }).get();
  
  if (users.data.length === 0) {
    return { code: -1, message: '用户不存在' };
  }
  
  await db.collection('users').doc(users.data[0]._id).update({
    data: {
      ...userInfo,
      updatedAt: new Date()
    }
  });
  
  return {
    code: 0,
    message: '更新成功'
  };
}

// 获取用户信息
async function getUserInfo(openid) {
  const users = await db.collection('users').where({ openid }).get();
  
  if (users.data.length === 0) {
    return { code: -1, message: '用户不存在' };
  }
  
  return {
    code: 0,
    data: users.data[0]
  };
}

// 获取积分
async function getPoints(openid) {
  const users = await db.collection('users').where({ openid }).get();
  
  if (users.data.length === 0) {
    return { code: -1, message: '用户不存在' };
  }
  
  return {
    code: 0,
    data: {
      points: users.data[0].points || 0
    }
  };
}

// 获取余额
async function getBalance(openid) {
  const users = await db.collection('users').where({ openid }).get();
  
  if (users.data.length === 0) {
    return { code: -1, message: '用户不存在' };
  }
  
  return {
    code: 0,
    data: {
      balance: users.data[0].balance || 0
    }
  };
}

// 生成用户ID
function generateUserId() {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}
