// pages/qrcode/qrcode.js
const app = getApp();
const { showToast, formatPrice, randomString } = require('../../utils/util');

Page({
  data: {
    isUnlocked: false,
    password: '',
    hasSetPassword: true, // 假设已设置密码
    isGenerating: false,
    qrcodeData: '',
    refreshCountdown: 300, // 5分钟 = 300秒
    userInfo: null,
    balance: '0.00',
    availablePrizes: []
  },

  refreshTimer: null,
  countdownTimer: null,

  onLoad: function () {
    this.setData({
      userInfo: app.globalData.userInfo
    });
    this.loadUserData();
    this.loadAvailablePrizes();
  },

  onUnload: function () {
    this.clearTimers();
  },

  onHide: function () {
    // 页面隐藏时锁定二维码
    this.lockQRCode();
  },

  // 清除定时器
  clearTimers: function () {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  },

  // 加载用户数据
  loadUserData: function () {
    wx.cloud.callFunction({
      name: 'login',
      data: { action: 'getUserInfo' },
      success: res => {
        if (res.result.code === 0) {
          this.setData({
            balance: formatPrice(res.result.data.balance || 0),
            hasSetPassword: res.result.data.hasPaymentPassword || false
          });
        }
      }
    });
  },

  // 加载可用奖品
  loadAvailablePrizes: function () {
    wx.cloud.callFunction({
      name: 'lottery',
      data: { action: 'getMyPrizes' },
      success: res => {
        if (res.result.code === 0) {
          const prizes = res.result.data.prizes || [];
          const now = new Date();
          const validPrizes = prizes.filter(p => {
            return !p.isUsed && new Date(p.expireAt) > now;
          }).map(p => {
            const expireDate = new Date(p.expireAt);
            const diffDays = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));
            return { ...p, expireDays: diffDays };
          });
          
          this.setData({
            availablePrizes: validPrizes
          });
        }
      }
    });
  },

  // 密码输入
  onPasswordInput: function (e) {
    const password = e.detail.value;
    this.setData({ password });
    
    if (password.length === 6) {
      this.verifyPassword(password);
    }
  },

  // 验证密码
  verifyPassword: function (password) {
    wx.showLoading({ title: '验证中...' });
    
    wx.cloud.callFunction({
      name: 'qrcode',
      data: {
        action: 'verifyPassword',
        password: password
      },
      success: res => {
        if (res.result.code === 0) {
          this.setData({
            isUnlocked: true,
            password: ''
          });
          this.generateQRCode();
          this.startRefreshTimer();
        } else {
          showToast('密码错误');
          this.setData({ password: '' });
        }
      },
      fail: err => {
        console.error('验证失败:', err);
        showToast('验证失败，请重试');
        this.setData({ password: '' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 生成二维码
  generateQRCode: function () {
    this.setData({ isGenerating: true });
    
    wx.cloud.callFunction({
      name: 'qrcode',
      data: { action: 'generate' },
      success: res => {
        if (res.result.code === 0) {
          const qrcodeData = res.result.data.qrcodeData;
          this.setData({ qrcodeData });
          this.drawQRCode(qrcodeData);
        } else {
          showToast('生成二维码失败');
        }
      },
      fail: err => {
        console.error('生成二维码失败:', err);
        showToast('生成失败，请重试');
      },
      complete: () => {
        this.setData({ isGenerating: false });
      }
    });
  },

  // 绘制二维码
  drawQRCode: function (data) {
    const ctx = wx.createCanvasContext('qrcode');
    const size = 200;
    const moduleCount = 25;
    const moduleSize = size / moduleCount;
    
    // 简单的二维码绘制（实际项目中建议使用专业的二维码库）
    ctx.setFillStyle('#ffffff');
    ctx.fillRect(0, 0, size, size);
    
    // 绘制二维码模块（这里是简化版，实际需要真正的QR编码）
    ctx.setFillStyle('#333333');
    
    // 模拟二维码图案
    for (let i = 0; i < moduleCount; i++) {
      for (let j = 0; j < moduleCount; j++) {
        // 定位图案
        if ((i < 7 && j < 7) || (i < 7 && j >= moduleCount - 7) || (i >= moduleCount - 7 && j < 7)) {
          if ((i === 0 || i === 6 || j === 0 || j === 6 || j === moduleCount - 1 || j === moduleCount - 7 ||
              i === moduleCount - 1 || i === moduleCount - 7) ||
              (i >= 2 && i <= 4 && j >= 2 && j <= 4) ||
              (i >= 2 && i <= 4 && j >= moduleCount - 5 && j <= moduleCount - 3) ||
              (i >= moduleCount - 5 && i <= moduleCount - 3 && j >= 2 && j <= 4)) {
            ctx.fillRect(j * moduleSize, i * moduleSize, moduleSize, moduleSize);
          }
        } else {
          // 随机数据区域
          if (Math.random() > 0.5) {
            ctx.fillRect(j * moduleSize, i * moduleSize, moduleSize, moduleSize);
          }
        }
      }
    }
    
    ctx.draw();
  },

  // 开始刷新定时器
  startRefreshTimer: function () {
    this.setData({ refreshCountdown: 300 });
    
    // 倒计时
    this.countdownTimer = setInterval(() => {
      if (this.data.refreshCountdown <= 1) {
        this.generateQRCode();
        this.setData({ refreshCountdown: 300 });
      } else {
        this.setData({
          refreshCountdown: this.data.refreshCountdown - 1
        });
      }
    }, 1000);
  },

  // 忘记密码
  forgotPassword: function () {
    wx.showModal({
      title: '忘记密码',
      content: '请联系店员重置您的支付密码',
      showCancel: false
    });
  },

  // 设置密码
  setPassword: function () {
    wx.showModal({
      title: '设置支付密码',
      content: '支付密码设置功能开发中...',
      showCancel: false
    });
  },

  // 锁定二维码
  lockQRCode: function () {
    this.clearTimers();
    this.setData({
      isUnlocked: false,
      password: '',
      qrcodeData: ''
    });
  }
});
