# 研词 (YanCi) — 考研英语单词学习应用

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS 3 |
| 状态管理 | Zustand (轻量) |
| 路由 | React Router v6 (HashRouter, GitHub Pages 兼容), lazy loading 路由分割 |
| HTTP | Axios |
| 后端 | Express + TypeScript + ts-node-dev |
| 数据库 | SQLite (better-sqlite3), 文件在 `data/kaoyan.db` |
| 认证 | JWT (jsonwebtoken + bcryptjs) |
| 校验 | express-validator (输入消毒 + 邮箱/手机号格式校验) |
| 短信 | 阿里云 Dysmsapi (生产) / 开发模式固定验证码 123456 |
| 特效 | canvas-confetti (彩带), Web Audio API (音效) |
| 测试 | Vitest + Supertest (后端), Vitest + Testing Library (前端) |
| 日志 | 结构化日志 (开发彩色 / 生产 JSON) |

## 项目结构

```
kaoyan-vocabulary/
├── client/                   # React 前端
│   └── src/
│       ├── __tests__/        # 前端测试 (xp.test.ts, components.test.tsx)
│       ├── components/       # 共享组件 (Layout, VocabMap, LevelRing, XPFloating, Confetti, ErrorBoundary)
│       ├── contexts/         # React Context (AuthContext, ToastContext)
│       ├── hooks/            # useSound
│       ├── i18n/             # 中英文翻译 (zh.ts, en.ts, context.tsx)
│       ├── lib/              # xp.ts (等级计算)
│       ├── pages/            # 页面组件 (Home, StudyPage, LearnPage, TestPage, ReviewPage, ...)
│       ├── services/         # api.ts (Axios 实例 + 请求/响应拦截器)
│       ├── store/            # Zustand store
│       └── types/            # TypeScript 类型定义
├── server/                   # Express 后端
│   └── src/
│       ├── __tests__/        # 后端测试 (api.test.ts, 19 tests)
│       ├── config/db.ts      # SQLite 初始化 + 表创建 + 迁移 (支持 :memory: 测试)
│       ├── controllers/      # learn, test, review, stats, wordbook, wordbookList, user, leaderboard
│       ├── middleware/        # auth.ts (JWT), errorHandler.ts
│       ├── routes/           # 路由文件
│       ├── services/         # sms.ts (短信抽象层), codeStore.ts (验证码存储抽象层)
│       ├── types/            # express.d.ts (req.userId), db.ts (数据库 Row 类型)
│       └── utils/            # AppError.ts, logger.ts (结构化日志), validation.ts (输入校验)
├── data/                     # 词库数据 + 种子脚本
│   ├── words/                # JSON 词库文件 (core/high-freq/mid-freq/low-freq)
│   ├── seed.ts               # 数据库种子脚本
│   ├── build-vocabulary.ts   # 从开源词库构建 JSON
│   └── enrich-examples.ts    # 从多源合并例句/短语
└── shared/                   # (未使用)
```

## 启动方式

```bash
# 后端 (端口 5000)
cd server && npm run dev

# 前端 (端口 5173, 代理 /api → :5000)
cd client && npm run dev

# 运行测试
cd server && npm test    # 后端 19 tests
cd client && npm test    # 前端 9 tests
```

**重要**: 前端必须从 `client/` 目录启动 (`npm run dev`)，不能用 `npx vite`（会导致路径权限问题白屏）。

## 数据库

- users 表含: id, username, email, password_hash, phone, oauth_provider, oauth_id, xp, level, streak, last_study_date
- 5,368 个考研单词，分 4 级: core(500), high-freq(1500), mid-freq(2000), low-freq(1368)
- 10,722 条例句，含音标/释义/搭配
- SM-2 艾宾浩斯间隔重复算法
- sms_codes 表: 生产环境验证码持久化 (SQLite)

## API 路由

| 路径 | 说明 |
|------|------|
| GET /api/health | 健康检查 |
| POST /api/auth/register | 注册 (express-validator 校验) |
| POST /api/auth/login | 密码登录 |
| POST /api/auth/send-sms | 发送短信验证码 |
| POST /api/auth/login-by-phone | 手机号 + 验证码登录 (自动注册) |
| POST /api/auth/bind-phone | 绑定手机号 (需登录) |
| GET /api/auth/qq/url, /api/auth/qq/callback | QQ OAuth |
| GET /api/auth/wechat/url, /api/auth/wechat/callback | 微信 OAuth |
| GET /api/auth/me | 当前用户信息 |
| GET /api/wordbooks | 词书列表 (含进度) |
| GET /api/learn/next-word | 下一个未学单词 |
| POST /api/learn/record | 提交学习记录 (返回 XP) |
| GET /api/test/questions | 生成测试题 |
| POST /api/test/submit | 提交测试结果 |
| GET /api/review | 今日复习列表 |
| POST /api/review/rate | 评分复习单词 |
| GET /api/stats | 学习统计 |
| GET /api/user/progress | 用户 XP/等级/成就 |
| GET /api/leaderboard/level, /api/leaderboard/daily, /api/leaderboard/me | 排行榜 |

## 前端路由 (HashRouter, 所有页面 lazy loaded)

`/` 首页 → `/learn` 学习(新学/复习Tab) → `/test` 测试 → `/wordbook` 生词本 → `/search` 搜索 → `/leaderboard` 排行榜 → `/stats` 统计 → `/settings` 设置 → `/login` `/register`

## 关键约定

- 所有 API 响应格式: `{ success: boolean, data: T, message?: string }`
- 认证: JWT 存 localStorage key `kaoyan-token`, Axios 请求拦截器自动附加
- i18n: `useI18n()` hook, 默认中文, localStorage key `kaoyan-lang`
- CSS 类: `.card`, `.btn-primary/success/danger/warning/secondary/ghost`, `.input`, `.kbd`
- 颜色: brand-600 (蓝), green-600, red-600, amber-500
- 移动端: safe-area-inset, Viewport fit=cover, touch-action:manipulation
- 限流: 200次/分钟
- Toast 通知: `useToast().show(message, 'success'|'error'|'info')`, 所有 catch 均给用户反馈
- 日志: `import logger from '../utils/logger'`, 开发彩色输出 / 生产 JSON / 测试静默

## 验证码存储

| 环境 | 存储方式 |
|------|----------|
| 开发 (NODE_ENV≠production) | 内存 Map, 验证码固定 123456 |
| 生产 (NODE_ENV=production) | SQLite sms_codes 表, 持久化, 5 分钟过期 |

## 短信服务

抽象层 `services/sms.ts`, 支持:
- Dev: console.log + 固定验证码
- 生产: 阿里云 Dysmsapi

配置 `.env`:
```
SMS_ACCESS_KEY_ID=xxx
SMS_ACCESS_KEY_SECRET=xxx
SMS_SIGN_NAME=研词
SMS_TEMPLATE_CODE=SMS_123456789
```

## 当前状态

- ✅ 用户系统 (密码/手机/QQ/微信)
- ✅ 学习卡片 + 测试 + SM-2 复习
- ✅ XP/等级/成就/连击/彩带/音效
- ✅ 中英文切换
- ✅ PWA (Service Worker + manifest + 离线页)
- ✅ 词汇大陆地图 (VocabMap, 响应式列数)
- ✅ 排行榜
- ✅ 手机/平板双布局 (底部Tab vs 侧边栏)
- ✅ 移动端 safe-area + touch 优化
- ✅ 输入校验 (express-validator)
- ✅ 数据库 Row 类型定义
- ✅ 后端测试 (19 tests)
- ✅ 前端测试 (9 tests)
- ✅ 前端 lazy loading 路由分割
- ✅ 结构化日志
- ✅ 验证码持久化 (内存/文件)
- ✅ Capacitor 封装 (iOS/Android)
- ✅ 推送通知服务 (push.ts)
- ✅ 社交分享 (native.ts → Capacitor Share / Web Share API)
- ✅ 应用内购买脚手架 (iap.ts)
- ✅ App 图标 (SVG + 各尺寸 PNG)
- ✅ 部署指南 (docs/DEPLOYMENT.md)
- ✅ 上架清单 (docs/APP_STORE_CHECKLIST.md)
- ⚠️ QQ/微信 OAuth 需配置 App ID (`.env.example` 有模板)
- ⚠️ 生产短信需配置阿里云 AccessKey

## App Store 上架待办

上线 iOS App Store + Google Play 需以下步骤（详见 `docs/` 目录）：

| # | 待办事项 | 状态 | 依赖 |
|---|---------|------|------|
| 1 | 注册 Apple Developer ($688/年) | ⬜ 待办 | — |
| 2 | 注册 Google Play Console ($25) | ⬜ 待办 | — |
| 3 | 运行 `npx capacitor-assets generate` 生成原生图标 | ⬜ 待办 | Capacitor 就绪 |
| 4 | 配置 RevenueCat 激活内购 | ⬜ 待办 | 开发者账号 |
| 5 | 后端部署到阿里云 ECS / 其他服务 | ⬜ 待办 | 见 docs/DEPLOYMENT.md |
| 6 | 准备 App Store 截图 (5 张) + 描述文案 | ⬜ 待办 | 应用功能完善 |
| 7 | 编写隐私政策页面 | ⬜ 待办 | — |
| 8 | iOS 打包 → TestFlight 测试 | ⬜ 待办 | Apple Developer 账号 |
| 9 | Android 打包 → 内测 | ⬜ 待办 | Google Play 账号 |
| 10 | 提交审核上架 | ⬜ 待办 | 以上全部 |
