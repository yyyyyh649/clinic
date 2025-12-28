// 云函数入口文件 - 店员功能
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
      case 'register':
        return await register(openid, event.staffInfo, event.userInfo);
      case 'login':
        return await login(event.phone, event.password);
      case 'wechatLogin':
        return await wechatLogin(openid, event.userInfo);
      case 'getStaffInfo':
        return await getStaffInfo(openid);
      case 'searchCustomer':
        return await searchCustomer(event.phone);
      case 'getCustomerById':
        return await getCustomerById(event.customerId);
      case 'getMonthlyStats':
        return await getMonthlyStats(openid);
      case 'getTodayStats':
        return await getTodayStats(openid);
      case 'getCustomerList':
        return await getCustomerList(openid);
      case 'getFollowUpCustomers':
        return await getFollowUpCustomers(openid);
      case 'recharge':
        return await rechargeCustomer(event);
      case 'scanVerify':
        return await scanVerify(event.qrData);
      case 'processVerify':
        return await processVerify(event);
      case 'getRecentVerifyRecords':
        return await getRecentVerifyRecords(openid);
      default:
        return { code: -1, message: '未知操作' };
    }
  } catch (err) {
    console.error('店员云函数错误:', err);
    return {
      code: -1,
      message: err.message || '系统错误'
    };
  }
};

// 店员注册
async function register(openid, staffInfo, userInfo) {
  // 检查手机号是否已注册
  const existing = await db.collection('staff').where({
    phone: staffInfo.phone
  }).get();
  
  if (existing.data.length > 0) {
    return { code: -1, message: '该手机号已注册' };
  }
  
  const newStaff = {
    openid: openid,
    name: staffInfo.name,
    phone: staffInfo.phone,
    password: staffInfo.password, // 实际应加密存储
    staffId: staffInfo.staffId,
    nickName: userInfo ? userInfo.nickName : '',
    avatarUrl: userInfo ? userInfo.avatarUrl : '',
    role: 'staff', // staff 或 admin
    isApproved: false,
    createdAt: new Date()
  };
  
  await db.collection('staff').add({ data: newStaff });
  
  return {
    code: 0,
    message: '注册成功，请等待管理员审核'
  };
}

// 店员登录
async function login(phone, password) {
  const staff = await db.collection('staff').where({
    phone: phone,
    password: password
  }).get();
  
  if (staff.data.length === 0) {
    return { code: -1, message: '手机号或密码错误' };
  }
  
  const staffInfo = staff.data[0];
  
  if (!staffInfo.isApproved) {
    return { code: -1, message: '账号待审核' };
  }
  
  return {
    code: 0,
    data: {
      staffInfo: staffInfo
    }
  };
}

// 微信登录（店员）
async function wechatLogin(openid, userInfo) {
  // 查找店员
  const staff = await db.collection('staff').where({ openid }).get();
  
  if (staff.data.length === 0) {
    return { code: -1, message: '未找到关联的店员账号，请先注册' };
  }
  
  const staffInfo = staff.data[0];
  
  if (!staffInfo.isApproved) {
    return { code: -1, message: '账号待审核，请联系管理员' };
  }
  
  // 更新微信信息
  await db.collection('staff').doc(staffInfo._id).update({
    data: {
      nickName: userInfo.nickName || staffInfo.nickName,
      avatarUrl: userInfo.avatarUrl || staffInfo.avatarUrl,
      lastLoginAt: new Date()
    }
  });
  
  return {
    code: 0,
    data: {
      staffInfo: {
        ...staffInfo,
        nickName: userInfo.nickName || staffInfo.nickName,
        avatarUrl: userInfo.avatarUrl || staffInfo.avatarUrl
      }
    }
  };
}

// 获取店员信息
async function getStaffInfo(openid) {
  const staff = await db.collection('staff').where({ openid }).get();
  
  if (staff.data.length === 0) {
    return { code: -1, message: '店员不存在' };
  }
  
  return {
    code: 0,
    data: staff.data[0]
  };
}

// 搜索客户
async function searchCustomer(phone) {
  const users = await db.collection('users').where({
    phone: phone
  }).get();
  
  if (users.data.length === 0) {
    return { code: 0, data: { customer: null } };
  }
  
  const user = users.data[0];
  
  // 获取验光记录
  const records = await db.collection('exam_records').where({
    customerId: user._id
  }).orderBy('examDate', 'desc').get();
  
  return {
    code: 0,
    data: {
      customer: {
        ...user,
        examRecords: records.data
      }
    }
  };
}

// 通过ID获取客户
async function getCustomerById(customerId) {
  const users = await db.collection('users').doc(customerId).get();
  
  return {
    code: 0,
    data: {
      customer: users.data
    }
  };
}

// 获取月度统计
async function getMonthlyStats(openid) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // 获取店员信息
  const staff = await db.collection('staff').where({ openid }).get();
  if (staff.data.length === 0) {
    return { code: -1, message: '店员不存在' };
  }
  const staffId = staff.data[0]._id;
  
  // 统计营业额（消费记录）
  const consumeRecords = await db.collection('consume_records').where({
    staffId: staffId,
    createdAt: _.gte(startOfMonth)
  }).get();
  
  const totalRevenue = consumeRecords.data.reduce((sum, r) => sum + (r.amount || 0), 0);
  
  // 统计充值金额
  const rechargeRecords = await db.collection('recharge_records').where({
    staffId: staffId,
    createdAt: _.gte(startOfMonth)
  }).get();
  
  const totalRecharge = rechargeRecords.data.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  
  // 统计验光次数
  const examRecords = await db.collection('exam_records').where({
    optometristId: staffId,
    examDate: _.gte(startOfMonth)
  }).get();
  
  return {
    code: 0,
    data: {
      totalRevenue,
      totalRecharge,
      examCount: examRecords.data.length,
      customerCount: new Set([...consumeRecords.data.map(r => r.customerId), ...rechargeRecords.data.map(r => r.customerId)]).size
    }
  };
}

// 获取今日统计
async function getTodayStats(openid) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const staff = await db.collection('staff').where({ openid }).get();
  if (staff.data.length === 0) {
    return { code: -1, message: '店员不存在' };
  }
  const staffId = staff.data[0]._id;
  
  // 今日验光
  const exams = await db.collection('exam_records').where({
    optometristId: staffId,
    examDate: _.gte(today)
  }).get();
  
  // 今日核销
  const verifies = await db.collection('verify_records').where({
    staffId: staffId,
    createdAt: _.gte(today)
  }).get();
  
  // 今日充值
  const recharges = await db.collection('recharge_records').where({
    staffId: staffId,
    createdAt: _.gte(today)
  }).get();
  
  const rechargeAmount = recharges.data.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  
  // 今日消费
  const consumes = await db.collection('consume_records').where({
    staffId: staffId,
    createdAt: _.gte(today)
  }).get();
  
  const consumeAmount = consumes.data.reduce((sum, r) => sum + (r.amount || 0), 0);
  
  return {
    code: 0,
    data: {
      examCount: exams.data.length,
      verifyCount: verifies.data.length,
      rechargeAmount,
      consumeAmount
    }
  };
}

// 获取客户列表
async function getCustomerList(openid) {
  const staff = await db.collection('staff').where({ openid }).get();
  if (staff.data.length === 0) {
    return { code: -1, message: '店员不存在' };
  }
  const staffId = staff.data[0]._id;
  
  // 获取该店员服务过的客户
  const examRecords = await db.collection('exam_records').where({
    optometristId: staffId
  }).get();
  
  const customerIds = [...new Set(examRecords.data.map(r => r.customerId))];
  
  if (customerIds.length === 0) {
    return { code: 0, data: { customers: [] } };
  }
  
  const customers = await db.collection('users').where({
    _id: _.in(customerIds)
  }).get();
  
  return {
    code: 0,
    data: {
      customers: customers.data
    }
  };
}

// 获取待跟进客户
async function getFollowUpCustomers(openid) {
  const staff = await db.collection('staff').where({ openid }).get();
  if (staff.data.length === 0) {
    return { code: -1, message: '店员不存在' };
  }
  const staffId = staff.data[0]._id;
  
  // 获取该店员服务过的客户
  const examRecords = await db.collection('exam_records').where({
    optometristId: staffId
  }).get();
  
  // 按客户分组，取最后验光日期
  const customerMap = {};
  examRecords.data.forEach(r => {
    if (!customerMap[r.customerId] || new Date(r.examDate) > new Date(customerMap[r.customerId])) {
      customerMap[r.customerId] = r.examDate;
    }
  });
  
  const customerIds = Object.keys(customerMap);
  
  if (customerIds.length === 0) {
    return { code: 0, data: { customers: [] } };
  }
  
  const customers = await db.collection('users').where({
    _id: _.in(customerIds)
  }).get();
  
  const result = customers.data.map(c => ({
    ...c,
    lastExamDate: customerMap[c._id]
  }));
  
  return {
    code: 0,
    data: {
      customers: result
    }
  };
}

// 客户充值
async function rechargeCustomer(event) {
  const { customerId, rechargeAmount, giftAmount, totalAmount, paymentMethod, remark, staffId, staffName } = event;
  
  // 更新客户余额
  await db.collection('users').doc(customerId).update({
    data: {
      balance: _.inc(totalAmount)
    }
  });
  
  // 记录充值记录
  await db.collection('recharge_records').add({
    data: {
      customerId,
      rechargeAmount,
      giftAmount,
      totalAmount,
      paymentMethod,
      remark,
      staffId,
      staffName,
      createdAt: new Date()
    }
  });
  
  return {
    code: 0,
    message: '充值成功'
  };
}

// 扫码验证
async function scanVerify(qrData) {
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
    
    // 获取用户信息
    const users = await db.collection('users').where({ openid }).get();
    
    if (users.data.length === 0) {
      return { code: -1, message: '用户不存在' };
    }
    
    const user = users.data[0];
    
    // 获取可用奖品
    const prizes = await db.collection('lottery_records').where({
      openid,
      isUsed: false,
      expireAt: _.gt(new Date())
    }).get();
    
    return {
      code: 0,
      data: {
        customerId: user._id,
        customerName: user.nickName || user.name,
        phone: user.phone,
        balance: user.balance || 0,
        prizes: prizes.data
      }
    };
  } catch (err) {
    return { code: -1, message: '无效的二维码' };
  }
}

// 处理核销
async function processVerify(event) {
  const { customerId, deductAmount, prizeIds, remark } = event;
  
  // 扣除余额
  if (deductAmount > 0) {
    await db.collection('users').doc(customerId).update({
      data: {
        balance: _.inc(-deductAmount)
      }
    });
    
    // 记录消费
    await db.collection('consume_records').add({
      data: {
        customerId,
        amount: deductAmount,
        remark,
        createdAt: new Date()
      }
    });
  }
  
  // 核销奖品
  for (const prizeId of prizeIds) {
    await db.collection('lottery_records').doc(prizeId).update({
      data: {
        isUsed: true,
        usedAt: new Date()
      }
    });
  }
  
  // 记录核销
  await db.collection('verify_records').add({
    data: {
      customerId,
      deductAmount,
      prizeIds,
      remark,
      createdAt: new Date()
    }
  });
  
  return {
    code: 0,
    message: '核销成功'
  };
}

// 获取最近核销记录
async function getRecentVerifyRecords(openid) {
  const staff = await db.collection('staff').where({ openid }).get();
  if (staff.data.length === 0) {
    return { code: -1, message: '店员不存在' };
  }
  const staffId = staff.data[0]._id;
  
  const records = await db.collection('verify_records').where({
    staffId: staffId
  }).orderBy('createdAt', 'desc').limit(10).get();
  
  return {
    code: 0,
    data: {
      records: records.data
    }
  };
}
