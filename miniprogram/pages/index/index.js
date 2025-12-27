// pages/index/index.js
const app = getApp();
const { lotteryApi, userApi } = require('../../utils/api');
const { formatPrice } = require('../../utils/util');

Page({
  data: {
    userInfo: null,
    points: 0,
    balance: '0.00',
    hasDrawnToday: false,
    myPrizes: [],
    articles: [
      {
        id: 1,
        title: '🎉 新年特惠活动',
        summary: '充值满500送100，满1000送250！活动时间有限，先到先得！',
        coverUrl: '/images/article1.png',
        date: '2024-01-15'
      },
      {
        id: 2,
        title: '👓 新款镜框到店',
        summary: '多款时尚镜框新鲜上架，轻盈舒适，总有一款适合您！',
        coverUrl: '/images/article2.png',
        date: '2024-01-10'
      },
      {
        id: 3,
        title: '📢 免费视力检查月',
        summary: '本月到店即可享受免费专业视力检查，快来预约吧！',
        coverUrl: '/images/article3.png',
        date: '2024-01-05'
      }
    ]
  },

  onLoad: function () {
    this.initUserInfo();
  },

  onShow: function () {
    // 每次显示页面时刷新数据
    if (app.globalData.isLoggedIn) {
      this.loadUserData();
      this.checkTodayLottery();
      this.loadMyPrizes();
    }
  },

  // 初始化用户信息
  initUserInfo: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      });
      this.loadUserData();
    }
  },

  // 加载用户数据
  loadUserData: function () {
    // 获取积分
    wx.cloud.callFunction({
      name: 'login',
      data: { action: 'getUserInfo' },
      success: res => {
        if (res.result.code === 0) {
          const userData = res.result.data;
          this.setData({
            points: userData.points || 0,
            balance: formatPrice(userData.balance || 0),
            userInfo: { ...this.data.userInfo, ...userData }
          });
        }
      }
    });
  },

  // 检查今日是否已抽奖
  checkTodayLottery: function () {
    wx.cloud.callFunction({
      name: 'lottery',
      data: { action: 'checkToday' },
      success: res => {
        if (res.result.code === 0) {
          this.setData({
            hasDrawnToday: res.result.data.hasDrawn
          });
        }
      }
    });
  },

  // 加载我的奖品
  loadMyPrizes: function () {
    wx.cloud.callFunction({
      name: 'lottery',
      data: { action: 'getMyPrizes' },
      success: res => {
        if (res.result.code === 0) {
          const prizes = res.result.data.prizes || [];
          // 计算剩余天数
          const now = new Date();
          const processedPrizes = prizes.map(p => {
            const expireDate = new Date(p.expireAt);
            const diffTime = expireDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return {
              ...p,
              expireDays: Math.max(0, diffDays)
            };
          }).filter(p => p.expireDays > 0);
          
          this.setData({
            myPrizes: processedPrizes.slice(0, 5) // 只显示前5个
          });
        }
      }
    });
  },

  // 跳转到登录页
  goToLogin: function () {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 跳转到视力测试
  goToVisionTest: function () {
    if (!app.globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/vision-test/vision-test'
    });
  },

  // 跳转到抽奖
  goToLottery: function () {
    if (!app.globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/lottery/lottery'
    });
  },

  // 跳转到个人中心
  goToProfile: function () {
    wx.switchTab({
      url: '/pages/profile/profile'
    });
  },

  // 查看文章
  viewArticle: function (e) {
    const articleId = e.currentTarget.dataset.id;
    wx.showToast({
      title: '文章详情开发中',
      icon: 'none'
    });
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.loadUserData();
    this.checkTodayLottery();
    this.loadMyPrizes();
    wx.stopPullDownRefresh();
  }
});
