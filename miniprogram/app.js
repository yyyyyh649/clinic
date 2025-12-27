// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'your-env-id', // 替换为你的云开发环境ID
        traceUser: true,
      });
    }

    // 获取用户登录状态
    this.checkLoginStatus();
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false,
    userRole: 'customer', // customer, staff, admin
    openid: null
  },

  // 检查登录状态
  checkLoginStatus: function () {
    const userInfo = wx.getStorageSync('userInfo');
    const openid = wx.getStorageSync('openid');
    if (userInfo && openid) {
      this.globalData.userInfo = userInfo;
      this.globalData.openid = openid;
      this.globalData.isLoggedIn = true;
      this.globalData.userRole = userInfo.role || 'customer';
    }
  },

  // 用户登录
  login: function (callback) {
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        this.globalData.openid = res.result.openid;
        wx.setStorageSync('openid', res.result.openid);
        if (callback) callback(res.result);
      },
      fail: err => {
        console.error('登录失败', err);
      }
    });
  },

  // 保存用户信息
  saveUserInfo: function (userInfo) {
    this.globalData.userInfo = userInfo;
    this.globalData.isLoggedIn = true;
    wx.setStorageSync('userInfo', userInfo);
  },

  // 退出登录
  logout: function () {
    this.globalData.userInfo = null;
    this.globalData.isLoggedIn = false;
    this.globalData.openid = null;
    this.globalData.userRole = 'customer';
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('openid');
  }
});
