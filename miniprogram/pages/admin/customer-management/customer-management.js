// pages/admin/customer-management/customer-management.js
const { formatPrice } = require('../../../utils/util');

Page({
  data: {
    isLoading: true,
    searchKeyword: '',
    customers: [],
    allCustomers: [],
    totalCustomers: 0,
    totalBalance: '0.00',
    showDetail: false,
    currentCustomer: null
  },

  onLoad: function () {
    this.loadCustomers();
  },

  // 加载客户列表
  loadCustomers: function () {
    this.setData({ isLoading: true });
    
    wx.cloud.callFunction({
      name: 'admin',
      data: { action: 'getAllCustomers' },
      success: res => {
        if (res.result.code === 0) {
          const customers = res.result.data.customers || [];
          let totalBalance = 0;
          
          const processedCustomers = customers.map(c => {
            const balance = c.balance || 0;
            totalBalance += balance;
            return {
              ...c,
              balance: formatPrice(balance),
              examCount: (c.examRecords || []).length
            };
          });
          
          this.setData({
            customers: processedCustomers,
            allCustomers: processedCustomers,
            totalCustomers: customers.length,
            totalBalance: formatPrice(totalBalance)
          });
        }
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 搜索输入
  onSearchInput: function (e) {
    const keyword = e.detail.value.toLowerCase();
    this.setData({ searchKeyword: keyword });
    
    if (!keyword) {
      this.setData({ customers: this.data.allCustomers });
      return;
    }
    
    const filtered = this.data.allCustomers.filter(c => {
      return (c.name && c.name.toLowerCase().includes(keyword)) ||
             (c.phone && c.phone.includes(keyword));
    });
    
    this.setData({ customers: filtered });
  },

  // 执行搜索
  doSearch: function () {
    // 搜索已在 onSearchInput 中实时处理
  },

  // 查看客户详情
  viewCustomerDetail: function (e) {
    const customer = e.currentTarget.dataset.customer;
    
    // 获取最近验光记录
    let latestExam = null;
    if (customer.examRecords && customer.examRecords.length > 0) {
      const sorted = [...customer.examRecords].sort((a, b) => 
        new Date(b.examDate) - new Date(a.examDate)
      );
      const latest = sorted[0];
      latestExam = {
        date: this.formatDate(latest.examDate),
        rightEye: latest.rightEye ? latest.rightEye.sphere : '--',
        leftEye: latest.leftEye ? latest.leftEye.sphere : '--'
      };
    }
    
    this.setData({
      showDetail: true,
      currentCustomer: {
        ...customer,
        points: customer.points || 0,
        registerTime: this.formatDate(customer.createdAt),
        latestExam
      }
    });
  },

  // 关闭详情
  closeDetail: function () {
    this.setData({
      showDetail: false,
      currentCustomer: null
    });
  },

  // 格式化日期
  formatDate: function (dateStr) {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
});
