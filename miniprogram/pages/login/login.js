// pages/login/login.js
const app = getApp();
const { userApi } = require('../../utils/api');
const { showToast, isValidPhone } = require('../../utils/util');

Page({
  data: {
    phone: '',
    code: '',
    countdown: 0,
    isLoading: false
  },

  onLoad: function () {
    // 如果已登录，直接跳转首页
    if (app.globalData.isLoggedIn) {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  },

  // 手机号输入
  onPhoneInput: function (e) {
    this.setData({
      phone: e.detail.value
    });
  },

  // 验证码输入
  onCodeInput: function (e) {
    this.setData({
      code: e.detail.value
    });
  },

  // 发送验证码
  sendCode: function () {
    const { phone } = this.data;
    
    if (!isValidPhone(phone)) {
      showToast('请输入正确的手机号');
      return;
    }

    // 模拟发送验证码
    showToast('验证码已发送', 'success');
    
    // 开始倒计时
    this.setData({ countdown: 60 });
    const timer = setInterval(() => {
      if (this.data.countdown <= 1) {
        clearInterval(timer);
        this.setData({ countdown: 0 });
      } else {
        this.setData({ countdown: this.data.countdown - 1 });
      }
    }, 1000);
  },

  // 手机号登录
  handleLogin: function () {
    const { phone, code, isLoading } = this.data;
    
    if (isLoading) return;
    
    if (!isValidPhone(phone)) {
      showToast('请输入正确的手机号');
      return;
    }
    
    if (!code || code.length !== 6) {
      showToast('请输入6位验证码');
      return;
    }

    this.setData({ isLoading: true });
    
    // 调用登录接口
    wx.cloud.callFunction({
      name: 'login',
      data: {
        action: 'phoneLogin',
        phone: phone,
        code: code
      },
      success: res => {
        if (res.result.code === 0) {
          app.saveUserInfo(res.result.data.userInfo);
          showToast('登录成功', 'success');
          wx.switchTab({
            url: '/pages/index/index'
          });
        } else {
          showToast(res.result.message || '登录失败');
        }
      },
      fail: err => {
        console.error('登录失败:', err);
        showToast('登录失败，请重试');
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 微信授权登录
  onGetUserInfo: function (e) {
    if (e.detail.userInfo) {
      wx.showLoading({ title: '登录中...' });
      
      app.login(result => {
        if (result.openid) {
          // 更新用户信息
          wx.cloud.callFunction({
            name: 'login',
            data: {
              action: 'wechatLogin',
              userInfo: e.detail.userInfo
            },
            success: res => {
              if (res.result.code === 0) {
                app.saveUserInfo(res.result.data.userInfo);
                showToast('登录成功', 'success');
                wx.switchTab({
                  url: '/pages/index/index'
                });
              } else {
                showToast(res.result.message || '登录失败');
              }
            },
            fail: err => {
              console.error('微信登录失败:', err);
              showToast('登录失败，请重试');
            },
            complete: () => {
              wx.hideLoading();
            }
          });
        }
      });
    } else {
      showToast('请授权登录');
    }
  },

  // 查看用户协议
  viewAgreement: function () {
    wx.showModal({
      title: '用户服务协议',
      content: '欢迎使用明亮眼镜店小程序服务...',
      showCancel: false
    });
  }
});
