# 研词 (YanCi) — 考研英语单词学习应用

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS 3 |
| 状态管理 | Zustand (轻量) |
| 路由 | React Router v6 (HashRouter, GitHub Pages 兼容) |
| HTTP | Axios |
| 后端 | Express + TypeScript + ts-node-dev |
| 数据库 | SQLite (better-sqlite3), 文件在 `data/kaoyan.db` |
| 认证 | JWT (jsonwebtoken + bcryptjs) |
| 特效 | canvas-confetti (彩带), Web Audio API (音效) |

## 项目结构

```
kaoyan-vocabulary/
├── client/                  # React 前端
│   └── src/
│       ├── components/      # 共享组件 (Layout, VocabMap, LevelRing, XPFloating, Confetti, ErrorBoundary)
│       ├── contexts/        # React Context (AuthContext, ToastContext)
│       ├── hooks/           # useSound
│       ├── i18n/            # 中英文翻译 (zh.ts, en.ts, context.tsx)
│       ├── lib/             # xp.ts (等级计算)
│       ├── pages/           # 页面组件 (Home, StudyPage, LearnPage, TestPage, ReviewPage, ...)
│       ├── services/        # api.ts (Axios 实例 + 请求/响应拦截器)
│       ├── store/           # Zustand store
│       └── types/           # TypeScript 类型定义
├── server/                  # Express 后端
│   └── src/
│       ├── config/db.ts     # SQLite 初始化 + 表创建 + 迁移
│       ├── controllers/     # learn, test, review, stats, wordbook, wordbookList, user, leaderboard
│       ├── middleware/       # auth.ts (JWT), errorHandler.ts
│       ├── routes/          # 路由文件
│       └── types/           # express.d.ts (req.userId 扩展)
├── data/                    # 词库数据 + 种子脚本
│   ├── words/               # JSON 词库文件 (core/high-freq/mid-freq/low-freq)
│   ├── seed.ts              # 数据库种子脚本
│   ├── build-vocabulary.ts  # 从开源词库构建 JSON
│   └── enrich-examples.ts   # 从多源合并例句/短语
└── shared/                  # (未使用)
```

## 启动方式

```bash
# 后端 (端口 5000)
cd server && npm run dev

# 前端 (端口 5173, 代理 /api → :5000)
cd client && npm run dev
```

**重要**: 前端必须从 `client/` 目录启动 (`npm run dev`)，不能用 `npx vite`（会导致路径权限问题白屏）。

## 数据库

- users 表含: id, username, email, password_hash, phone, oauth_provider, oauth_id, xp, level, streak, last_study_date
- 5,368 个考研单词，分 4 级: core(500), high-freq(1500), mid-freq(2000), low-freq(1368)
- 10,722 条例句，含音标/释义/搭配
- SM-2 艾宾浩斯间隔重复算法

## API 路由

| 路径 | 说明 |
|------|------|
| GET/POST /api/auth/* | 注册/登录/手机号/QQ/微信 OAuth |
| GET /api/wordbooks | 词书列表 (含进度) |
| GET /api/learn/next-word | 下一个未学单词 |
| POST /api/learn/record | 提交学习记录 (返回 XP) |
| GET /api/test/questions | 生成测试题 |
| GET/POST /api/review | 今日复习 + 评分 |
| GET /api/stats | 学习统计 |
| GET /api/user/progress | 用户 XP/等级/成就 |
| GET /api/leaderboard/* | 排行榜 |

## 前端路由 (HashRouter)

`/` 首页 → `/learn` 学习(新学/复习Tab) → `/test` 测试 → `/wordbook` 生词本 → `/search` 搜索 → `/leaderboard` 排行榜 → `/stats` 统计 → `/settings` 设置 → `/login` `/register`

## 关键约定

- 所有 API 响应格式: `{ success: boolean, data: T, message?: string }`
- 认证: JWT 存 localStorage key `kaoyan-token`, Axios 请求拦截器自动附加
- i18n: `useI18n()` hook, 默认中文, localStorage key `kaoyan-lang`
- CSS 类: `.card`, `.btn-primary/success/danger/warning/secondary/ghost`, `.input`, `.kbd`
- 颜色: brand-600 (蓝), green-600, red-600, amber-500
- 移动端: safe-area-inset, Viewport fit=cover, touch-action:manipulation
- 限流: 200次/分钟

## 当前状态

- ✅ 用户系统 (密码/手机/QQ/微信)
- ✅ 学习卡片 + 测试 + SM-2 复习
- ✅ XP/等级/成就/连击/彩带/音效
- ✅ 中英文切换
- ✅ PWA (Service Worker + manifest)
- ✅ 词汇大陆地图 (VocabMap)
- ✅ 排行榜
- ✅ 移动端适配
- ⚠️ QQ/微信 OAuth 需配置 App ID
- ⚠️ 短信服务需配置运营商
- ⚠️ GitHub Pages 部署需 workflow 权限
