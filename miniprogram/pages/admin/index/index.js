// pages/admin/index/index.js
const { showToast, formatPrice } = require('../../../utils/util');

Page({
  data: {
    stats: {
      totalCustomers: 0,
      totalStaff: 0,
      totalBalance: '0.00',
      todayExams: 0
    },
    pendingCount: 0
  },

  onLoad: function () {
    this.checkAdminAccess();
  },

  onShow: function () {
    this.loadStats();
    this.loadPendingCount();
  },

  // 检查管理员权限
  checkAdminAccess: function () {
    const staffInfo = wx.getStorageSync('staffInfo');
    if (!staffInfo || staffInfo.role !== 'admin') {
      showToast('无权访问');
      wx.navigateBack();
    }
  },

  // 加载统计数据
  loadStats: function () {
    wx.cloud.callFunction({
      name: 'admin',
      data: { action: 'getStats' },
      success: res => {
        if (res.result.code === 0) {
          const data = res.result.data;
          this.setData({
            stats: {
              totalCustomers: data.totalCustomers || 0,
              totalStaff: data.totalStaff || 0,
              totalBalance: formatPrice(data.totalBalance || 0),
              todayExams: data.todayExams || 0
            }
          });
        }
      }
    });
  },

  // 加载待审核数量
  loadPendingCount: function () {
    wx.cloud.callFunction({
      name: 'admin',
      data: { action: 'getPendingStaffCount' },
      success: res => {
        if (res.result.code === 0) {
          this.setData({
            pendingCount: res.result.data.count || 0
          });
        }
      }
    });
  },

  // 跳转店员审核
  goToStaffApproval: function () {
    wx.navigateTo({
      url: '/pages/admin/staff-approval/staff-approval'
    });
  },

  // 查看全部店员
  viewAllStaff: function () {
    wx.showModal({
      title: '全部店员',
      content: '功能开发中...',
      showCancel: false
    });
  },

  // 跳转客户管理
  goToCustomerManagement: function () {
    wx.navigateTo({
      url: '/pages/admin/customer-management/customer-management'
    });
  },

  // 查看所有验光记录
  viewAllExams: function () {
    wx.showModal({
      title: '验光记录',
      content: '功能开发中...',
      showCancel: false
    });
  },

  // 余额报表
  viewBalanceReport: function () {
    wx.showModal({
      title: '余额报表',
      content: '功能开发中...',
      showCancel: false
    });
  },

  // 奖品管理
  managePrizes: function () {
    wx.showModal({
      title: '奖品管理',
      content: '功能开发中...',
      showCancel: false
    });
  },

  // 充值优惠管理
  manageRechargeOffers: function () {
    wx.showModal({
      title: '充值优惠',
      content: '功能开发中...',
      showCancel: false
    });
  },

  // 返回店员端
  goBackToStaff: function () {
    wx.navigateBack();
  }
});
