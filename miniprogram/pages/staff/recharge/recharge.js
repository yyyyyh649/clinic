// pages/staff/recharge/recharge.js
const { showToast, isValidPhone, formatPrice } = require('../../../utils/util');

Page({
  data: {
    searchPhone: '',
    customer: null,
    packages: [
      { id: 1, amount: 200, gift: 0, total: 200 },
      { id: 2, amount: 500, gift: 100, total: 600 },
      { id: 3, amount: 1000, gift: 250, total: 1250 },
      { id: 4, amount: 2000, gift: 600, total: 2600 }
    ],
    selectedPackage: -1,
    customAmount: '',
    rechargeAmount: '0.00',
    giftAmount: '0.00',
    totalAmount: '0.00',
    paymentMethod: 'cash',
    remark: ''
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
          const customer = res.result.data.customer;
          this.setData({
            customer: {
              ...customer,
              balance: formatPrice(customer.balance || 0)
            }
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
          const customer = res.result.data.customer;
          this.setData({
            customer: {
              ...customer,
              balance: formatPrice(customer.balance || 0)
            }
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

  // 选择套餐
  selectPackage: function (e) {
    const index = e.currentTarget.dataset.index;
    const pkg = this.data.packages[index];
    
    this.setData({
      selectedPackage: index,
      customAmount: '',
      rechargeAmount: pkg.amount.toFixed(2),
      giftAmount: pkg.gift.toFixed(2),
      totalAmount: pkg.total.toFixed(2)
    });
  },

  // 金额输入
  onAmountInput: function (e) {
    const amount = parseFloat(e.detail.value) || 0;
    const gift = this.calculateGift(amount);
    
    this.setData({
      customAmount: e.detail.value,
      rechargeAmount: amount.toFixed(2),
      giftAmount: gift.toFixed(2),
      totalAmount: (amount + gift).toFixed(2)
    });
  },

  // 金额输入获得焦点
  onAmountFocus: function () {
    this.setData({
      selectedPackage: -1
    });
  },

  // 计算赠送金额
  calculateGift: function (amount) {
    if (amount >= 2000) return 600;
    if (amount >= 1000) return 250;
    if (amount >= 500) return 100;
    return 0;
  },

  // 选择支付方式
  selectPayment: function (e) {
    this.setData({
      paymentMethod: e.currentTarget.dataset.method
    });
  },

  // 备注输入
  onRemarkInput: function (e) {
    this.setData({
      remark: e.detail.value
    });
  },

  // 确认充值
  confirmRecharge: function () {
    const { customer, rechargeAmount, giftAmount, totalAmount, paymentMethod, remark } = this.data;
    
    if (!customer) {
      showToast('请先选择客户');
      return;
    }
    
    const amount = parseFloat(rechargeAmount);
    if (amount <= 0) {
      showToast('请选择或输入充值金额');
      return;
    }
    
    const staffInfo = wx.getStorageSync('staffInfo');
    
    wx.showModal({
      title: '确认充值',
      content: `客户：${customer.name || customer.phone}\n充值：¥${rechargeAmount}\n赠送：¥${giftAmount}\n到账：¥${totalAmount}`,
      success: res => {
        if (res.confirm) {
          this.doRecharge(staffInfo);
        }
      }
    });
  },

  // 执行充值
  doRecharge: function (staffInfo) {
    const { customer, rechargeAmount, giftAmount, totalAmount, paymentMethod, remark } = this.data;
    
    wx.showLoading({ title: '充值中...' });
    
    wx.cloud.callFunction({
      name: 'staff',
      data: {
        action: 'recharge',
        customerId: customer._id,
        rechargeAmount: Math.round(parseFloat(rechargeAmount) * 100),
        giftAmount: Math.round(parseFloat(giftAmount) * 100),
        totalAmount: Math.round(parseFloat(totalAmount) * 100),
        paymentMethod,
        remark,
        staffId: staffInfo._id,
        staffName: staffInfo.name
      },
      success: res => {
        if (res.result.code === 0) {
          wx.showModal({
            title: '充值成功',
            content: `已为客户充值¥${totalAmount}`,
            showCancel: false,
            success: () => {
              wx.navigateBack();
            }
          });
        } else {
          showToast(res.result.message || '充值失败');
        }
      },
      fail: err => {
        console.error('充值失败:', err);
        showToast('充值失败，请重试');
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  }
});
