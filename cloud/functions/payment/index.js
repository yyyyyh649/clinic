// 云函数入口文件 - 支付功能（预留）
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 充值优惠配置
const RECHARGE_OFFERS = [
  { id: 1, amount: 200, gift: 0, total: 200, description: '充200得200' },
  { id: 2, amount: 500, gift: 100, total: 600, description: '充500送100' },
  { id: 3, amount: 1000, gift: 250, total: 1250, description: '充1000送250' },
  { id: 4, amount: 2000, gift: 600, total: 2600, description: '充2000送600' }
];

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action } = event;

  try {
    switch (action) {
      case 'getRechargeOffers':
        return await getRechargeOffers();
      case 'recharge':
        return await initiateRecharge(openid, event.amount);
      case 'paymentCallback':
        return await handlePaymentCallback(event);
      default:
        return { code: -1, message: '未知操作' };
    }
  } catch (err) {
    console.error('支付云函数错误:', err);
    return {
      code: -1,
      message: err.message || '系统错误'
    };
  }
};

// 获取充值优惠
async function getRechargeOffers() {
  return {
    code: 0,
    data: {
      offers: RECHARGE_OFFERS
    }
  };
}

// 发起充值（预留微信支付接口）
async function initiateRecharge(openid, amount) {
  // TODO: 接入微信支付API
  // 1. 生成订单号
  // 2. 调用微信支付统一下单接口
  // 3. 返回支付参数给前端
  
  const orderId = generateOrderId();
  
  // 计算赠送金额
  const offer = RECHARGE_OFFERS.find(o => o.amount === amount);
  const giftAmount = offer ? offer.gift : 0;
  const totalAmount = amount + giftAmount;
  
  // 创建待支付订单
  await db.collection('payment_orders').add({
    data: {
      orderId,
      openid,
      amount: amount * 100, // 转为分
      giftAmount: giftAmount * 100,
      totalAmount: totalAmount * 100,
      status: 'pending',
      createdAt: new Date()
    }
  });
  
  return {
    code: 0,
    data: {
      orderId,
      // paymentParams: {} // 微信支付参数
      message: '在线支付功能开发中，请联系店员进行充值'
    }
  };
}

// 支付回调处理（预留）
async function handlePaymentCallback(event) {
  const { orderId, transactionId } = event;
  
  // 查找订单
  const orders = await db.collection('payment_orders').where({
    orderId
  }).get();
  
  if (orders.data.length === 0) {
    return { code: -1, message: '订单不存在' };
  }
  
  const order = orders.data[0];
  
  if (order.status !== 'pending') {
    return { code: -1, message: '订单状态异常' };
  }
  
  // 更新订单状态
  await db.collection('payment_orders').doc(order._id).update({
    data: {
      status: 'paid',
      transactionId,
      paidAt: new Date()
    }
  });
  
  // 更新用户余额
  await db.collection('users').where({
    openid: order.openid
  }).update({
    data: {
      balance: _.inc(order.totalAmount)
    }
  });
  
  // 创建充值记录
  await db.collection('recharge_records').add({
    data: {
      customerId: order.openid,
      rechargeAmount: order.amount,
      giftAmount: order.giftAmount,
      totalAmount: order.totalAmount,
      paymentMethod: 'wechat_pay',
      orderId,
      transactionId,
      createdAt: new Date()
    }
  });
  
  return {
    code: 0,
    message: '充值成功'
  };
}

// 生成订单号
function generateOrderId() {
  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `OPT${timestamp}${random}`;
}
