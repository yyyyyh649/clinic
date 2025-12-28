# 数据库迁移指南

## 概述

本指南用于帮助现有小程序从短信验证码登录方式迁移到微信授权登录方式。

## 迁移前准备

### 1. 备份数据

在云开发控制台，导出以下集合的数据：

```
collections/
├── users
├── staff
├── exam_records
├── recharge_records
└── 其他业务数据...
```

### 2. 检查现有数据

#### users 集合检查

```javascript
// 在云开发控制台运行以下查询
db.collection('users').where({
  openid: db.command.exists(true)
}).count()

db.collection('users').where({
  openid: db.command.exists(false)
}).count()
```

#### staff 集合检查

```javascript
// 检查店员数据
db.collection('staff').where({
  openid: db.command.exists(true)
}).count()

db.collection('staff').where({
  openid: db.command.exists(false)
}).count()
```

## 迁移步骤

### 步骤 1: 更新云函数

1. 在微信开发者工具中打开项目
2. 找到 `cloud/functions/login` 目录
3. 右键选择"上传并部署：云端安装依赖"
4. 等待部署完成
5. 重复步骤 2-4 部署 `cloud/functions/staff`

### 步骤 2: 上传小程序代码

1. 点击开发者工具的"上传"按钮
2. 填写版本号：`2.0.0`
3. 填写项目备注：
   ```
   移除短信验证码登录，改为微信授权+手机号绑定方式
   - 新用户：微信授权 + 填写手机号
   - 老用户：微信授权自动关联账号
   - 店员端：新增微信快捷登录
   ```

### 步骤 3: 提交审核

1. 登录微信公众平台
2. 进入"版本管理"
3. 提交审核
4. 审核通过后发布

### 步骤 4: 数据库字段更新（可选）

如果你的 `staff` 集合没有微信相关字段，可以添加：

```javascript
// 在云开发控制台的云函数中运行
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  // 为所有店员添加微信相关字段（如果不存在）
  const staffList = await db.collection('staff').get()
  
  const updatePromises = staffList.data.map(staff => {
    const updateData = {}
    
    if (!staff.nickName) {
      updateData.nickName = ''
    }
    
    if (!staff.avatarUrl) {
      updateData.avatarUrl = ''
    }
    
    if (Object.keys(updateData).length > 0) {
      return db.collection('staff').doc(staff._id).update({
        data: updateData
      })
    }
    
    return Promise.resolve()
  })
  
  await Promise.all(updatePromises)
  
  return {
    success: true,
    message: '字段更新完成'
  }
}
```

## 用户迁移场景

### 场景 1: 用户有 openid 和 phone

**数据状态**: 
```javascript
{
  openid: "xxxxx",
  phone: "13800138000",
  // ... 其他字段
}
```

**迁移结果**: ✅ 无需任何操作，用户可以直接使用微信登录

### 场景 2: 用户只有 phone，没有 openid

**数据状态**: 
```javascript
{
  phone: "13800138000",
  openid: null, // 或字段不存在
  // ... 其他字段
}
```

**迁移结果**: 
1. 用户首次点击"微信授权登录"
2. 系统通过手机号匹配到现有账号
3. 自动绑定微信 openid
4. 用户可以使用微信登录

**实现逻辑** (已在 `cloud/functions/login/index.js` 的 `bindPhone` 函数中实现):
```javascript
// 检查手机号是否已存在
const existingUsers = await db.collection('users').where({ phone }).get();

if (existingUsers.data.length > 0) {
  const existingUser = existingUsers.data[0];
  
  // 更新 openid 到已有账户
  await db.collection('users').doc(existingUser._id).update({
    data: {
      openid: openid,
      // 更新微信信息
    }
  });
}
```

### 场景 3: 用户只有 openid，没有 phone

**数据状态**: 
```javascript
{
  openid: "xxxxx",
  phone: "", // 或 null
  // ... 其他字段
}
```

**迁移结果**: 
1. 用户点击"微信授权登录"
2. 系统检测到缺少手机号
3. 提示用户输入手机号
4. 用户输入手机号后完成注册

### 场景 4: 全新用户

**迁移结果**: 
1. 用户点击"微信授权登录"
2. 提示输入手机号
3. 输入手机号后完成注册
4. 创建新用户记录，包含 openid 和 phone

## 店员迁移场景

### 场景 1: 店员已有 openid

**迁移结果**: ✅ 可以直接使用微信快捷登录

### 场景 2: 店员没有 openid

**迁移结果**: 
1. 店员可继续使用手机号+密码登录
2. （可选）在店员端添加"绑定微信"功能，让店员绑定微信以启用快捷登录

## 测试验证

### 测试清单

#### 客户端测试
- [ ] 新用户注册（微信授权 + 填写手机号）
- [ ] 有 openid 和 phone 的老用户登录
- [ ] 只有 phone 的老用户首次微信登录（自动绑定）
- [ ] 只有 openid 的老用户补充手机号
- [ ] 手机号已被占用的提示

#### 店员端测试
- [ ] 店员微信快捷登录
- [ ] 店员手机号密码登录
- [ ] 新店员注册（含微信绑定）
- [ ] 新店员注册（不绑定微信）
- [ ] 待审核店员登录拦截

### 测试数据准备

在测试环境准备以下数据：

```javascript
// 1. 完整用户数据
{
  "_id": "user1",
  "openid": "openid1",
  "phone": "13800138000",
  "nickName": "测试用户1",
  // ... 其他字段
}

// 2. 仅手机号用户
{
  "_id": "user2",
  "phone": "13800138001",
  "nickName": "测试用户2",
  // ... 其他字段
}

// 3. 仅 openid 用户
{
  "_id": "user3",
  "openid": "openid3",
  "phone": "",
  "nickName": "测试用户3",
  // ... 其他字段
}
```

## 回滚方案

如果迁移后发现问题需要回滚：

### 1. 代码回滚

```bash
# 在本地 Git 仓库中
git log --oneline -10
git checkout <旧版本的commit>
```

### 2. 重新部署

1. 重新上传云函数（旧版本）
2. 重新上传小程序代码（旧版本）
3. 提交审核并发布

### 3. 数据处理

- 新迁移方式下绑定的 openid 可以保留
- 回滚不会影响现有用户数据
- 如需清理数据，手动删除新绑定的 openid 字段

## 监控与日志

### 关键指标

迁移后需要关注：

1. **登录成功率**: 应保持在 95% 以上
2. **新用户注册率**: 观察新登录方式对注册的影响
3. **错误率**: 监控云函数调用错误
4. **用户反馈**: 收集用户对新登录方式的反馈

### 日志查看

在云开发控制台 → 云函数 → 日志中查看：

```
login 云函数日志
staff 云函数日志
```

关注以下错误：
- 手机号已被绑定
- openid 不存在
- 数据库操作失败

## 常见问题处理

### Q1: 用户反馈无法登录

**排查步骤**:
1. 在数据库中查找该用户的 `phone` 或 `openid`
2. 检查字段是否完整
3. 查看云函数日志中的错误信息
4. 如果是数据问题，手动修复数据库记录

### Q2: 手机号已被绑定的处理

**处理方案**:
1. 确认是否是同一用户的多个微信号
2. 如是本人，可在数据库中解绑旧的 openid
3. 如不是本人，建议用户使用其他手机号注册

### Q3: 迁移后云函数调用失败

**排查步骤**:
1. 检查云函数是否部署成功
2. 检查云函数权限配置
3. 查看云函数运行日志
4. 检查数据库集合权限

## 联系支持

遇到问题请：

1. 查看云函数日志
2. 检查数据库数据完整性
3. 参考本文档的常见问题部分
4. 在 GitHub Issues 中提问
5. 联系开发团队

---

**版本**: 2.0.0
**更新日期**: 2025-12-28
