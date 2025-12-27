// 云函数入口文件 - 验光记录管理
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action } = event;

  try {
    switch (action) {
      case 'getExamRecords':
        return await getExamRecords(openid);
      case 'getSelfTestRecords':
        return await getSelfTestRecords(openid);
      case 'saveSelfTest':
        return await saveSelfTest(openid, event.result);
      case 'addExamRecord':
        return await addExamRecord(event.customerId, event.record);
      default:
        return { code: -1, message: '未知操作' };
    }
  } catch (err) {
    console.error('验光记录云函数错误:', err);
    return {
      code: -1,
      message: err.message || '系统错误'
    };
  }
};

// 获取验光记录
async function getExamRecords(openid) {
  // 先获取用户
  const users = await db.collection('users').where({ openid }).get();
  
  if (users.data.length === 0) {
    return { code: -1, message: '用户不存在' };
  }
  
  const userId = users.data[0]._id;
  
  // 获取验光记录
  const records = await db.collection('exam_records').where({
    customerId: userId
  }).orderBy('examDate', 'desc').get();
  
  return {
    code: 0,
    data: {
      records: records.data
    }
  };
}

// 获取自测记录
async function getSelfTestRecords(openid) {
  // 获取最后一次自测记录
  const records = await db.collection('self_test_records').where({
    openid: openid
  }).orderBy('testDate', 'desc').limit(1).get();
  
  return {
    code: 0,
    data: {
      record: records.data.length > 0 ? records.data[0] : null
    }
  };
}

// 保存自测结果
async function saveSelfTest(openid, result) {
  const record = {
    openid: openid,
    eye: result.eye,
    visionLevel: result.visionLevel,
    correctRate: result.correctRate,
    testTime: result.testTime,
    testDate: new Date(result.testDate),
    createdAt: new Date()
  };
  
  await db.collection('self_test_records').add({ data: record });
  
  return {
    code: 0,
    message: '保存成功'
  };
}

// 添加验光记录（店员使用）
async function addExamRecord(customerId, record) {
  const examRecord = {
    customerId: customerId,
    rightEye: {
      sphere: record.rightEye.sphere,
      cylinder: record.rightEye.cylinder,
      axis: record.rightEye.axis,
      va: record.rightEye.va
    },
    leftEye: {
      sphere: record.leftEye.sphere,
      cylinder: record.leftEye.cylinder,
      axis: record.leftEye.axis,
      va: record.leftEye.va
    },
    pd: record.pd,
    add: record.add,
    note: record.note,
    optometrist: record.optometrist,
    optometristId: record.optometristId,
    examDate: new Date(record.examDate),
    createdAt: new Date()
  };
  
  await db.collection('exam_records').add({ data: examRecord });
  
  // 更新用户最后验光时间
  await db.collection('users').doc(customerId).update({
    data: {
      lastExamDate: new Date()
    }
  });
  
  return {
    code: 0,
    message: '保存成功'
  };
}
