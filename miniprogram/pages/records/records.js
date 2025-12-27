// pages/records/records.js
const app = getApp();
const { formatDate } = require('../../utils/util');

Page({
  data: {
    activeTab: 'exam', // exam, self
    latestExam: null,
    examHistory: [],
    selfTestRecord: null
  },

  onLoad: function () {
    this.loadExamRecords();
    this.loadSelfTestRecord();
  },

  onShow: function () {
    // 每次显示页面时刷新数据
    this.loadExamRecords();
    this.loadSelfTestRecord();
  },

  // 切换标签
  switchTab: function (e) {
    this.setData({
      activeTab: e.currentTarget.dataset.tab
    });
  },

  // 加载验光记录
  loadExamRecords: function () {
    wx.cloud.callFunction({
      name: 'records',
      data: { action: 'getExamRecords' },
      success: res => {
        if (res.result.code === 0) {
          const records = res.result.data.records || [];
          
          if (records.length > 0) {
            // 按日期排序，最新的在前
            records.sort((a, b) => new Date(b.examDate) - new Date(a.examDate));
            
            // 格式化日期
            const formattedRecords = records.map(r => ({
              ...r,
              examDate: this.formatExamDate(r.examDate)
            }));
            
            this.setData({
              latestExam: formattedRecords[0],
              examHistory: formattedRecords.slice(1)
            });
          } else {
            this.setData({
              latestExam: null,
              examHistory: []
            });
          }
        }
      },
      fail: err => {
        console.error('加载验光记录失败:', err);
      }
    });
  },

  // 加载自测记录
  loadSelfTestRecord: function () {
    wx.cloud.callFunction({
      name: 'records',
      data: { action: 'getSelfTestRecords' },
      success: res => {
        if (res.result.code === 0 && res.result.data.record) {
          const record = res.result.data.record;
          const eyeTextMap = {
            'left': '左眼',
            'right': '右眼',
            'both': '双眼'
          };
          
          this.setData({
            selfTestRecord: {
              ...record,
              testDate: this.formatExamDate(record.testDate),
              eyeText: eyeTextMap[record.eye] || record.eye
            }
          });
        } else {
          this.setData({
            selfTestRecord: null
          });
        }
      },
      fail: err => {
        console.error('加载自测记录失败:', err);
      }
    });
  },

  // 格式化日期
  formatExamDate: function (dateStr) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  // 查看验光详情
  viewExamDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    // 可以跳转到详情页或显示弹窗
    wx.showModal({
      title: '验光记录详情',
      content: '详细验光数据页面开发中...',
      showCancel: false
    });
  },

  // 跳转到视力测试
  goToVisionTest: function () {
    wx.navigateTo({
      url: '/pages/vision-test/vision-test'
    });
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.loadExamRecords();
    this.loadSelfTestRecord();
    wx.stopPullDownRefresh();
  }
});
