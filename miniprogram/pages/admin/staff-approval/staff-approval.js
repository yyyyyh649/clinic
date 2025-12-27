// pages/admin/staff-approval/staff-approval.js
const { showToast, showConfirm } = require('../../../utils/util');

Page({
  data: {
    isLoading: true,
    pendingStaff: [],
    approvedStaff: []
  },

  onLoad: function () {
    this.loadStaffList();
  },

  // 加载店员列表
  loadStaffList: function () {
    this.setData({ isLoading: true });
    
    // 加载待审核
    wx.cloud.callFunction({
      name: 'admin',
      data: { action: 'getPendingStaff' },
      success: res => {
        if (res.result.code === 0) {
          const staff = res.result.data.staff || [];
          this.setData({
            pendingStaff: staff.map(s => ({
              ...s,
              applyTime: this.formatDate(s.createdAt)
            }))
          });
        }
      }
    });

    // 加载已通过
    wx.cloud.callFunction({
      name: 'admin',
      data: { action: 'getApprovedStaff' },
      success: res => {
        if (res.result.code === 0) {
          this.setData({
            approvedStaff: res.result.data.staff || []
          });
        }
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 格式化日期
  formatDate: function (dateStr) {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  // 通过审核
  approveStaff: async function (e) {
    const staffId = e.currentTarget.dataset.id;
    const confirmed = await showConfirm('确定通过该店员的注册申请吗？');
    
    if (confirmed) {
      wx.showLoading({ title: '处理中...' });
      
      wx.cloud.callFunction({
        name: 'admin',
        data: {
          action: 'approveStaff',
          staffId,
          approved: true
        },
        success: res => {
          if (res.result.code === 0) {
            showToast('已通过', 'success');
            this.loadStaffList();
          } else {
            showToast(res.result.message || '操作失败');
          }
        },
        fail: err => {
          console.error('操作失败:', err);
          showToast('操作失败，请重试');
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    }
  },

  // 拒绝申请
  rejectStaff: async function (e) {
    const staffId = e.currentTarget.dataset.id;
    const confirmed = await showConfirm('确定拒绝该店员的注册申请吗？');
    
    if (confirmed) {
      wx.showLoading({ title: '处理中...' });
      
      wx.cloud.callFunction({
        name: 'admin',
        data: {
          action: 'approveStaff',
          staffId,
          approved: false
        },
        success: res => {
          if (res.result.code === 0) {
            showToast('已拒绝', 'success');
            this.loadStaffList();
          } else {
            showToast(res.result.message || '操作失败');
          }
        },
        fail: err => {
          console.error('操作失败:', err);
          showToast('操作失败，请重试');
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    }
  }
});
