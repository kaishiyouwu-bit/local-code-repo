# 木趣智能家装 beta版

家装行业 AI 视频生成 SaaS 的本地部署预览版。当前版本用于确认 UI 风格、核心交互流程和信息架构，暂不接入真实后端、数据库、对象存储或 AI 生成接口。

## 当前版本

- 客户前台：创建视频、房间改造、产品植入、样板房视频、作品预览、素材上传表单
- 响应式布局：桌面端左侧导航，移动端底部导航
- 管理后台预览：数据看板、装修风格管理表格
- 本地交互：任务类型切换、视频比例/时长选择、预计积分计算、生成提示

## 本地运行

直接打开：

```text
index.html
```

或使用任意静态服务器：

```bash
python -m http.server 4173 --bind 127.0.0.1
```

然后访问：

```text
http://127.0.0.1:4173/
```

## 文件结构

```text
muqu-ai-home-beta/
  index.html      页面结构
  styles.css      视觉样式与响应式布局
  script.js       本地交互逻辑
  docs/
    product.md    产品与开发规划
```

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
