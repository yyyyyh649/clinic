# 数据库结构说明

本小程序使用微信云开发数据库。以下是各集合（Collection）的结构说明。

## 1. users - 用户表

存储客户用户信息。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | String | 系统自动生成 |
| openid | String | 微信openid |
| phone | String | 手机号 |
| userId | String | 用户编号 |
| nickName | String | 昵称 |
| avatarUrl | String | 头像URL |
| gender | Number | 性别：0未知，1男，2女 |
| age | Number | 年龄 |
| points | Number | 积分 |
| balance | Number | 余额（分） |
| memberLevel | String | 会员等级 |
| hasPaymentPassword | Boolean | 是否设置支付密码 |
| paymentPassword | String | 支付密码（加密存储） |
| lastExamDate | Date | 最后验光日期 |
| role | String | 角色：customer |
| createdAt | Date | 创建时间 |
| lastLoginAt | Date | 最后登录时间 |

## 2. staff - 店员表

存储店员信息。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | String | 系统自动生成 |
| openid | String | 微信openid |
| name | String | 姓名 |
| phone | String | 手机号 |
| password | String | 密码（应加密存储） |
| staffId | String | 员工编号 |
| role | String | 角色：staff/admin |
| isApproved | Boolean | 是否通过审核 |
| approvedAt | Date | 审核通过时间 |
| createdAt | Date | 创建时间 |

## 3. exam_records - 验光记录表

存储客户在店验光记录。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | String | 系统自动生成 |
| customerId | String | 客户ID |
| rightEye | Object | 右眼数据 |
| rightEye.sphere | String | 球镜（SPH） |
| rightEye.cylinder | String | 柱镜（CYL） |
| rightEye.axis | String | 轴位（AXIS） |
| rightEye.va | String | 矫正视力 |
| leftEye | Object | 左眼数据 |
| leftEye.sphere | String | 球镜（SPH） |
| leftEye.cylinder | String | 柱镜（CYL） |
| leftEye.axis | String | 轴位（AXIS） |
| leftEye.va | String | 矫正视力 |
| pd | String | 瞳距 |
| add | String | ADD（老花度数） |
| note | String | 备注 |
| optometrist | String | 验光师姓名 |
| optometristId | String | 验光师ID |
| examDate | Date | 验光日期 |
| createdAt | Date | 创建时间 |

## 4. self_test_records - 自测记录表

存储客户视力自测记录。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | String | 系统自动生成 |
| openid | String | 用户openid |
| eye | String | 测试眼睛：left/right/both |
| visionLevel | String | 视力等级 |
| correctRate | Number | 正确率 |
| testTime | String | 测试用时 |
| testDate | Date | 测试日期 |
| createdAt | Date | 创建时间 |

## 5. lottery_records - 抽奖记录表

存储抽奖和奖品信息。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | String | 系统自动生成 |
| openid | String | 用户openid |
| prizeId | Number | 奖品ID |
| name | String | 奖品名称 |
| icon | String | 奖品图标 |
| isUsed | Boolean | 是否已使用 |
| usedAt | Date | 使用时间 |
| expireAt | Date | 过期时间 |
| createdAt | Date | 抽奖时间 |

## 6. recharge_records - 充值记录表

存储客户充值记录。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | String | 系统自动生成 |
| customerId | String | 客户ID |
| rechargeAmount | Number | 充值金额（分） |
| giftAmount | Number | 赠送金额（分） |
| totalAmount | Number | 到账金额（分） |
| paymentMethod | String | 支付方式 |
| remark | String | 备注 |
| staffId | String | 操作店员ID |
| staffName | String | 操作店员姓名 |
| createdAt | Date | 创建时间 |

## 7. consume_records - 消费记录表

存储客户消费/扣款记录。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | String | 系统自动生成 |
| customerId | String | 客户ID |
| amount | Number | 消费金额（分） |
| remark | String | 消费说明 |
| staffId | String | 操作店员ID |
| createdAt | Date | 创建时间 |

## 8. verify_records - 核销记录表

存储奖品核销记录。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | String | 系统自动生成 |
| customerId | String | 客户ID |
| deductAmount | Number | 扣除金额（分） |
| prizeIds | Array | 核销的奖品ID列表 |
| remark | String | 备注 |
| staffId | String | 操作店员ID |
| createdAt | Date | 创建时间 |

## 9. qrcode_tokens - 二维码Token表

存储付款码Token，用于验证。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | String | 系统自动生成 |
| openid | String | 用户openid |
| token | String | Token值 |
| createdAt | Date | 创建时间 |
| expireAt | Date | 过期时间 |

## 10. payment_orders - 支付订单表（预留）

存储在线支付订单。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | String | 系统自动生成 |
| orderId | String | 订单号 |
| openid | String | 用户openid |
| amount | Number | 支付金额（分） |
| giftAmount | Number | 赠送金额（分） |
| totalAmount | Number | 到账金额（分） |
| status | String | 状态：pending/paid/failed |
| transactionId | String | 微信支付交易号 |
| paidAt | Date | 支付时间 |
| createdAt | Date | 创建时间 |

---

## 数据库安全规则建议

在微信云开发控制台中，建议设置以下安全规则：

```json
{
  "users": {
    ".read": "auth.openid == doc.openid",
    ".write": "auth.openid == doc.openid"
  },
  "staff": {
    ".read": true,
    ".write": "auth.openid != null"
  },
  "exam_records": {
    ".read": true,
    ".write": "auth.openid != null"
  }
}
```

建议通过云函数操作数据库，而非客户端直接操作，以确保数据安全。
