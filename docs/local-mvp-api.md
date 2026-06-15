# 本地 MVP API

当前后端是零依赖 Node.js HTTP 服务，数据存储在 `data/db.json`。它用于本地开发验证主流程，后续可迁移到 NestJS + PostgreSQL + Redis。

## 认证

### POST /api/auth/login

请求：

```json
{
  "account": "demo@muqu.local",
  "password": "123456"
}
```

返回：

```json
{
  "user": {},
  "summary": {}
}
```

登录成功后写入 `muqu_session` Cookie。

### POST /api/auth/logout

退出登录并清除 Cookie。

## 当前用户

### GET /api/me

返回当前用户、租户摘要和最近积分流水。

## 创建任务

### POST /api/tasks/estimate

按任务类型、比例、时长估算积分。

### POST /api/tasks

创建本地模拟生成任务。

流程：

1. 检查登录
2. 计算积分
3. 检查租户积分余额
4. 预扣积分
5. 创建积分流水
6. 创建任务
7. 3.5 秒后模拟生成完成
8. 确认扣费并写入作品

## 任务与作品

### GET /api/tasks

返回当前租户任务列表。

### GET /api/works

返回当前租户作品列表。

## 配置

### GET /api/options

返回提示词、套餐、模型供应商和高清化插件配置。

## 后台

### GET /api/admin/overview

管理员可查看租户、用户、套餐、价格、供应商、任务和作品概览。

## 注意

当前版本的“生成视频”是本地模拟，不会调用真实 AI 服务。真实接入时建议保留相同 API 形状，把任务执行部分替换为队列和供应商适配器。
