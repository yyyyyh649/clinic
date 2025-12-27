// pages/staff/add-exam/add-exam.js
const { showToast, isValidPhone, formatPrice } = require('../../../utils/util');

Page({
  data: {
    searchPhone: '',
    customer: null,
    examData: {
      rightEye: {
        sphere: '',
        cylinder: '',
        axis: '',
        va: ''
      },
      leftEye: {
        sphere: '',
        cylinder: '',
        axis: '',
        va: ''
      },
      pd: '',
      add: '',
      note: ''
    }
  },

  onLoad: function (options) {
    if (options.customerId) {
      this.loadCustomer(options.customerId);
    }
  },

  // 加载客户信息
  loadCustomer: function (customerId) {
    wx.showLoading({ title: '加载中...' });
    
    wx.cloud.callFunction({
      name: 'staff',
      data: {
        action: 'getCustomerById',
        customerId
      },
      success: res => {
        if (res.result.code === 0) {
          this.setData({
            customer: res.result.data.customer
          });
        } else {
          showToast('加载客户信息失败');
        }
      },
      fail: err => {
        console.error('加载失败:', err);
        showToast('加载失败，请重试');
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 手机号输入
  onPhoneInput: function (e) {
    this.setData({
      searchPhone: e.detail.value
    });
  },

  // 搜索客户
  searchCustomer: function () {
    const { searchPhone } = this.data;
    
    if (!isValidPhone(searchPhone)) {
      showToast('请输入正确的手机号');
      return;
    }
    
    wx.showLoading({ title: '搜索中...' });
    
    wx.cloud.callFunction({
      name: 'staff',
      data: {
        action: 'searchCustomer',
        phone: searchPhone
      },
      success: res => {
        if (res.result.code === 0 && res.result.data.customer) {
          this.setData({
            customer: res.result.data.customer
          });
        } else {
          showToast('未找到该客户');
        }
      },
      fail: err => {
        console.error('搜索失败:', err);
        showToast('搜索失败，请重试');
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 右眼输入
  onRightSphereInput: function (e) {
    this.setData({ 'examData.rightEye.sphere': e.detail.value });
  },
  onRightCylinderInput: function (e) {
    this.setData({ 'examData.rightEye.cylinder': e.detail.value });
  },
  onRightAxisInput: function (e) {
    this.setData({ 'examData.rightEye.axis': e.detail.value });
  },
  onRightVAInput: function (e) {
    this.setData({ 'examData.rightEye.va': e.detail.value });
  },

  // 左眼输入
  onLeftSphereInput: function (e) {
    this.setData({ 'examData.leftEye.sphere': e.detail.value });
  },
  onLeftCylinderInput: function (e) {
    this.setData({ 'examData.leftEye.cylinder': e.detail.value });
  },
  onLeftAxisInput: function (e) {
    this.setData({ 'examData.leftEye.axis': e.detail.value });
  },
  onLeftVAInput: function (e) {
    this.setData({ 'examData.leftEye.va': e.detail.value });
  },

  // 其他输入
  onPDInput: function (e) {
    this.setData({ 'examData.pd': e.detail.value });
  },
  onAddInput: function (e) {
    this.setData({ 'examData.add': e.detail.value });
  },
  onNoteInput: function (e) {
    this.setData({ 'examData.note': e.detail.value });
  },

  // 提交验光记录
  submitExam: function () {
    const { customer, examData } = this.data;
    
    if (!customer) {
      showToast('请先选择客户');
      return;
    }
    
    // 验证必填字段
    if (!examData.rightEye.sphere || !examData.leftEye.sphere) {
      showToast('请填写球镜数据');
      return;
    }
    
    if (!examData.pd) {
      showToast('请填写瞳距');
      return;
    }
    
    const staffInfo = wx.getStorageSync('staffInfo');
    
    wx.showLoading({ title: '保存中...' });
    
    wx.cloud.callFunction({
      name: 'records',
      data: {
        action: 'addExamRecord',
        customerId: customer._id,
        record: {
          ...examData,
          optometrist: staffInfo.name,
          optometristId: staffInfo._id,
          examDate: new Date().toISOString()
        }
      },
      success: res => {
        if (res.result.code === 0) {
          wx.showModal({
            title: '保存成功',
            content: '验光记录已保存',
            showCancel: false,
            success: () => {
              wx.navigateBack();
            }
          });
        } else {
          showToast(res.result.message || '保存失败');
        }
      },
      fail: err => {
        console.error('保存失败:', err);
        showToast('保存失败，请重试');
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  }
});
