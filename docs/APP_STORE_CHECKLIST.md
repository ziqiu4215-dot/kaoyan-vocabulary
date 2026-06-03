# App Store 上架清单

## 准备阶段

### 1. 开发者账号

| 平台 | 费用 | 注册地址 | 审核周期 |
|------|------|----------|----------|
| Apple Developer | ¥688/年 | developer.apple.com | 1-3 天 |
| Google Play | $25 一次性 | play.google.com/console | 即时 |

### 2. 应用资产清单

#### iOS App Store

| 资产 | 尺寸 | 说明 |
|------|------|------|
| App 图标 | 1024×1024 PNG | 无圆角、无透明 |
| iPhone 6.7" 截图 | 1290×2796 | iPhone 15 Pro Max |
| iPhone 6.5" 截图 | 1242×2688 | iPhone 11 Pro Max |
| iPhone 5.5" 截图 | 1242×2208 | iPhone 8 Plus |
| iPad 12.9" 截图 | 2048×2732 | (如适用) |

截图内容建议：
1. 首页 — 学习进度 + 词汇大陆地图
2. 学习卡片 — 单词释义 + 例句
3. 测试模式 — 选择题 + 听写
4. 排行榜 — 好友竞技
5. 统计页 — 学习数据分析

#### Google Play

| 资产 | 尺寸 | 说明 |
|------|------|------|
| App 图标 | 512×512 PNG | 自适应图标 |
| Feature Graphic | 1024×500 PNG | 商店页面顶部横幅 |
| 手机截图 | 16:9 或 9:16 | 2-8 张 |
| 平板截图 | 16:9 或 9:16 | 可选 |

### 3. 应用信息

```
应用名称: 研词 — 考研英语单词
副标题 (iOS): 语境记忆 + 艾宾浩斯复习
简短描述 (Android): 5000+ 考研单词，真实语境记忆，艾宾浩斯智能复习
详细描述:
  研词是一款专为考研学子设计的英语单词学习应用。
  
  【核心功能】
  • 5368 个考研必考单词，分核心/高频/中频/低频 4 级
  • 每个单词配有真实例句和短语搭配，拒绝死记硬背
  • 基于 SM-2 艾宾浩斯遗忘曲线的智能复习系统
  • 多种测试模式：词义选择、听写、填空
  • XP 等级系统 + 成就徽章 + 连续打卡
  • 词汇大陆地图，可视化学习进度
  • 排行榜与好友竞技

关键词: 考研,英语,单词,背单词,词汇,研究生,英语一,英语二
分类: 教育
年龄分级: 4+
版权: © 2026 YanCi
```

### 4. 隐私政策

需要一个在线可访问的隐私政策 URL。可以用 GitHub Pages 或 Notion 托管。

隐私政策模板要点：
- 收集信息类型（用户名、邮箱、学习数据）
- 如何使用（提供学习服务、排行榜）
- 第三方服务（阿里云短信、Firebase 推送）
- 数据存储（本地 + 云端）
- 用户权利（删除账号、导出数据）

### 5. 使用 @capacitor/assets 生成原生图标

```bash
cd client
npm install @capacitor/assets --save-dev
npx capacitor-assets generate --iconBackgroundColor '#2563EB' --splashBackgroundColor '#2563EB'
```

确保 `resources/icon.png` (1024×1024) 和 `resources/splash.png` (2732×2732) 就位。

## 打包发布

### iOS 打包（需要 Mac + Xcode）

```bash
cd client
npm run build
npx cap sync ios
npx cap open ios
# Xcode: Product → Archive → Distribute App
```

### Android 打包

```bash
cd client
npm run build
npx cap sync android
npx cap open android
# Android Studio: Build → Generate Signed Bundle / APK
```

## 审核常见拒绝原因

1. **缺少隐私政策链接** → 在 App Store Connect 填写
2. **权限描述不清晰** → Info.plist 中详细说明每个权限用途
3. **启动时崩溃** → 在真机上充分测试
4. **UI 不适配 iPad** → 确保在 iPad 上可用（即使不是原生适配）
5. **包含未声明的第三方支付** → 内购必须走 Apple/Google 官方渠道
