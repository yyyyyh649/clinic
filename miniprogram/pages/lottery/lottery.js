// pages/lottery/lottery.js
const app = getApp();
const { showToast } = require('../../utils/util');

Page({
  data: {
    prizes: [
      { id: 1, name: '全场8折券', icon: '🎫', probability: 0.1 },
      { id: 2, name: '免费清洗', icon: '🧹', probability: 0.25 },
      { id: 3, name: '眼镜布', icon: '🧴', probability: 0.25 },
      { id: 4, name: '眼镜盒', icon: '📦', probability: 0.15 },
      { id: 5, name: '10积分', icon: '⭐', probability: 0.15 },
      { id: 6, name: '谢谢参与', icon: '🙏', probability: 0.1 }
    ],
    hasDrawnToday: false,
    isDrawing: false,
    highlightIndex: -1,
    selectedIndex: -1,
    showResult: false,
    resultPrize: null,
    myPrizes: []
  },

  onLoad: function () {
    this.checkTodayLottery();
    this.loadMyPrizes();
  },

  onShow: function () {
    this.loadMyPrizes();
  },

  // 检查今日是否已抽奖
  checkTodayLottery: function () {
    wx.cloud.callFunction({
      name: 'lottery',
      data: { action: 'checkToday' },
      success: res => {
        if (res.result.code === 0) {
          this.setData({
            hasDrawnToday: res.result.data.hasDrawn
          });
        }
      }
    });
  },

  // 加载我的奖品
  loadMyPrizes: function () {
    wx.cloud.callFunction({
      name: 'lottery',
      data: { action: 'getMyPrizes' },
      success: res => {
        if (res.result.code === 0) {
          const prizes = res.result.data.prizes || [];
          const now = new Date();
          
          const processedPrizes = prizes.map(p => {
            const expireDate = new Date(p.expireAt);
            const diffTime = expireDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return {
              ...p,
              expireDays: Math.max(0, diffDays),
              isExpired: diffDays <= 0 && !p.isUsed
            };
          });
          
          // 按状态排序：待使用 > 已使用 > 已过期
          processedPrizes.sort((a, b) => {
            if (!a.isUsed && !a.isExpired && (b.isUsed || b.isExpired)) return -1;
            if ((a.isUsed || a.isExpired) && !b.isUsed && !b.isExpired) return 1;
            return 0;
          });
          
          this.setData({
            myPrizes: processedPrizes
          });
        }
      }
    });
  },

  // 开始抽奖
  startDraw: function () {
    if (this.data.hasDrawnToday || this.data.isDrawing) return;
    
    this.setData({ isDrawing: true });
    
    // 调用抽奖接口
    wx.cloud.callFunction({
      name: 'lottery',
      data: { action: 'draw' },
      success: res => {
        if (res.result.code === 0) {
          const prizeIndex = res.result.data.prizeIndex;
          const prize = res.result.data.prize;
          this.animateDraw(prizeIndex, prize);
        } else {
          showToast(res.result.message || '抽奖失败');
          this.setData({ isDrawing: false });
        }
      },
      fail: err => {
        console.error('抽奖失败:', err);
        showToast('抽奖失败，请重试');
        this.setData({ isDrawing: false });
      }
    });
  },

  // 抽奖动画
  animateDraw: function (targetIndex, prize) {
    let count = 0;
    const maxCount = 20 + targetIndex; // 转动次数
    let currentIndex = 0;
    let speed = 50;
    
    const animate = () => {
      this.setData({ highlightIndex: currentIndex });
      
      if (count >= maxCount) {
        // 动画结束
        this.setData({
          selectedIndex: targetIndex,
          highlightIndex: -1,
          isDrawing: false,
          hasDrawnToday: true
        });
        
        // 显示中奖结果
        setTimeout(() => {
          this.showPrizeResult(prize);
        }, 300);
        return;
      }
      
      count++;
      currentIndex = (currentIndex + 1) % this.data.prizes.length;
      
      // 逐渐减速
      if (count > maxCount - 6) {
        speed += 50;
      }
      
      setTimeout(animate, speed);
    };
    
    animate();
  },

  // 显示中奖结果
  showPrizeResult: function (prize) {
    // 计算过期日期
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 3);
    const dateStr = `${expireDate.getFullYear()}-${String(expireDate.getMonth() + 1).padStart(2, '0')}-${String(expireDate.getDate()).padStart(2, '0')}`;
    
    this.setData({
      showResult: true,
      resultPrize: {
        ...prize,
        expireDate: dateStr
      }
    });
    
    // 刷新奖品列表
    this.loadMyPrizes();
  },

  // 关闭结果弹窗
  closeResult: function () {
    this.setData({ showResult: false });
  }
});
