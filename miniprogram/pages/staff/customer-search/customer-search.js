// pages/staff/customer-search/customer-search.js
const { showToast, isValidPhone, formatPrice, daysBetween } = require('../../../utils/util');

Page({
  data: {
    searchPhone: '',
    searchResult: null,
    showNotFound: false,
    showAll: false,
    customerList: []
  },

  onLoad: function (options) {
    if (options.showAll === 'true') {
      this.setData({ showAll: true });
      this.loadAllCustomers();
    }
  },

  // 搜索输入
  onSearchInput: function (e) {
    this.setData({
      searchPhone: e.detail.value,
      showNotFound: false
    });
  },

  // 清除搜索
  clearSearch: function () {
    this.setData({
      searchPhone: '',
      searchResult: null,
      showNotFound: false
    });
  },

  // 执行搜索
  doSearch: function () {
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
            searchResult: {
              ...customer,
              balance: formatPrice(customer.balance || 0),
              points: customer.points || 0,
              examCount: (customer.examRecords || []).length,
              examRecords: (customer.examRecords || []).map(e => ({
                ...e,
                examDate: this.formatDate(e.examDate)
              }))
            },
            showNotFound: false
          });
        } else {
          this.setData({
            searchResult: null,
            showNotFound: true
          });
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

  // 加载全部客户
  loadAllCustomers: function () {
    wx.cloud.callFunction({
      name: 'staff',
      data: { action: 'getCustomerList' },
      success: res => {
        if (res.result.code === 0) {
          const customers = res.result.data.customers || [];
          const now = new Date();
          
          const processedCustomers = customers.map(c => {
            const lastExamDate = c.lastExamDate ? new Date(c.lastExamDate) : now;
            const daysAgo = daysBetween(lastExamDate, now);
            return { ...c, daysAgo };
          }).sort((a, b) => b.daysAgo - a.daysAgo);
          
          this.setData({ customerList: processedCustomers });
        }
      }
    });
  },

  // 格式化日期
  formatDate: function (dateStr) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  // 查看客户
  viewCustomer: function (e) {
    const customer = e.currentTarget.dataset.customer;
    this.setData({
      searchPhone: customer.phone,
      showAll: false
    });
    this.doSearch();
  },

  // 添加验光
  addExam: function (e) {
    const customerId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/staff/add-exam/add-exam?customerId=${customerId}`
    });
  },

  // 充值
  rechargeCustomer: function (e) {
    const customerId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/staff/recharge/recharge?customerId=${customerId}`
    });
  }
});
