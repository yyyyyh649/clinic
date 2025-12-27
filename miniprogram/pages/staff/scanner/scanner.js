// pages/staff/scanner/scanner.js
const { showToast, formatPrice } = require('../../../utils/util');

Page({
  data: {
    showCamera: false,
    scanResult: null,
    deductAmount: '',
    remark: '',
    recentRecords: []
  },

  onLoad: function () {
    this.checkCameraAuth();
    this.loadRecentRecords();
  },

  // 检查相机权限
  checkCameraAuth: function () {
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.camera']) {
          this.setData({ showCamera: true });
        }
      }
    });
  },

  // 请求相机权限
  requestCameraAuth: function () {
    wx.authorize({
      scope: 'scope.camera',
      success: () => {
        this.setData({ showCamera: true });
      },
      fail: () => {
        wx.openSetting({
          success: res => {
            if (res.authSetting['scope.camera']) {
              this.setData({ showCamera: true });
            }
          }
        });
      }
    });
  },

  // 相机错误处理
  onCameraError: function (e) {
    console.error('相机错误:', e);
    this.setData({ showCamera: false });
  },

  // 开始扫码
  startScan: function () {
    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['qrCode'],
      success: res => {
        this.handleScanResult(res.result);
      },
      fail: err => {
        console.error('扫码失败:', err);
        if (err.errMsg.indexOf('cancel') === -1) {
          showToast('扫码失败，请重试');
        }
      }
    });
  },

  // 处理扫码结果
  handleScanResult: function (qrData) {
    wx.showLoading({ title: '验证中...' });
    
    wx.cloud.callFunction({
      name: 'staff',
      data: {
        action: 'scanVerify',
        qrData
      },
      success: res => {
        if (res.result.code === 0) {
          const data = res.result.data;
          this.setData({
            scanResult: {
              customerId: data.customerId,
              customerName: data.customerName,
              phone: data.phone,
              balance: formatPrice(data.balance || 0),
              prizes: (data.prizes || []).map(p => ({ ...p, selected: false }))
            },
            deductAmount: '',
            remark: ''
          });
        } else {
          showToast(res.result.message || '二维码无效');
        }
      },
      fail: err => {
        console.error('验证失败:', err);
        showToast('验证失败，请重试');
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 选择/取消选择奖品
  togglePrize: function (e) {
    const index = e.currentTarget.dataset.index;
    const prizes = this.data.scanResult.prizes;
    prizes[index].selected = !prizes[index].selected;
    this.setData({
      'scanResult.prizes': prizes
    });
  },

  // 金额输入
  onAmountInput: function (e) {
    this.setData({
      deductAmount: e.detail.value
    });
  },

  // 备注输入
  onRemarkInput: function (e) {
    this.setData({
      remark: e.detail.value
    });
  },

  // 清除结果
  clearResult: function () {
    this.setData({
      scanResult: null,
      deductAmount: '',
      remark: ''
    });
  },

  // 确认核销
  confirmVerify: function () {
    const { scanResult, deductAmount, remark } = this.data;
    
    const selectedPrizes = scanResult.prizes.filter(p => p.selected);
    const amount = parseFloat(deductAmount) || 0;
    
    if (selectedPrizes.length === 0 && amount <= 0) {
      showToast('请选择奖品或输入金额');
      return;
    }
    
    // 验证金额
    const balanceNum = parseFloat(scanResult.balance);
    if (amount > balanceNum) {
      showToast('扣除金额超过可用余额');
      return;
    }
    
    wx.showLoading({ title: '处理中...' });
    
    wx.cloud.callFunction({
      name: 'staff',
      data: {
        action: 'processVerify',
        customerId: scanResult.customerId,
        deductAmount: Math.round(amount * 100), // 转为分
        prizeIds: selectedPrizes.map(p => p._id),
        remark: remark
      },
      success: res => {
        if (res.result.code === 0) {
          wx.showModal({
            title: '核销成功',
            content: this.buildSuccessMessage(selectedPrizes, amount),
            showCancel: false,
            success: () => {
              this.clearResult();
              this.loadRecentRecords();
            }
          });
        } else {
          showToast(res.result.message || '核销失败');
        }
      },
      fail: err => {
        console.error('核销失败:', err);
        showToast('核销失败，请重试');
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 构建成功消息
  buildSuccessMessage: function (prizes, amount) {
    let message = '';
    if (prizes.length > 0) {
      message += `已核销奖品：${prizes.map(p => p.name).join('、')}\n`;
    }
    if (amount > 0) {
      message += `已扣除余额：¥${amount.toFixed(2)}`;
    }
    return message;
  },

  // 加载最近操作记录
  loadRecentRecords: function () {
    wx.cloud.callFunction({
      name: 'staff',
      data: { action: 'getRecentVerifyRecords' },
      success: res => {
        if (res.result.code === 0) {
          const records = res.result.data.records || [];
          this.setData({
            recentRecords: records.map(r => ({
              ...r,
              amount: r.amount ? (r.amount / 100).toFixed(2) : '',
              time: this.formatTime(r.createdAt)
            }))
          });
        }
      }
    });
  },

  // 格式化时间
  formatTime: function (dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
});
