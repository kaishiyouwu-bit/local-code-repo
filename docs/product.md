# 木趣智能家装 beta版产品规划

## 产品定位

面向家装公司、设计师、家具商家、建材商家、家装市场等客户，提供上传图片/视频素材并选择风格、空间、运镜等配置后，一键生成家装装修效果视频、产品植入视频、样板房展示视频的 Web/H5 SaaS 系统。

第一阶段是正式 SaaS 的 beta 版，不是临时 Demo。功能可以收窄，但架构需要按后续上线和扩展设计。

## 第一版核心模块

- 多租户基础架构
- 用户登录与角色权限
- 会员套餐与用户席位
- 租户共享积分池
- 积分预扣、确认、失败退款
- 素材上传与素材库
- 三个一级任务类型
- 提示词后台配置
- 视频生成价格配置
- 生成任务记录
- 作品页与导出
- 高清化插件接口
- 平台后台管理端

## 三个创建入口

### 房间改造

上传毛坯房、旧房、空房图片或视频，生成装修后的效果视频。核心要求是保持原始房间结构、户型比例、墙体位置、门窗位置、地面透视关系，主要改变装修风格、材质、家具、灯光、软装和氛围。

### 产品植入

上传家具、建材、软装、卫浴、灯具、瓷砖、地板等产品图片或视频，将产品自然植入匹配的家装空间，生成真实、干净、可用于营销的产品场景视频。

### 样板房视频

上传毛坯房图片/视频，结合装修案例参考图、家具图、软装图、风格选择，生成高端样板房展示视频。

## 本地版范围

当前本地版只做 UI 与交互原型：

- 不连接真实数据库
- 不调用真实视频生成 API
- 不上传文件到对象存储
- 不做登录鉴权
- 不实现真实积分扣减

但页面结构、视觉语言和流程按正式产品预留。

## 上线版数据库核心表

- tenants
- users
- roles
- membership_plans
- tenant_memberships
- credit_accounts
- credit_transactions
- pricing_rules
- materials
- generation_tasks
- works
- work_exports
- prompt_task_types
- prompt_spaces
- prompt_styles
- prompt_camera_styles
- prompt_global_rules
- prompt_versions
- model_providers
- upscale_plugins
- orders
- system_settings

## API 分区建议

客户前台：

- /api/auth/*
- /api/app/tenant
- /api/app/materials
- /api/app/tasks
- /api/app/works
- /api/app/credits
- /api/app/membership

平台后台：

- /api/admin/dashboard
- /api/admin/tenants
- /api/admin/users
- /api/admin/membership-plans
- /api/admin/credit-transactions
- /api/admin/pricing-rules
- /api/admin/prompts/*
- /api/admin/model-providers
- /api/admin/upscale-plugins
- /api/admin/tasks
- /api/admin/works

## 开发里程碑

1. 本地 UI 原型
2. Next.js 前台工程化
3. NestJS 后端与数据库建模
4. 多租户、用户、角色、会员、积分
5. 素材上传与对象存储
6. 提示词配置与拼接
7. 视频生成任务队列
8. 作品与导出
9. 高清化插件
10. 后台运营管理
11. 测试、部署、上线
