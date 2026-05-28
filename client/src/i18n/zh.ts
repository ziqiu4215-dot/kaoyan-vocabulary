const zh = {
  // nav
  'nav.home': '首页',
  'nav.learn': '学习',
  'nav.review': '复习',
  'nav.wordbook': '生词本',
  'nav.search': '搜索',
  'nav.stats': '统计',

  // header
  'header.title': '考研英语单词',
  'header.running': '运行中',

  // common
  'common.loading': '加载中...',
  'common.back': '返回',
  'common.submit': '提交',
  'common.search': '搜索',
  'common.total': '总计',
  'common.progress': '进度',
  'common.learned': '已学',
  'common.mastered': '已掌握',
  'common.all': '全部',
  'common.retry': '重试',
  'common.delete': '删除',

  // home
  'home.heading': '选择词书',
  'home.loading': '正在加载词书...',
  'home.empty': '暂无词书，请先运行数据初始化脚本',
  'home.errorCheck': '请确认服务端是否运行在 :5000 端口',
  'home.clickHint': '点击词书开始学习',
  'home.cols.id': '编号',
  'home.cols.total': '总数',
  'home.cols.progress': '进度',
  'home.cols.status': '状态',

  // learn
  'learn.loading': '正在加载下一个单词...',
  'learn.allDone': '该词书所有单词已学完。',
  'learn.backToBooks': '返回词书列表',
  'learn.unknown': '不认识',
  'learn.known': '认识',
  'learn.fav': '收藏',
  'learn.play': '发音',
  'learn.meanings': '释义',
  'learn.rootAffix': '词根词缀',
  'learn.derivatives': '派生词',
  'learn.collocations': '常用搭配',
  'learn.example': '例句',
  'learn.exam': '考点',
  'learn.keyHint': '← 不认识  |  → 认识',

  // review
  'review.loading': '正在加载复习队列...',
  'review.allDone': '今天没有需要复习的单词。',
  'review.completed': '已复习 {count} 个单词。',
  'review.stats': '今日已学 {learned} / 待复习 {due}',
  'review.comeBackLater': '稍后再来，或者先学习新单词',
  'review.showMeaning': '显示释义（空格/回车）',
  'review.rateQuality': '评估回忆质量（0-5）',
  'review.recall': '回忆',
  'review.rep': '复',
  'review.interval': '间',
  'review.ef': '易',
  'review.quality.0': '完全遗忘',
  'review.quality.1': '不记得',
  'review.quality.2': '看到答案后想起',
  'review.quality.3': '正确但困难',
  'review.quality.4': '正确但犹豫',
  'review.quality.5': '完美回忆',

  // test
  'test.loading': '正在准备测试题目...',
  'test.done': '测试完成',
  'test.correct': '正确',
  'test.wrong': '错误',
  'test.another': '再来一组',
  'test.type.meaning': '释义选择',
  'test.type.listen': '听音写词',
  'test.type.fill': '例句填空',
  'test.listenHint': '听发音，写出单词',
  'test.play': '播放',
  'test.hint': '提示',
  'test.placeholder': '输入单词...',
  'test.fillHint': '填入缺失的单词',
  'test.next': '下一题',
  'test.viewResult': '查看结果',
  'test.empty': '(空)',

  // wordbook
  'wordbook.title': '生词本',
  'wordbook.loading': '加载中...',
  'wordbook.empty': '生词本中暂无单词，在学习过程中添加吧',
  'wordbook.filter.all': '全部',
  'wordbook.filter.wrong': '错词',
  'wordbook.filter.favorite': '收藏',
  'wordbook.delete': '删除',
  'wordbook.count': '{count} 个单词',

  // search
  'search.title': '搜索单词',
  'search.placeholder': '输入单词...',
  'search.button': '搜索',
  'search.searching': '搜索中...',
  'search.noResults': '未找到 "{query}" 相关结果',
  'search.results': '{count} 条结果',

  // stats
  'stats.title': '学习统计',
  'stats.loadFailed': '加载统计数据失败',
  'stats.totalWords': '总词汇量',
  'stats.streak': '连续天数',
  'stats.accuracy': '正确率',
  'stats.dueToday': '今日待复习',
  'stats.wordsToReview': '个单词待复习',
  'stats.byLevel': '按级别',
  'stats.last7Days': '最近 7 天',
  'stats.progress': '学习进度',

  // levels
  'level.high-freq': '考研高频词',
  'level.mid-freq': '考研中频词',
  'level.low-freq': '考研低频词',
  'level.core': '真题核心词',
  'level.cet4': 'CET-4',
  'level.cet6': 'CET-6',
  'level.postgraduate': '考研大纲完整版',
} as const;

export default zh;
export type I18nMessages = Record<keyof typeof zh, string>;
