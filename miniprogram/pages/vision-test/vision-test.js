// pages/vision-test/vision-test.js
const app = getApp();
const { recordsApi } = require('../../utils/api');
const { showToast, formatTime } = require('../../utils/util');

Page({
  data: {
    testState: 'intro', // intro, testing, result
    testingEye: 'both',
    currentStep: 0,
    totalSteps: 12,
    currentLevel: 1,
    currentSize: 200, // E字大小（rpx）
    currentRotation: 0, // E字旋转角度
    correctDirection: '', // 正确方向
    remainingTime: 5, // 每题剩余时间
    correctCount: 0,
    wrongCount: 0,
    skipCount: 0,
    maxLevel: 8,
    visionLevel: '',
    correctRate: 0,
    testTime: '',
    visionTip: '',
    visionStatus: '',
    testStartTime: null,
    timer: null,
    
    // E字大小对应的视力等级
    levelSizes: [200, 160, 130, 100, 80, 60, 45, 35],
    levelNames: ['4.0', '4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7-5.0']
  },

  onLoad: function () {
    // 获取屏幕信息，适配E字大小
    const systemInfo = wx.getSystemInfoSync();
    const screenWidth = systemInfo.screenWidth;
    // 根据屏幕宽度调整E字大小比例
    const ratio = screenWidth / 375;
    const adjustedSizes = this.data.levelSizes.map(size => Math.round(size * ratio));
    this.setData({ levelSizes: adjustedSizes });
  },

  onUnload: function () {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
  },

  // 选择测试眼睛
  selectEye: function (e) {
    this.setData({
      testingEye: e.currentTarget.dataset.eye
    });
  },

  // 开始测试
  startTest: function () {
    this.setData({
      testState: 'testing',
      currentStep: 0,
      currentLevel: 1,
      correctCount: 0,
      wrongCount: 0,
      skipCount: 0,
      testStartTime: new Date()
    });
    this.generateQuestion();
    this.startTimer();
  },

  // 生成题目
  generateQuestion: function () {
    const directions = ['up', 'down', 'left', 'right'];
    const rotations = { 'right': 0, 'up': 90, 'left': 180, 'down': 270 };
    
    // 随机选择方向
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    const rotation = rotations[randomDirection];
    const size = this.data.levelSizes[this.data.currentLevel - 1];

    this.setData({
      currentRotation: rotation,
      correctDirection: randomDirection,
      currentSize: size,
      remainingTime: 5
    });
  },

  // 开始计时
  startTimer: function () {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
    
    const timer = setInterval(() => {
      if (this.data.remainingTime <= 1) {
        this.handleTimeout();
      } else {
        this.setData({
          remainingTime: this.data.remainingTime - 1
        });
      }
    }, 1000);
    
    this.setData({ timer });
  },

  // 超时处理
  handleTimeout: function () {
    this.setData({
      skipCount: this.data.skipCount + 1
    });
    this.nextQuestion();
  },

  // 选择方向
  selectDirection: function (e) {
    const selected = e.currentTarget.dataset.direction;
    const correct = this.data.correctDirection;
    
    if (selected === correct) {
      this.setData({
        correctCount: this.data.correctCount + 1
      });
      // 正确答案，可以升级
      if (this.data.correctCount >= 2 && this.data.currentLevel < this.data.maxLevel) {
        this.setData({
          currentLevel: this.data.currentLevel + 1
        });
      }
    } else {
      this.setData({
        wrongCount: this.data.wrongCount + 1
      });
      // 连续错误可能降级
      if (this.data.wrongCount >= 2 && this.data.currentLevel > 1) {
        this.setData({
          currentLevel: this.data.currentLevel - 1
        });
      }
    }
    
    this.nextQuestion();
  },

  // 跳过（看不清）
  skipQuestion: function () {
    this.setData({
      skipCount: this.data.skipCount + 1,
      wrongCount: this.data.wrongCount + 1
    });
    
    // 看不清则降低级别
    if (this.data.currentLevel > 1) {
      this.setData({
        currentLevel: this.data.currentLevel - 1
      });
    }
    
    this.nextQuestion();
  },

  // 下一题
  nextQuestion: function () {
    const nextStep = this.data.currentStep + 1;
    
    if (nextStep >= this.data.totalSteps) {
      this.endTest();
    } else {
      this.setData({
        currentStep: nextStep
      });
      this.generateQuestion();
      this.startTimer();
    }
  },

  // 结束测试
  endTest: function () {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
    
    const { correctCount, wrongCount, skipCount, totalSteps, currentLevel, levelNames } = this.data;
    const correctRate = Math.round((correctCount / totalSteps) * 100);
    const visionLevel = levelNames[currentLevel - 1] || '4.0';
    
    // 计算测试时长
    const endTime = new Date();
    const duration = Math.round((endTime - this.data.testStartTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const testTime = `${minutes}分${seconds}秒`;
    
    // 根据视力等级给出建议
    let visionTip = '';
    let visionStatus = '';
    if (currentLevel >= 6) {
      visionTip = '您的视力状况良好，请继续保持良好用眼习惯！';
      visionStatus = 'good';
    } else if (currentLevel >= 4) {
      visionTip = '您的视力略有下降，建议到店进行专业验光检查。';
      visionStatus = 'normal';
    } else {
      visionTip = '您的视力可能需要关注，强烈建议进行专业眼科检查。';
      visionStatus = 'warning';
    }
    
    this.setData({
      testState: 'result',
      visionLevel,
      correctRate,
      testTime,
      visionTip,
      visionStatus
    });
  },

  // 重新测试
  retryTest: function () {
    this.setData({
      testState: 'intro'
    });
  },

  // 保存结果
  saveResult: function () {
    const { testingEye, visionLevel, correctRate, testTime } = this.data;
    
    wx.showLoading({ title: '保存中...' });
    
    wx.cloud.callFunction({
      name: 'records',
      data: {
        action: 'saveSelfTest',
        result: {
          eye: testingEye,
          visionLevel,
          correctRate,
          testTime,
          testDate: new Date().toISOString()
        }
      },
      success: res => {
        if (res.result.code === 0) {
          showToast('保存成功', 'success');
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
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
