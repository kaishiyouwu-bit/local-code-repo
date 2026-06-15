# 木趣智能家装 beta版

家装行业 AI 视频生成 SaaS 的本地部署 MVP。当前版本已经包含本地后端、演示登录、租户账户、积分预扣、任务创建、模拟生成和作品保存流程。

## 当前版本

- 客户前台：创建视频、房间改造、产品植入、样板房视频、作品预览、素材上传表单
- 响应式布局：桌面端左侧导航，移动端底部导航
- 管理后台预览：数据看板、装修风格管理表格
- 本地交互：任务类型切换、视频比例/时长选择、预计积分计算、生成提示
- 功能能力矩阵：多租户、会员、积分、素材库、任务记录、作品导出、高清化、角色权限、异常处理
- 后台配置能力：租户、用户、套餐、积分流水、价格规则、提示词、模型供应商、高清化插件、系统设置
- 本地后端：Node.js 零依赖 HTTP 服务
- 本地数据：`data/db.json`
- 演示流程：登录 -> 选择任务 -> 预估积分 -> 创建任务 -> 预扣积分 -> 模拟生成 -> 保存作品

## 本地运行

启动本地服务：

```bash
npm start
```

或：

```bash
node server.js
```

然后访问：

```text
http://127.0.0.1:4173/
```

演示账号：

```text
demo@muqu.local / 123456
```

备用创作者账号：

```text
creator@muqu.local / 123456
```

## 文件结构

```text
muqu-ai-home-beta/
  server.js       本地后端 API 与静态资源服务
  package.json    本地运行脚本
  index.html      页面结构
  styles.css      视觉样式与响应式布局
  script.js       本地交互逻辑
  data/
    db.json       本地 JSON 数据库
  docs/
    product.md    产品与开发规划
    feature-map.md 文档功能能力映射
```

## 当前能力边界

当前版本可以本地登录、创建任务、预扣积分、模拟生成完成、保存作品，但还没有接入真实 AI 视频生成供应商。

真实上线前还需要接入：

- 对象存储上传
- PostgreSQL / Prisma
- Redis / BullMQ 任务队列
- 真实视频生成 API
- 真实高清化 API
- 生产环境鉴权、安全和部署配置

## 设计方向

- 浅色、高级、干净、卡片式
- 米白、浅灰、原木色点缀
- 客户前台偏设计工具感，不做传统后台
- 后台管理端保持现代、克制、可配置
- Web / H5 使用同一套响应式前端

## 后续上线版建议

正式上线版本建议迁移为：

- Frontend: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui
- Backend: NestJS + TypeScript
- Database: PostgreSQL + Prisma
- Queue: Redis + BullMQ
- Storage: OSS / COS / S3
- Auth: JWT + Refresh Token
- Deployment: Docker + 云服务器 / 托管平台

当前静态版可以作为 UI 原型继续拆分为 Next.js 页面与组件。
