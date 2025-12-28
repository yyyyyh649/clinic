// pages/login/login.js
const app = getApp();
const { userApi } = require('../../utils/api');
const { showToast, isValidPhone } = require('../../utils/util');

Page({
  data: {
    phone: '',
    showPhoneInput: false,
    isLoading: false,
    pendingUserInfo: null
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

  // 提交手机号完成注册
  submitPhone: function () {
    const { phone, isLoading, pendingUserInfo } = this.data;
    
    if (isLoading) return;
    
    if (!isValidPhone(phone)) {
      showToast('请输入正确的手机号');
      return;
    }

    this.setData({ isLoading: true });
    
    // 绑定手机号到微信账号
    wx.cloud.callFunction({
      name: 'login',
      data: {
        action: 'bindPhone',
        phone: phone,
        userInfo: pendingUserInfo
      },
      success: res => {
        if (res.result.code === 0) {
          app.saveUserInfo(res.result.data.userInfo);
          showToast('注册成功', 'success');
          wx.switchTab({
            url: '/pages/index/index'
          });
        } else {
          showToast(res.result.message || '注册失败');
        }
      },
      fail: err => {
        console.error('注册失败:', err);
        showToast('注册失败，请重试');
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 微信授权登录
  onGetUserInfo: function () {
    wx.showLoading({ title: '登录中...' });
    
    // 使用 wx.getUserProfile 替代已废弃的 open-type="getUserInfo"
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (profileRes) => {
        const userInfo = profileRes.userInfo;
        
        app.login(result => {
          if (result.openid) {
            // 微信登录
            wx.cloud.callFunction({
              name: 'login',
              data: {
                action: 'wechatLogin',
                userInfo: userInfo
              },
              success: res => {
                if (res.result.code === 0) {
                  const userData = res.result.data;
                  if (userData.needPhone) {
                    // 新用户需要填写手机号
                    this.setData({
                      showPhoneInput: true,
                      pendingUserInfo: userInfo
                    });
                    showToast('请填写手机号完成注册');
                  } else {
                    // 已有手机号，直接登录
                    app.saveUserInfo(userData.userInfo);
                    showToast('登录成功', 'success');
                    wx.switchTab({
                      url: '/pages/index/index'
                    });
                  }
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
          } else {
            wx.hideLoading();
            showToast('获取微信信息失败');
          }
        });
      },
      fail: () => {
        wx.hideLoading();
        showToast('请授权登录');
      }
    });
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
