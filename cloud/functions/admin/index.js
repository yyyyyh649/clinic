// 云函数入口文件 - 管理员功能
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
    // 验证管理员权限
    const isAdmin = await checkAdminAccess(openid);
    if (!isAdmin && action !== 'getStats') {
      // getStats 允许普通店员调用查看自己的数据
    }

    switch (action) {
      case 'getStats':
        return await getStats();
      case 'getPendingStaffCount':
        return await getPendingStaffCount();
      case 'getPendingStaff':
        return await getPendingStaff();
      case 'getApprovedStaff':
        return await getApprovedStaff();
      case 'approveStaff':
        return await approveStaff(event.staffId, event.approved);
      case 'getAllCustomers':
        return await getAllCustomers();
      case 'getAllExamRecords':
        return await getAllExamRecords();
      default:
        return { code: -1, message: '未知操作' };
    }
  } catch (err) {
    console.error('管理员云函数错误:', err);
    return {
      code: -1,
      message: err.message || '系统错误'
    };
  }
};

// 检查管理员权限
async function checkAdminAccess(openid) {
  const staff = await db.collection('staff').where({
    openid,
    role: 'admin',
    isApproved: true
  }).get();
  
  return staff.data.length > 0;
}

// 获取统计数据
async function getStats() {
  // 总客户数
  const customersCount = await db.collection('users').count();
  
  // 总店员数
  const staffCount = await db.collection('staff').where({ isApproved: true }).count();
  
  // 客户总余额
  const users = await db.collection('users').field({ balance: true }).get();
  const totalBalance = users.data.reduce((sum, u) => sum + (u.balance || 0), 0);
  
  // 今日验光数
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayExams = await db.collection('exam_records').where({
    examDate: _.gte(today)
  }).count();
  
  return {
    code: 0,
    data: {
      totalCustomers: customersCount.total,
      totalStaff: staffCount.total,
      totalBalance,
      todayExams: todayExams.total
    }
  };
}

// 获取待审核店员数量
async function getPendingStaffCount() {
  const count = await db.collection('staff').where({ isApproved: false }).count();
  
  return {
    code: 0,
    data: {
      count: count.total
    }
  };
}

// 获取待审核店员列表
async function getPendingStaff() {
  const staff = await db.collection('staff').where({
    isApproved: false
  }).orderBy('createdAt', 'desc').get();
  
  return {
    code: 0,
    data: {
      staff: staff.data
    }
  };
}

// 获取已通过店员列表
async function getApprovedStaff() {
  const staff = await db.collection('staff').where({
    isApproved: true
  }).orderBy('createdAt', 'desc').get();
  
  return {
    code: 0,
    data: {
      staff: staff.data
    }
  };
}

// 审核店员
async function approveStaff(staffId, approved) {
  if (approved) {
    await db.collection('staff').doc(staffId).update({
      data: {
        isApproved: true,
        approvedAt: new Date()
      }
    });
  } else {
    // 拒绝则删除记录
    await db.collection('staff').doc(staffId).remove();
  }
  
  return {
    code: 0,
    message: approved ? '已通过' : '已拒绝'
  };
}

// 获取所有客户
async function getAllCustomers() {
  const customers = await db.collection('users').orderBy('createdAt', 'desc').limit(100).get();
  
  // 获取每个客户的验光记录
  const customersWithRecords = await Promise.all(
    customers.data.map(async (c) => {
      const records = await db.collection('exam_records').where({
        customerId: c._id
      }).get();
      return {
        ...c,
        examRecords: records.data
      };
    })
  );
  
  return {
    code: 0,
    data: {
      customers: customersWithRecords
    }
  };
}

// 获取所有验光记录
async function getAllExamRecords() {
  const records = await db.collection('exam_records').orderBy('examDate', 'desc').limit(100).get();
  
  return {
    code: 0,
    data: {
      records: records.data
    }
  };
}
