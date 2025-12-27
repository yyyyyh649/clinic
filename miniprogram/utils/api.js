// utils/api.js
// API 调用封装

const callFunction = (name, data = {}) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data,
      success: res => {
        if (res.result && res.result.code === 0) {
          resolve(res.result);
        } else {
          reject(res.result || { message: '请求失败' });
        }
      },
      fail: err => {
        console.error(`调用云函数 ${name} 失败:`, err);
        reject(err);
      }
    });
  });
};

// 用户相关接口
const userApi = {
  // 登录
  login: () => callFunction('login'),
  
  // 注册/更新用户信息
  updateUserInfo: (userInfo) => callFunction('login', { action: 'updateUserInfo', userInfo }),
  
  // 获取用户信息
  getUserInfo: () => callFunction('login', { action: 'getUserInfo' }),
  
  // 获取用户积分
  getPoints: () => callFunction('login', { action: 'getPoints' }),
  
  // 获取会员卡余额
  getBalance: () => callFunction('login', { action: 'getBalance' }),
};

// 抽奖相关接口
const lotteryApi = {
  // 抽奖
  draw: () => callFunction('lottery', { action: 'draw' }),
  
  // 获取今日是否已抽奖
  checkTodayLottery: () => callFunction('lottery', { action: 'checkToday' }),
  
  // 获取我的奖品列表
  getMyPrizes: () => callFunction('lottery', { action: 'getMyPrizes' }),
  
  // 核销奖品
  usePrize: (prizeId) => callFunction('lottery', { action: 'usePrize', prizeId }),
};

// 验光记录相关接口
const recordsApi = {
  // 获取验光记录
  getExamRecords: () => callFunction('records', { action: 'getExamRecords' }),
  
  // 获取自测记录
  getSelfTestRecords: () => callFunction('records', { action: 'getSelfTestRecords' }),
  
  // 保存自测结果
  saveSelfTest: (result) => callFunction('records', { action: 'saveSelfTest', result }),
  
  // 添加验光记录（店员使用）
  addExamRecord: (customerId, record) => callFunction('records', { action: 'addExamRecord', customerId, record }),
};

// 店员相关接口
const staffApi = {
  // 店员注册
  register: (staffInfo) => callFunction('staff', { action: 'register', staffInfo }),
  
  // 店员登录
  login: (phone, password) => callFunction('staff', { action: 'login', phone, password }),
  
  // 获取店员信息
  getStaffInfo: () => callFunction('staff', { action: 'getStaffInfo' }),
  
  // 搜索客户
  searchCustomer: (phone) => callFunction('staff', { action: 'searchCustomer', phone }),
  
  // 获取月度统计
  getMonthlyStats: () => callFunction('staff', { action: 'getMonthlyStats' }),
  
  // 获取客户列表
  getCustomerList: () => callFunction('staff', { action: 'getCustomerList' }),
  
  // 为客户充值
  rechargeCustomer: (customerId, amount) => callFunction('staff', { action: 'recharge', customerId, amount }),
  
  // 扫码核销
  scanVerify: (qrData) => callFunction('staff', { action: 'scanVerify', qrData }),
  
  // 扣除余额
  deductBalance: (customerId, amount, description) => callFunction('staff', { action: 'deductBalance', customerId, amount, description }),
};

// 管理员相关接口
const adminApi = {
  // 获取待审核店员列表
  getPendingStaff: () => callFunction('admin', { action: 'getPendingStaff' }),
  
  // 审核店员
  approveStaff: (staffId, approved) => callFunction('admin', { action: 'approveStaff', staffId, approved }),
  
  // 获取所有客户
  getAllCustomers: () => callFunction('admin', { action: 'getAllCustomers' }),
  
  // 获取所有验光记录
  getAllExamRecords: () => callFunction('admin', { action: 'getAllExamRecords' }),
};

// 二维码相关接口
const qrcodeApi = {
  // 生成二维码
  generate: (password) => callFunction('qrcode', { action: 'generate', password }),
  
  // 验证二维码
  verify: (qrData) => callFunction('qrcode', { action: 'verify', qrData }),
};

// 支付相关接口
const paymentApi = {
  // 发起充值支付
  recharge: (amount) => callFunction('payment', { action: 'recharge', amount }),
  
  // 查询充值优惠
  getRechargeOffers: () => callFunction('payment', { action: 'getRechargeOffers' }),
};

module.exports = {
  callFunction,
  userApi,
  lotteryApi,
  recordsApi,
  staffApi,
  adminApi,
  qrcodeApi,
  paymentApi
};
