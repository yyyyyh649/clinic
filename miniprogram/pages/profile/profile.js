// pages/profile/profile.js
const app = getApp();
const { formatPrice, showToast, showConfirm } = require('../../utils/util');

Page({
  data: {
    userInfo: null,
    points: 0,
    balance: '0.00',
    prizeCount: 0,
    memberLevel: '普通会员',
    rechargeOffers: [
      { id: 1, text: '充500送100' },
      { id: 2, text: '充1000送250' }
    ]
  },

  onLoad: function () {
    this.initUserInfo();
  },

  onShow: function () {
    if (app.globalData.isLoggedIn) {
      this.loadUserData();
    }
  },

  // 初始化用户信息
  initUserInfo: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      });
    }
  },

  // 加载用户数据
  loadUserData: function () {
    wx.cloud.callFunction({
      name: 'login',
      data: { action: 'getUserInfo' },
      success: res => {
        if (res.result.code === 0) {
          const userData = res.result.data;
          this.setData({
            userInfo: { ...this.data.userInfo, ...userData },
            points: userData.points || 0,
            balance: formatPrice(userData.balance || 0),
            memberLevel: userData.memberLevel || '普通会员'
          });
          app.saveUserInfo(this.data.userInfo);
        }
      }
    });

    // 获取奖品数量
    wx.cloud.callFunction({
      name: 'lottery',
      data: { action: 'getMyPrizes' },
      success: res => {
        if (res.result.code === 0) {
          const prizes = res.result.data.prizes || [];
          const validPrizes = prizes.filter(p => !p.isUsed && new Date(p.expireAt) > new Date());
          this.setData({
            prizeCount: validPrizes.length
          });
        }
      }
    });
  },

  // 跳转登录
  goToLogin: function () {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 编辑资料
  editProfile: function () {
    wx.showModal({
      title: '编辑资料',
      content: '资料编辑功能开发中...',
      showCancel: false
    });
  },

  // 显示余额详情
  showBalanceDetail: function () {
    wx.showModal({
      title: '余额说明',
      content: `当前可用余额：¥${this.data.balance}\n\n余额可在店内消费时抵扣，请出示付款码给店员扫描使用。`,
      showCancel: false
    });
  },

  // 显示奖品列表
  showPrizes: function () {
    wx.navigateTo({
      url: '/pages/lottery/lottery'
    });
  },

  // 显示付款二维码
  showQRCode: function () {
    if (!app.globalData.isLoggedIn) {
      showToast('请先登录');
      return;
    }
    wx.navigateTo({
      url: '/pages/qrcode/qrcode'
    });
  },

  // 跳转充值页面
  goToRecharge: function () {
    // 暂时显示充值信息
    wx.showModal({
      title: '会员充值',
      content: '充值功能开发中...\n\n当前优惠：\n• 充500送100\n• 充1000送250\n\n请联系店员进行充值',
      showCancel: false
    });
  },

  // 跳转到档案
  goToRecords: function () {
    wx.switchTab({
      url: '/pages/records/records'
    });
  },

  // 跳转到抽奖
  goToLottery: function () {
    wx.navigateTo({
      url: '/pages/lottery/lottery'
    });
  },

  // 跳转到视力测试
  goToVisionTest: function () {
    wx.navigateTo({
      url: '/pages/vision-test/vision-test'
    });
  },

  // 联系客服
  contactService: function () {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-888-8888\n营业时间：9:00-21:00',
      confirmText: '拨打电话',
      success: res => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '4008888888',
            fail: () => {}
          });
        }
      }
    });
  },

  // 关于我们
  showAbout: function () {
    wx.showModal({
      title: '关于明亮眼镜店',
      content: '明亮眼镜店\n专业验光 · 贴心服务\n\n地址：XX市XX区XX路XX号\n电话：400-888-8888\n\n感谢您的信任与支持！',
      showCancel: false
    });
  },

  // 跳转店员登录
  goToStaffLogin: function () {
    wx.navigateTo({
      url: '/pages/staff/login/login'
    });
  },

  // 退出登录
  handleLogout: async function () {
    const confirmed = await showConfirm('确定要退出登录吗？');
    if (confirmed) {
      app.logout();
      this.setData({
        userInfo: null,
        points: 0,
        balance: '0.00',
        prizeCount: 0
      });
      showToast('已退出登录', 'success');
    }
  }
});
