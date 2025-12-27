// pages/staff/index/index.js
const { showToast, showConfirm, daysBetween } = require('../../../utils/util');

Page({
  data: {
    staffInfo: {},
    currentMonth: '',
    monthlyStats: {
      totalRevenue: '0.00',
      totalRecharge: '0.00',
      customerCount: 0,
      examCount: 0
    },
    todayStats: {
      examCount: 0,
      verifyCount: 0,
      rechargeAmount: '0.00',
      consumeAmount: '0.00'
    },
    followUpCustomers: []
  },

  onLoad: function () {
    this.initStaffInfo();
    this.setCurrentMonth();
  },

  onShow: function () {
    this.loadMonthlyStats();
    this.loadTodayStats();
    this.loadFollowUpCustomers();
  },

  // 初始化店员信息
  initStaffInfo: function () {
    const staffInfo = wx.getStorageSync('staffInfo');
    if (!staffInfo) {
      wx.redirectTo({
        url: '/pages/staff/login/login'
      });
      return;
    }
    this.setData({ staffInfo });
  },

  // 设置当前月份
  setCurrentMonth: function () {
    const now = new Date();
    const month = now.getMonth() + 1;
    this.setData({
      currentMonth: `${now.getFullYear()}年${month}月`
    });
  },

  // 加载月度统计
  loadMonthlyStats: function () {
    wx.cloud.callFunction({
      name: 'staff',
      data: { action: 'getMonthlyStats' },
      success: res => {
        if (res.result.code === 0) {
          const stats = res.result.data;
          this.setData({
            monthlyStats: {
              totalRevenue: (stats.totalRevenue / 100).toFixed(2),
              totalRecharge: (stats.totalRecharge / 100).toFixed(2),
              customerCount: stats.customerCount || 0,
              examCount: stats.examCount || 0
            }
          });
        }
      }
    });
  },

  // 加载今日统计
  loadTodayStats: function () {
    wx.cloud.callFunction({
      name: 'staff',
      data: { action: 'getTodayStats' },
      success: res => {
        if (res.result.code === 0) {
          const stats = res.result.data;
          this.setData({
            todayStats: {
              examCount: stats.examCount || 0,
              verifyCount: stats.verifyCount || 0,
              rechargeAmount: ((stats.rechargeAmount || 0) / 100).toFixed(2),
              consumeAmount: ((stats.consumeAmount || 0) / 100).toFixed(2)
            }
          });
        }
      }
    });
  },

  // 加载待跟进客户
  loadFollowUpCustomers: function () {
    wx.cloud.callFunction({
      name: 'staff',
      data: { action: 'getFollowUpCustomers' },
      success: res => {
        if (res.result.code === 0) {
          const customers = res.result.data.customers || [];
          const now = new Date();
          
          // 计算距今天数并排序
          const processedCustomers = customers.map(c => {
            const lastExamDate = new Date(c.lastExamDate);
            const daysAgo = daysBetween(lastExamDate, now);
            return { ...c, daysAgo };
          }).sort((a, b) => b.daysAgo - a.daysAgo); // 按天数降序
          
          this.setData({
            followUpCustomers: processedCustomers.slice(0, 5) // 只显示前5个
          });
        }
      }
    });
  },

  // 显示营业额明细
  showRevenueDetail: function () {
    wx.showModal({
      title: '营业额明细',
      content: '明细页面开发中...',
      showCancel: false
    });
  },

  // 显示充值明细
  showRechargeDetail: function () {
    wx.showModal({
      title: '充值明细',
      content: '明细页面开发中...',
      showCancel: false
    });
  },

  // 跳转扫码
  goToScanner: function () {
    wx.navigateTo({
      url: '/pages/staff/scanner/scanner'
    });
  },

  // 跳转客户搜索
  goToCustomerSearch: function () {
    wx.navigateTo({
      url: '/pages/staff/customer-search/customer-search'
    });
  },

  // 跳转添加验光
  goToAddExam: function () {
    wx.navigateTo({
      url: '/pages/staff/add-exam/add-exam'
    });
  },

  // 跳转充值
  goToRecharge: function () {
    wx.navigateTo({
      url: '/pages/staff/recharge/recharge'
    });
  },

  // 跳转管理后台
  goToAdminPanel: function () {
    wx.navigateTo({
      url: '/pages/admin/index/index'
    });
  },

  // 查看所有客户
  viewAllCustomers: function () {
    wx.navigateTo({
      url: '/pages/staff/customer-search/customer-search?showAll=true'
    });
  },

  // 查看客户详情
  viewCustomerDetail: function (e) {
    const customerId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/staff/add-exam/add-exam?customerId=${customerId}`
    });
  },

  // 联系客户
  contactCustomer: function (e) {
    const phone = e.currentTarget.dataset.phone;
    wx.showActionSheet({
      itemList: ['拨打电话', '复制手机号'],
      success: res => {
        if (res.tapIndex === 0) {
          wx.makePhoneCall({ phoneNumber: phone, fail: () => {} });
        } else if (res.tapIndex === 1) {
          wx.setClipboardData({
            data: phone,
            success: () => showToast('已复制手机号', 'success')
          });
        }
      }
    });
  },

  // 退出登录
  handleLogout: async function () {
    const confirmed = await showConfirm('确定要退出登录吗？');
    if (confirmed) {
      wx.removeStorageSync('staffInfo');
      showToast('已退出登录', 'success');
      wx.redirectTo({
        url: '/pages/staff/login/login'
      });
    }
  }
});
