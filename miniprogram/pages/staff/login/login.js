// pages/staff/login/login.js
const app = getApp();
const { showToast, isValidPhone } = require('../../../utils/util');

Page({
  data: {
    activeTab: 'login',
    phone: '',
    password: '',
    confirmPassword: '',
    name: '',
    staffId: '',
    isLoading: false,
    wechatBound: false,
    wechatUserInfo: null
  },

  onLoad: function () {
    // 检查是否已登录
    const staffInfo = wx.getStorageSync('staffInfo');
    if (staffInfo && staffInfo.isApproved) {
      wx.redirectTo({
        url: '/pages/staff/index/index'
      });
    }
  },

  // 切换标签
  switchTab: function (e) {
    this.setData({
      activeTab: e.currentTarget.dataset.tab,
      phone: '',
      password: '',
      confirmPassword: '',
      name: '',
      staffId: '',
      wechatBound: false,
      wechatUserInfo: null
    });
  },

  // 输入处理
  onPhoneInput: function (e) {
    this.setData({ phone: e.detail.value });
  },

  onPasswordInput: function (e) {
    this.setData({ password: e.detail.value });
  },

  onConfirmPasswordInput: function (e) {
    this.setData({ confirmPassword: e.detail.value });
  },

  onNameInput: function (e) {
    this.setData({ name: e.detail.value });
  },

  onStaffIdInput: function (e) {
    this.setData({ staffId: e.detail.value });
  },

  // 微信登录
  onWechatLogin: function (e) {
    if (e.detail.userInfo) {
      wx.showLoading({ title: '登录中...' });
      
      wx.cloud.callFunction({
        name: 'staff',
        data: {
          action: 'wechatLogin',
          userInfo: e.detail.userInfo
        },
        success: res => {
          if (res.result.code === 0) {
            const staffInfo = res.result.data.staffInfo;
            if (!staffInfo.isApproved) {
              showToast('账号待审核，请联系管理员');
              return;
            }
            
            wx.setStorageSync('staffInfo', staffInfo);
            app.globalData.userRole = staffInfo.role || 'staff';
            showToast('登录成功', 'success');
            
            wx.redirectTo({
              url: '/pages/staff/index/index'
            });
          } else {
            showToast(res.result.message || '微信登录失败');
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
      showToast('请授权登录');
    }
  },

  // 微信绑定（用于注册）
  onWechatBind: function (e) {
    if (e.detail.userInfo) {
      this.setData({
        wechatBound: true,
        wechatUserInfo: e.detail.userInfo
      });
      showToast('微信授权成功', 'success');
    } else {
      showToast('请授权微信');
    }
  },

  // 登录
  handleLogin: function () {
    const { phone, password, isLoading } = this.data;
    
    if (isLoading) return;
    
    if (!isValidPhone(phone)) {
      showToast('请输入正确的手机号');
      return;
    }
    
    if (!password || password.length < 6) {
      showToast('请输入6位以上密码');
      return;
    }

    this.setData({ isLoading: true });
    
    wx.cloud.callFunction({
      name: 'staff',
      data: {
        action: 'login',
        phone,
        password
      },
      success: res => {
        if (res.result.code === 0) {
          const staffInfo = res.result.data.staffInfo;
          if (!staffInfo.isApproved) {
            showToast('账号待审核，请联系管理员');
            return;
          }
          
          wx.setStorageSync('staffInfo', staffInfo);
          app.globalData.userRole = staffInfo.role || 'staff';
          showToast('登录成功', 'success');
          
          wx.redirectTo({
            url: '/pages/staff/index/index'
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

  // 注册
  handleRegister: function () {
    const { phone, password, confirmPassword, name, staffId, isLoading, wechatUserInfo } = this.data;
    
    if (isLoading) return;
    
    if (!name.trim()) {
      showToast('请输入姓名');
      return;
    }
    
    if (!isValidPhone(phone)) {
      showToast('请输入正确的手机号');
      return;
    }
    
    if (!password || password.length < 6) {
      showToast('请设置6位以上密码');
      return;
    }
    
    if (password !== confirmPassword) {
      showToast('两次密码输入不一致');
      return;
    }
    
    if (!staffId.trim()) {
      showToast('请输入员工编号');
      return;
    }

    this.setData({ isLoading: true });
    
    wx.cloud.callFunction({
      name: 'staff',
      data: {
        action: 'register',
        staffInfo: {
          name,
          phone,
          password,
          staffId
        },
        userInfo: wechatUserInfo
      },
      success: res => {
        if (res.result.code === 0) {
          wx.showModal({
            title: '注册成功',
            content: '您的注册申请已提交，请等待管理员审核',
            showCancel: false,
            success: () => {
              this.setData({
                activeTab: 'login',
                password: '',
                confirmPassword: '',
                name: '',
                staffId: '',
                wechatBound: false,
                wechatUserInfo: null
              });
            }
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

  // 返回客户端
  goToCustomerApp: function () {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});
