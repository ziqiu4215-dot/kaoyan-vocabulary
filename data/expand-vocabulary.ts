/**
 * 考研词汇扩展脚本 — 在已有词库基础上批量添加更多单词
 * 用法: npx ts-node expand-vocabulary.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface WordEntry {
  word: string;
  phoneticUs: string;
  meanings: { pos: string; defCn: string; examWeight: number }[];
  rootAffix?: { root?: string; rootMeaning?: string; affixes?: { part: string; meaning: string }[]; meaning: string };
  derivatives?: { word: string; pos: string; defCn: string }[];
  collocations?: { phrase: string; meaning: string }[];
  frequencyRank: number;
  level: string;
  examples: { sentence: string; translation: string; source: string; difficulty: number }[];
}

// 考研高频词汇扩展
const highFreqWords: WordEntry[] = [
  {
    word: "abuse",
    phoneticUs: "/əˈbjuːz/",
    meanings: [
      { pos: "vt./n.", defCn: "滥用；虐待；辱骂", examWeight: 5 },
    ],
    rootAffix: { root: "us", rootMeaning: "使用", affixes: [{ part: "ab-", meaning: "偏离/异常" }], meaning: "ab-(偏离) + use(使用) → 使用偏离正常 → 滥用" },
    derivatives: [
      { word: "abusive", pos: "adj.", defCn: "辱骂的；虐待的" },
    ],
    collocations: [
      { phrase: "drug abuse", meaning: "药物滥用" },
      { phrase: "abuse of power", meaning: "滥用权力" },
    ],
    frequencyRank: 2,
    level: "high-freq",
    examples: [
      { sentence: "The official was accused of abusing his power.", translation: "该官员被指控滥用职权。", source: "考研英语一 阅读", difficulty: 2 },
    ],
  },
  {
    word: "access",
    phoneticUs: "/ˈækses/",
    meanings: [
      { pos: "n.", defCn: "通道；进入；使用权", examWeight: 5 },
      { pos: "vt.", defCn: "访问；存取（数据）", examWeight: 4 },
    ],
    rootAffix: { root: "cess", rootMeaning: "走/去", affixes: [{ part: "ac-", meaning: "朝向" }], meaning: "ac-(朝向) + cess(走) → 走向某处 → 进入/通道" },
    derivatives: [
      { word: "accessible", pos: "adj.", defCn: "可进入的；易接近的" },
      { word: "accessibility", pos: "n.", defCn: "可及性；可达性" },
    ],
    collocations: [
      { phrase: "have access to", meaning: "可以获得/使用" },
      { phrase: "Internet access", meaning: "互联网接入" },
    ],
    frequencyRank: 3,
    level: "high-freq",
    examples: [
      { sentence: "Students have free access to the library's digital resources.", translation: "学生可以免费使用图书馆的数字资源。", source: "考研英语二 阅读", difficulty: 2 },
    ],
  },
  {
    word: "accomplish",
    phoneticUs: "/əˈkɑːmplɪʃ/",
    meanings: [
      { pos: "vt.", defCn: "完成；达到；实现", examWeight: 5 },
    ],
    rootAffix: { root: "pl", rootMeaning: "填满", affixes: [{ part: "ac-", meaning: "朝向" }, { part: "com-", meaning: "完全" }], meaning: "ac-(朝向) + com-(完全) + pl(填满) → 完全填满 → 完成" },
    derivatives: [
      { word: "accomplishment", pos: "n.", defCn: "成就；完成" },
      { word: "accomplished", pos: "adj.", defCn: "有成就的；熟练的" },
    ],
    collocations: [
      { phrase: "accomplish a goal", meaning: "实现目标" },
      { phrase: "accomplish a task", meaning: "完成任务" },
    ],
    frequencyRank: 4,
    level: "high-freq",
    examples: [
      { sentence: "She accomplished her PhD in just three years.", translation: "她在短短三年内完成了博士学位。", source: "经典例句", difficulty: 2 },
    ],
  },
  {
    word: "account",
    phoneticUs: "/əˈkaʊnt/",
    meanings: [
      { pos: "n.", defCn: "账户；描述；解释", examWeight: 5 },
      { pos: "vi.", defCn: "解释；说明（account for）", examWeight: 5 },
    ],
    rootAffix: { root: "count", rootMeaning: "数/计算", affixes: [{ part: "ac-", meaning: "朝向" }], meaning: "ac-(朝向) + count(计算) → 计算 → 账目/说明" },
    derivatives: [
      { word: "accountable", pos: "adj.", defCn: "负有责任的" },
      { word: "accountant", pos: "n.", defCn: "会计师" },
    ],
    collocations: [
      { phrase: "account for", meaning: "解释；占（比例）" },
      { phrase: "take into account", meaning: "考虑到" },
      { phrase: "on account of", meaning: "由于" },
    ],
    frequencyRank: 5,
    level: "high-freq",
    examples: [
      { sentence: "How do you account for the sudden drop in sales?", translation: "你如何解释销量的突然下降？", source: "考研英语一 阅读", difficulty: 3 },
      { sentence: "The service sector accounts for over 70% of the GDP.", translation: "服务业占GDP的70%以上。", source: "考研英语二 阅读", difficulty: 2 },
    ],
  },
  {
    word: "acknowledge",
    phoneticUs: "/əkˈnɑːlɪdʒ/",
    meanings: [
      { pos: "vt.", defCn: "承认；确认收到；感谢", examWeight: 5 },
    ],
    rootAffix: { root: "know", rootMeaning: "知道", affixes: [{ part: "ac-", meaning: "加强" }], meaning: "ac-(加强) + knowledge(知识) → 使知道 → 承认" },
    derivatives: [
      { word: "acknowledgment", pos: "n.", defCn: "承认；确认；感谢" },
    ],
    collocations: [
      { phrase: "acknowledge the fact that", meaning: "承认...的事实" },
      { phrase: "It is widely acknowledged that", meaning: "人们普遍认为" },
    ],
    frequencyRank: 6,
    level: "high-freq",
    examples: [
      { sentence: "He finally acknowledged that he had made a mistake.", translation: "他终于承认自己犯了错误。", source: "考研英语一 完型", difficulty: 2 },
    ],
  },
  {
    word: "acquire",
    phoneticUs: "/əˈkwaɪər/",
    meanings: [
      { pos: "vt.", defCn: "获得；习得；收购", examWeight: 5 },
    ],
    rootAffix: { root: "quir", rootMeaning: "寻求", affixes: [{ part: "ac-", meaning: "朝向" }], meaning: "ac-(朝向) + quire(寻求) → 寻求得到 → 获得" },
    derivatives: [
      { word: "acquisition", pos: "n.", defCn: "获得；收购；习得" },
      { word: "acquisitive", pos: "adj.", defCn: "贪得无厌的" },
    ],
    collocations: [
      { phrase: "acquire knowledge", meaning: "获取知识" },
      { phrase: "acquire a company", meaning: "收购公司" },
    ],
    frequencyRank: 7,
    level: "high-freq",
    examples: [
      { sentence: "Children acquire language naturally through interaction.", translation: "儿童通过互动自然地习得语言。", source: "考研英语一 阅读", difficulty: 2 },
    ],
  },
  {
    word: "adequate",
    phoneticUs: "/ˈædɪkwət/",
    meanings: [
      { pos: "adj.", defCn: "足够的；适当的；胜任的", examWeight: 4 },
    ],
    rootAffix: { root: "equ", rootMeaning: "相等", affixes: [{ part: "ad-", meaning: "朝向" }], meaning: "ad-(朝向) + equ(相等) → 达到等同 → 足够的" },
    derivatives: [
      { word: "adequacy", pos: "n.", defCn: "足够；适当" },
      { word: "inadequate", pos: "adj.", defCn: "不充分的" },
    ],
    collocations: [
      { phrase: "adequate for", meaning: "对...足够" },
      { phrase: "adequate to", meaning: "胜任..." },
    ],
    frequencyRank: 8,
    level: "high-freq",
    examples: [
      { sentence: "The current safety measures are not adequate to prevent accidents.", translation: "目前的安全措施不足以预防事故。", source: "考研英语二 阅读", difficulty: 2 },
    ],
  },
  {
    word: "advocate",
    phoneticUs: "/ˈædvəkeɪt/",
    meanings: [
      { pos: "vt.", defCn: "提倡；主张；拥护", examWeight: 5 },
      { pos: "n.", defCn: "提倡者；支持者", examWeight: 4 },
    ],
    rootAffix: { root: "voc", rootMeaning: "声音/呼喊", affixes: [{ part: "ad-", meaning: "朝向" }], meaning: "ad-(朝向) + voc(呼喊) → 为某事呼喊 → 提倡" },
    derivatives: [
      { word: "advocacy", pos: "n.", defCn: "提倡；主张；辩护" },
    ],
    collocations: [
      { phrase: "advocate for", meaning: "为...提倡" },
      { phrase: "strong advocate", meaning: "坚定的支持者" },
    ],
    frequencyRank: 9,
    level: "high-freq",
    examples: [
      { sentence: "Many experts advocate a more balanced approach to education.", translation: "许多专家提倡更均衡的教育方式。", source: "考研英语一 阅读", difficulty: 2 },
    ],
  },
  {
    word: "alternative",
    phoneticUs: "/ɔːlˈtɜːrnətɪv/",
    meanings: [
      { pos: "n.", defCn: "替代选择；备选方案", examWeight: 5 },
      { pos: "adj.", defCn: "替代的；另类的", examWeight: 4 },
    ],
    rootAffix: { root: "alter", rootMeaning: "其他/改变", affixes: [], meaning: "alter(其他) + native → 其他的选择 → 替代方案" },
    derivatives: [
      { word: "alternatively", pos: "adv.", defCn: "或者；替代地" },
    ],
    collocations: [
      { phrase: "alternative energy", meaning: "替代能源" },
      { phrase: "have no alternative but to", meaning: "除了...别无选择" },
    ],
    frequencyRank: 10,
    level: "high-freq",
    examples: [
      { sentence: "We need to find alternative sources of energy.", translation: "我们需要找到替代能源。", source: "考研英语二 阅读", difficulty: 2 },
    ],
  },
  {
    word: "analyze",
    phoneticUs: "/ˈænəlaɪz/",
    meanings: [
      { pos: "vt.", defCn: "分析；解析", examWeight: 5 },
    ],
    rootAffix: { root: "ly", rootMeaning: "松/解开", affixes: [{ part: "ana-", meaning: "完全/向上" }], meaning: "ana-(完全) + lyze(解开) → 完全解开 → 分析" },
    derivatives: [
      { word: "analysis", pos: "n.", defCn: "分析" },
      { word: "analytical", pos: "adj.", defCn: "分析的；善于分析的" },
      { word: "analyst", pos: "n.", defCn: "分析者；分析师" },
    ],
    collocations: [
      { phrase: "analyze data", meaning: "分析数据" },
      { phrase: "in the final analysis", meaning: "归根结底" },
    ],
    frequencyRank: 11,
    level: "high-freq",
    examples: [
      { sentence: "Researchers analyzed the data from over 10,000 participants.", translation: "研究人员分析了一万多名参与者的数据。", source: "考研英语一 阅读", difficulty: 2 },
    ],
  },
  {
    word: "appeal",
    phoneticUs: "/əˈpiːl/",
    meanings: [
      { pos: "vi./n.", defCn: "呼吁；吸引；上诉", examWeight: 5 },
    ],
    rootAffix: { root: "peal", rootMeaning: "驱动/推", affixes: [{ part: "ap-", meaning: "朝向" }], meaning: "ap-(朝向) + peal(推动) → 推动某人 → 呼吁/吸引" },
    derivatives: [
      { word: "appealing", pos: "adj.", defCn: "吸引人的" },
    ],
    collocations: [
      { phrase: "appeal to", meaning: "吸引；呼吁" },
      { phrase: "appeal against", meaning: "对...提出上诉" },
      { phrase: "appeal for", meaning: "恳求" },
    ],
    frequencyRank: 12,
    level: "high-freq",
    examples: [
      { sentence: "The idea of working from home appeals to many young professionals.", translation: "在家工作的想法吸引了许多年轻专业人士。", source: "考研英语二 阅读", difficulty: 2 },
    ],
  },
  {
    word: "approach",
    phoneticUs: "/əˈproʊtʃ/",
    meanings: [
      { pos: "n.", defCn: "方法；途径；接近", examWeight: 5 },
      { pos: "v.", defCn: "接近；处理；接洽", examWeight: 4 },
    ],
    rootAffix: { root: "proach", rootMeaning: "近", affixes: [{ part: "ap-", meaning: "朝向" }], meaning: "ap-(朝向) + proach(近) → 向...靠近 → 接近/方法" },
    derivatives: [
      { word: "approachable", pos: "adj.", defCn: "可接近的；平易近人的" },
    ],
    collocations: [
      { phrase: "approach to", meaning: "处理...的方法" },
      { phrase: "a new approach", meaning: "新方法" },
    ],
    frequencyRank: 13,
    level: "high-freq",
    examples: [
      { sentence: "We need a different approach to solve this problem.", translation: "我们需要不同的方法来解决这个问题。", source: "考研英语一 阅读", difficulty: 1 },
    ],
  },
  {
    word: "assess",
    phoneticUs: "/əˈses/",
    meanings: [
      { pos: "vt.", defCn: "评估；评定；估算", examWeight: 5 },
    ],
    rootAffix: { root: "sess", rootMeaning: "坐", affixes: [{ part: "as-", meaning: "朝向" }], meaning: "as-(朝向) + sess(坐) → 坐下来判断 → 评估" },
    derivatives: [
      { word: "assessment", pos: "n.", defCn: "评估；评定" },
    ],
    collocations: [
      { phrase: "assess the impact", meaning: "评估影响" },
      { phrase: "assess the situation", meaning: "评估形势" },
    ],
    frequencyRank: 14,
    level: "high-freq",
    examples: [
      { sentence: "It's difficult to assess the long-term effects of the policy.", translation: "很难评估该政策的长期效果。", source: "考研英语一 阅读", difficulty: 2 },
    ],
  },
  {
    word: "assume",
    phoneticUs: "/əˈsuːm/",
    meanings: [
      { pos: "vt.", defCn: "假设；承担；呈现", examWeight: 5 },
    ],
    rootAffix: { root: "sum", rootMeaning: "拿/取", affixes: [{ part: "as-", meaning: "朝向" }], meaning: "as-(朝向) + sume(拿取) → 拿来作为前提 → 假设/承担" },
    derivatives: [
      { word: "assumption", pos: "n.", defCn: "假设；承担" },
    ],
    collocations: [
      { phrase: "assume responsibility", meaning: "承担责任" },
      { phrase: "It is assumed that", meaning: "人们认为..." },
    ],
    frequencyRank: 15,
    level: "high-freq",
    examples: [
      { sentence: "We cannot assume that all students have equal access to technology.", translation: "我们不能假设所有学生都能平等地获取技术。", source: "考研英语二 阅读", difficulty: 2 },
    ],
  },
  {
    word: "authority",
    phoneticUs: "/əˈθɔːrəti/",
    meanings: [
      { pos: "n.", defCn: "权威；权力；当局", examWeight: 5 },
    ],
    rootAffix: { root: "auth", rootMeaning: "创造/增加", affixes: [], meaning: "author(作者/创造者) + ity → 有创造权的人 → 权威" },
    derivatives: [
      { word: "authoritative", pos: "adj.", defCn: "权威的；命令式的" },
      { word: "authorize", pos: "vt.", defCn: "授权；批准" },
    ],
    collocations: [
      { phrase: "in authority", meaning: "掌权" },
      { phrase: "have the authority to", meaning: "有权做..." },
    ],
    frequencyRank: 16,
    level: "high-freq",
    examples: [
      { sentence: "The local authorities have approved the construction project.", translation: "地方当局已批准该建设项目。", source: "考研英语一 阅读", difficulty: 2 },
    ],
  },
  {
    word: "available",
    phoneticUs: "/əˈveɪləbl/",
    meanings: [
      { pos: "adj.", defCn: "可获得的；有空的；有效的", examWeight: 5 },
    ],
    rootAffix: { root: "vail", rootMeaning: "价值/力量", affixes: [{ part: "a-", meaning: "朝向" }], meaning: "a-(朝向) + vail(价值) → 有价值的 → 可用的" },
    derivatives: [
      { word: "availability", pos: "n.", defCn: "可获得性；有效性" },
    ],
    collocations: [
      { phrase: "available for", meaning: "可用于..." },
      { phrase: "make sth available", meaning: "使某物可获得" },
    ],
    frequencyRank: 17,
    level: "high-freq",
    examples: [
      { sentence: "The report is now available to the public.", translation: "该报告现已对公众开放。", source: "考研英语二 阅读", difficulty: 1 },
    ],
  },
  {
    word: "barrier",
    phoneticUs: "/ˈbæriər/",
    meanings: [
      { pos: "n.", defCn: "障碍；屏障；壁垒", examWeight: 5 },
    ],
    rootAffix: { root: "bar", rootMeaning: "棒/栏杆", affixes: [], meaning: "bar(栏杆) + rier → 障碍物 → 屏障/壁垒" },
    derivatives: [],
    collocations: [
      { phrase: "trade barrier", meaning: "贸易壁垒" },
      { phrase: "language barrier", meaning: "语言障碍" },
      { phrase: "break down barriers", meaning: "打破障碍" },
    ],
    frequencyRank: 18,
    level: "high-freq",
    examples: [
      { sentence: "Language barriers can hinder international communication.", translation: "语言障碍会阻碍国际交流。", source: "考研英语一 翻译", difficulty: 1 },
    ],
  },
  {
    word: "benefit",
    phoneticUs: "/ˈbenɪfɪt/",
    meanings: [
      { pos: "n.", defCn: "利益；好处；福利", examWeight: 5 },
      { pos: "v.", defCn: "有益于；受益", examWeight: 5 },
    ],
    rootAffix: { root: "bene", rootMeaning: "好", affixes: [{ part: "fit", meaning: "做" }], meaning: "bene(好) + fit(做) → 做好事 → 利益/有益" },
    derivatives: [
      { word: "beneficial", pos: "adj.", defCn: "有益的；有利的" },
      { word: "beneficiary", pos: "n.", defCn: "受益人" },
    ],
    collocations: [
      { phrase: "benefit from", meaning: "从...中受益" },
      { phrase: "for the benefit of", meaning: "为了...的利益" },
    ],
    frequencyRank: 19,
    level: "high-freq",
    examples: [
      { sentence: "Both countries will benefit from the trade agreement.", translation: "两国都将从贸易协定中受益。", source: "考研英语二 阅读", difficulty: 1 },
    ],
  },
  {
    word: "capable",
    phoneticUs: "/ˈkeɪpəbl/",
    meanings: [
      { pos: "adj.", defCn: "有能力的；能够的", examWeight: 4 },
    ],
    rootAffix: { root: "cap", rootMeaning: "拿/取", affixes: [], meaning: "cap(拿) + able(能) → 能拿住的 → 有能力的" },
    derivatives: [
      { word: "capability", pos: "n.", defCn: "能力；才能" },
      { word: "incapable", pos: "adj.", defCn: "无能力的" },
    ],
    collocations: [
      { phrase: "be capable of", meaning: "能够做..." },
      { phrase: "capable hands", meaning: "能手" },
    ],
    frequencyRank: 20,
    level: "high-freq",
    examples: [
      { sentence: "She is capable of handling complex negotiations.", translation: "她有能力处理复杂的谈判。", source: "经典例句", difficulty: 1 },
    ],
  },
  {
    word: "challenge",
    phoneticUs: "/ˈtʃælɪndʒ/",
    meanings: [
      { pos: "n.", defCn: "挑战；质疑", examWeight: 5 },
      { pos: "vt.", defCn: "向...挑战；质疑", examWeight: 4 },
    ],
    derivatives: [
      { word: "challenging", pos: "adj.", defCn: "具有挑战性的" },
    ],
    collocations: [
      { phrase: "face a challenge", meaning: "面临挑战" },
      { phrase: "challenge the view", meaning: "质疑观点" },
      { phrase: "meet the challenge", meaning: "迎接挑战" },
    ],
    frequencyRank: 21,
    level: "high-freq",
    examples: [
      { sentence: "Climate change poses a serious challenge to human survival.", translation: "气候变化对人类生存构成严重挑战。", source: "考研英语一 阅读", difficulty: 2 },
    ],
  },
  {
    word: "circumstance",
    phoneticUs: "/ˈsɜːrkəmstæns/",
    meanings: [
      { pos: "n.", defCn: "环境；情况；境遇", examWeight: 5 },
    ],
    rootAffix: { root: "circum", rootMeaning: "周围/环绕", affixes: [{ part: "stance", meaning: "站立" }], meaning: "circum(周围) + stance(站立) → 站在周围的东西 → 环境" },
    derivatives: [],
    collocations: [
      { phrase: "under/in no circumstances", meaning: "决不" },
      { phrase: "under the circumstances", meaning: "在这种情况下" },
    ],
    frequencyRank: 22,
    level: "high-freq",
    examples: [
      { sentence: "Under no circumstances should we give up hope.", translation: "我们决不应该放弃希望。", source: "考研英语一 完型", difficulty: 2 },
    ],
  },
  {
    word: "claim",
    phoneticUs: "/kleɪm/",
    meanings: [
      { pos: "vt./n.", defCn: "声称；要求；索赔", examWeight: 5 },
    ],
    rootAffix: { root: "claim", rootMeaning: "呼喊/叫", affixes: [], meaning: "claim(呼喊) → 大声说出 → 声称/要求" },
    derivatives: [
      { word: "disclaim", pos: "vt.", defCn: "否认；放弃" },
      { word: "reclaim", pos: "vt.", defCn: "回收；开垦" },
    ],
    collocations: [
      { phrase: "claim responsibility", meaning: "声称负责" },
      { phrase: "make a claim", meaning: "提出索赔/声明" },
    ],
    frequencyRank: 23,
    level: "high-freq",
    examples: [
      { sentence: "The company claims that its product is 100% natural.", translation: "该公司声称其产品是100%天然的。", source: "考研英语二 阅读", difficulty: 1 },
    ],
  },
  {
    word: "communicate",
    phoneticUs: "/kəˈmjuːnɪkeɪt/",
    meanings: [
      { pos: "v.", defCn: "交流；传达；沟通", examWeight: 5 },
    ],
    rootAffix: { root: "commun", rootMeaning: "共同/公共", affixes: [], meaning: "commun(共同) + icate → 使共同分享 → 交流/传达" },
    derivatives: [
      { word: "communication", pos: "n.", defCn: "交流；通讯" },
      { word: "communicative", pos: "adj.", defCn: "健谈的；交际的" },
    ],
    collocations: [
      { phrase: "communicate with", meaning: "与...交流" },
      { phrase: "communicate effectively", meaning: "有效沟通" },
    ],
    frequencyRank: 24,
    level: "high-freq",
    examples: [
      { sentence: "The ability to communicate effectively is essential in the workplace.", translation: "有效沟通的能力在职场中至关重要。", source: "考研英语二 阅读", difficulty: 1 },
    ],
  },
  {
    word: "community",
    phoneticUs: "/kəˈmjuːnəti/",
    meanings: [
      { pos: "n.", defCn: "社区；团体；社会", examWeight: 5 },
    ],
    rootAffix: { root: "commun", rootMeaning: "共同/公共", affixes: [], meaning: "commun(共同) + ity → 共同生活的地方 → 社区" },
    collocations: [
      { phrase: "international community", meaning: "国际社会" },
      { phrase: "scientific community", meaning: "科学界" },
    ],
    frequencyRank: 25,
    level: "high-freq",
    examples: [
      { sentence: "The local community has rallied together to support the victims.", translation: "当地社区团结起来支持受害者。", source: "考研英语一 阅读", difficulty: 1 },
    ],
  },
  {
    word: "concentrate",
    phoneticUs: "/ˈkɑːnsntreɪt/",
    meanings: [
      { pos: "v.", defCn: "集中；专注；浓缩", examWeight: 5 },
    ],
    rootAffix: { root: "centr", rootMeaning: "中心", affixes: [{ part: "con-", meaning: "共同" }], meaning: "con-(共同) + centr(中心) → 共同到中心 → 集中" },
    derivatives: [
      { word: "concentration", pos: "n.", defCn: "集中；专注；浓度" },
    ],
    collocations: [
      { phrase: "concentrate on", meaning: "专注于" },
    ],
    frequencyRank: 26,
    level: "high-freq",
    examples: [
      { sentence: "I can't concentrate on my work with all this noise.", translation: "这些噪音让我无法专注于工作。", source: "经典例句", difficulty: 1 },
    ],
  },
  {
    word: "concept",
    phoneticUs: "/ˈkɑːnsept/",
    meanings: [
      { pos: "n.", defCn: "概念；观念", examWeight: 5 },
    ],
    rootAffix: { root: "cept", rootMeaning: "拿/取", affixes: [{ part: "con-", meaning: "共同" }], meaning: "con-(共同) + cept(拿) → 共同持有的想法 → 概念" },
    derivatives: [
      { word: "conception", pos: "n.", defCn: "概念；构想；怀孕" },
      { word: "conceptual", pos: "adj.", defCn: "概念的" },
    ],
    collocations: [
      { phrase: "basic concept", meaning: "基本概念" },
    ],
    frequencyRank: 27,
    level: "high-freq",
    examples: [
      { sentence: "The concept of sustainable development has gained widespread acceptance.", translation: "可持续发展的概念已获得广泛接受。", source: "考研英语一 阅读", difficulty: 2 },
    ],
  },
  {
    word: "conduct",
    phoneticUs: "/kənˈdʌkt/",
    meanings: [
      { pos: "vt.", defCn: "进行；实施；指挥", examWeight: 5 },
      { pos: "n.", defCn: "行为；举止", examWeight: 3 },
    ],
    rootAffix: { root: "duct", rootMeaning: "引导", affixes: [{ part: "con-", meaning: "共同" }], meaning: "con-(共同) + duct(引导) → 引导大家 → 指挥/实施" },
    derivatives: [
      { word: "conductor", pos: "n.", defCn: "指挥；导体；售票员" },
      { word: "misconduct", pos: "n.", defCn: "不当行为" },
    ],
    collocations: [
      { phrase: "conduct research", meaning: "进行研究" },
      { phrase: "conduct an experiment", meaning: "进行实验" },
      { phrase: "code of conduct", meaning: "行为准则" },
    ],
    frequencyRank: 28,
    level: "high-freq",
    examples: [
      { sentence: "The university conducted a survey on student satisfaction.", translation: "该大学进行了一项学生满意度调查。", source: "考研英语一 阅读", difficulty: 2 },
    ],
  },
  {
    word: "consequence",
    phoneticUs: "/ˈkɑːnsɪkwens/",
    meanings: [
      { pos: "n.", defCn: "后果；结果；重要性", examWeight: 5 },
    ],
    rootAffix: { root: "sequ", rootMeaning: "跟随", affixes: [{ part: "con-", meaning: "共同" }], meaning: "con-(共同) + sequ(跟随) → 跟随发生的事情 → 后果" },
    derivatives: [
      { word: "consequently", pos: "adv.", defCn: "因此；结果" },
      { word: "consequential", pos: "adj.", defCn: "随之而来的；重要的" },
    ],
    collocations: [
      { phrase: "as a consequence", meaning: "因此" },
      { phrase: "face the consequences", meaning: "面对后果" },
    ],
    frequencyRank: 29,
    level: "high-freq",
    examples: [
      { sentence: "The economic crisis was a direct consequence of poor regulation.", translation: "经济危机是监管不力的直接后果。", source: "考研英语一 阅读", difficulty: 2 },
    ],
  },
  {
    word: "consume",
    phoneticUs: "/kənˈsuːm/",
    meanings: [
      { pos: "vt.", defCn: "消费；消耗；吞噬", examWeight: 5 },
    ],
    rootAffix: { root: "sum", rootMeaning: "拿/取", affixes: [{ part: "con-", meaning: "完全" }], meaning: "con-(完全) + sume(拿取) → 完全拿走 → 消费/消耗" },
    derivatives: [
      { word: "consumer", pos: "n.", defCn: "消费者" },
      { word: "consumption", pos: "n.", defCn: "消费；消耗" },
    ],
    collocations: [
      { phrase: "consume energy", meaning: "消耗能量" },
      { phrase: "consumer behavior", meaning: "消费者行为" },
    ],
    frequencyRank: 30,
    level: "high-freq",
    examples: [
      { sentence: "The device consumes very little electricity.", translation: "该设备耗电极少。", source: "考研英语二 阅读", difficulty: 1 },
    ],
  },
  {
    word: "contribute",
    phoneticUs: "/kənˈtrɪbjuːt/",
    meanings: [
      { pos: "v.", defCn: "贡献；捐献；导致（contribute to）", examWeight: 5 },
    ],
    rootAffix: { root: "tribut", rootMeaning: "给予/分配", affixes: [{ part: "con-", meaning: "共同" }], meaning: "con-(共同) + tribute(给予) → 共同给予 → 贡献" },
    derivatives: [
      { word: "contribution", pos: "n.", defCn: "贡献；捐献；稿件" },
      { word: "contributor", pos: "n.", defCn: "贡献者；投稿人" },
    ],
    collocations: [
      { phrase: "contribute to", meaning: "有助于；导致；捐献" },
      { phrase: "make a contribution", meaning: "做出贡献" },
    ],
    frequencyRank: 31,
    level: "high-freq",
    examples: [
      { sentence: "Regular exercise contributes to better mental health.", translation: "定期锻炼有助于改善心理健康。", source: "考研英语一 阅读", difficulty: 2 },
    ],
  },
  {
    word: "convince",
    phoneticUs: "/kənˈvɪns/",
    meanings: [
      { pos: "vt.", defCn: "说服；使确信", examWeight: 5 },
    ],
    rootAffix: { root: "vinc", rootMeaning: "征服/战胜", affixes: [{ part: "con-", meaning: "完全" }], meaning: "con-(完全) + vince(征服) → 完全征服 → 说服" },
    derivatives: [
      { word: "convincing", pos: "adj.", defCn: "令人信服的" },
      { word: "unconvinced", pos: "adj.", defCn: "不信服的" },
    ],
    collocations: [
      { phrase: "convince sb of sth", meaning: "使某人相信某事" },
      { phrase: "convince sb to do", meaning: "说服某人做" },
    ],
    frequencyRank: 32,
    level: "high-freq",
    examples: [
      { sentence: "The evidence convinced the jury of his innocence.", translation: "证据使陪审团相信他是无辜的。", source: "经典例句", difficulty: 2 },
    ],
  },
  {
    word: "corporation",
    phoneticUs: "/ˌkɔːrpəˈreɪʃn/",
    meanings: [
      { pos: "n.", defCn: "公司；企业；法人", examWeight: 4 },
    ],
    rootAffix: { root: "corp", rootMeaning: "身体/团体", affixes: [], meaning: "corp(团体) + oration → 法人团体 → 公司" },
    derivatives: [
      { word: "corporate", pos: "adj.", defCn: "公司的；法人的" },
    ],
    collocations: [
      { phrase: "multinational corporation", meaning: "跨国公司" },
    ],
    frequencyRank: 33,
    level: "high-freq",
    examples: [
      { sentence: "Large corporations are increasingly focused on sustainability.", translation: "大型企业越来越关注可持续发展。", source: "考研英语二 阅读", difficulty: 2 },
    ],
  },
  {
    word: "critical",
    phoneticUs: "/ˈkrɪtɪkl/",
    meanings: [
      { pos: "adj.", defCn: "批评的；关键的；危急的", examWeight: 5 },
    ],
    rootAffix: { root: "crit", rootMeaning: "判断", affixes: [], meaning: "crit(判断) + ical → 做出判断的 → 批评的/关键的" },
    derivatives: [
      { word: "criticize", pos: "vt.", defCn: "批评；评论" },
      { word: "criticism", pos: "n.", defCn: "批评；评论" },
      { word: "criterion", pos: "n.", defCn: "标准" },
    ],
    collocations: [
      { phrase: "critical thinking", meaning: "批判性思维" },
      { phrase: "be critical of", meaning: "对...持批评态度" },
      { phrase: "critical moment", meaning: "关键时刻" },
    ],
    frequencyRank: 34,
    level: "high-freq",
    examples: [
      { sentence: "Critical thinking is one of the most important skills in higher education.", translation: "批判性思维是高等教育中最重要的技能之一。", source: "考研英语一 阅读", difficulty: 2 },
    ],
  },
  {
    word: "culture",
    phoneticUs: "/ˈkʌltʃər/",
    meanings: [
      { pos: "n.", defCn: "文化；教养；培养", examWeight: 5 },
    ],
    rootAffix: { root: "cult", rootMeaning: "耕种/培养", affixes: [], meaning: "cult(培养) + ure → 培养出来的东西 → 文化" },
    derivatives: [
      { word: "cultural", pos: "adj.", defCn: "文化的" },
      { word: "multicultural", pos: "adj.", defCn: "多元文化的" },
    ],
    collocations: [
      { phrase: "corporate culture", meaning: "企业文化" },
      { phrase: "culture shock", meaning: "文化冲击" },
    ],
    frequencyRank: 35,
    level: "high-freq",
    examples: [
      { sentence: "Language is an essential part of a nation's culture.", translation: "语言是一个国家文化的重要组成部分。", source: "考研英语一 翻译", difficulty: 1 },
    ],
  },
  {
    word: "debate",
    phoneticUs: "/dɪˈbeɪt/",
    meanings: [
      { pos: "n./v.", defCn: "辩论；争论；讨论", examWeight: 5 },
    ],
    rootAffix: { root: "bat", rootMeaning: "打", affixes: [{ part: "de-", meaning: "向下" }], meaning: "de-(向下) + bate(打) → 打下去 → 辩论" },
    derivatives: [
      { word: "debatable", pos: "adj.", defCn: "有争议的" },
    ],
    collocations: [
      { phrase: "a heated debate", meaning: "激烈的辩论" },
      { phrase: "under debate", meaning: "在讨论中" },
    ],
    frequencyRank: 36,
    level: "high-freq",
    examples: [
      { sentence: "There is an ongoing debate about the future of education.", translation: "关于教育的未来存在持续的争论。", source: "考研英语二 阅读", difficulty: 2 },
    ],
  },
  {
    word: "decline",
    phoneticUs: "/dɪˈklaɪn/",
    meanings: [
      { pos: "vi./n.", defCn: "下降；衰退；拒绝", examWeight: 5 },
    ],
    rootAffix: { root: "clin", rootMeaning: "倾斜", affixes: [{ part: "de-", meaning: "向下" }], meaning: "de-(向下) + cline(倾斜) → 向下倾斜 → 下降/衰退" },
    collocations: [
      { phrase: "economic decline", meaning: "经济衰退" },
      { phrase: "decline an invitation", meaning: "拒绝邀请" },
    ],
    frequencyRank: 37,
    level: "high-freq",
    examples: [
      { sentence: "The population of the region has been in decline for decades.", translation: "该地区的人口几十年来一直在下降。", source: "考研英语一 阅读", difficulty: 2 },
    ],
  },
  {
    word: "define",
    phoneticUs: "/dɪˈfaɪn/",
    meanings: [
      { pos: "vt.", defCn: "定义；界定；明确", examWeight: 5 },
    ],
    rootAffix: { root: "fin", rootMeaning: "边界/结束", affixes: [{ part: "de-", meaning: "完全" }], meaning: "de-(完全) + fine(边界) → 划定边界 → 定义" },
    derivatives: [
      { word: "definition", pos: "n.", defCn: "定义；清晰度" },
      { word: "definite", pos: "adj.", defCn: "明确的；确定的" },
      { word: "indefinite", pos: "adj.", defCn: "不确定的；无限期的" },
    ],
    frequencyRank: 38,
    level: "high-freq",
    examples: [
      { sentence: "How do you define success in life?", translation: "你如何定义人生的成功？", source: "经典例句", difficulty: 1 },
    ],
  },
  {
    word: "demonstrate",
    phoneticUs: "/ˈdemənstreɪt/",
    meanings: [
      { pos: "vt.", defCn: "展示；证明；示威", examWeight: 5 },
    ],
    rootAffix: { root: "monstr", rootMeaning: "展示", affixes: [{ part: "de-", meaning: "完全" }], meaning: "de-(完全) + monstrate(展示) → 完全展示 → 证明/演示" },
    derivatives: [
      { word: "demonstration", pos: "n.", defCn: "展示；证明；示威游行" },
    ],
    collocations: [
      { phrase: "demonstrate the ability", meaning: "展示能力" },
      { phrase: "as demonstrated by", meaning: "正如...所证明的" },
    ],
    frequencyRank: 39,
    level: "high-freq",
    examples: [
      { sentence: "The experiment demonstrates the importance of regular practice.", translation: "这个实验证明了定期练习的重要性。", source: "考研英语一 阅读", difficulty: 2 },
    ],
  },
  {
    word: "despite",
    phoneticUs: "/dɪˈspaɪt/",
    meanings: [
      { pos: "prep.", defCn: "尽管；不管", examWeight: 5 },
    ],
    collocations: [
      { phrase: "despite the fact that", meaning: "尽管事实是..." },
      { phrase: "despite all odds", meaning: "尽管困难重重" },
    ],
    frequencyRank: 40,
    level: "high-freq",
    examples: [
      { sentence: "Despite the difficulties, the team managed to complete the project on time.", translation: "尽管困难重重，团队还是按时完成了项目。", source: "考研英语二 阅读", difficulty: 2 },
    ],
  },
  {
    word: "distinguish",
    phoneticUs: "/dɪˈstɪŋɡwɪʃ/",
    meanings: [
      { pos: "v.", defCn: "区分；辨别；使杰出", examWeight: 5 },
    ],
    rootAffix: { root: "sting", rootMeaning: "刺/分开", affixes: [{ part: "dis-", meaning: "分开" }], meaning: "dis-(分开) + stinguish(刺) → 用刺分开 → 区分" },
    derivatives: [
      { word: "distinguished", pos: "adj.", defCn: "杰出的；卓越的" },
      { word: "distinguishable", pos: "adj.", defCn: "可区分的" },
    ],
    collocations: [
      { phrase: "distinguish between", meaning: "区分...和..." },
      { phrase: "distinguish oneself", meaning: "使自己出众" },
    ],
    frequencyRank: 41,
    level: "high-freq",
    examples: [
      { sentence: "It's important to distinguish between facts and opinions.", translation: "区分事实和观点很重要。", source: "考研英语一 阅读", difficulty: 2 },
    ],
  },
  {
    word: "domestic",
    phoneticUs: "/dəˈmestɪk/",
    meanings: [
      { pos: "adj.", defCn: "国内的；家庭的；驯养的", examWeight: 5 },
    ],
    rootAffix: { root: "dom", rootMeaning: "家/房屋", affixes: [], meaning: "dom(家) + estic → 家的 → 国内的/家庭的" },
    derivatives: [],
    collocations: [
      { phrase: "domestic market", meaning: "国内市场" },
      { phrase: "domestic violence", meaning: "家庭暴力" },
      { phrase: "GDP (Gross Domestic Product)", meaning: "国内生产总值" },
    ],
    frequencyRank: 42,
    level: "high-freq",
    examples: [
      { sentence: "China's domestic market has enormous potential.", translation: "中国的国内市场潜力巨大。", source: "考研英语二 阅读", difficulty: 1 },
    ],
  },
  {
    word: "economy",
    phoneticUs: "/ɪˈkɑːnəmi/",
    meanings: [
      { pos: "n.", defCn: "经济；节约", examWeight: 5 },
    ],
    rootAffix: { root: "eco", rootMeaning: "家/环境", affixes: [{ part: "nomy", meaning: "管理" }], meaning: "eco(家) + nomy(管理) → 管理家务 → 经济/节约" },
    derivatives: [
      { word: "economic", pos: "adj.", defCn: "经济的" },
      { word: "economical", pos: "adj.", defCn: "节约的" },
      { word: "economics", pos: "n.", defCn: "经济学" },
    ],
    collocations: [
      { phrase: "market economy", meaning: "市场经济" },
      { phrase: "global economy", meaning: "全球经济" },
    ],
    frequencyRank: 43,
    level: "high-freq",
    examples: [
      { sentence: "The digital economy is growing at an unprecedented rate.", translation: "数字经济正以前所未有的速度增长。", source: "考研英语二 阅读", difficulty: 2 },
    ],
  },
  {
    word: "effective",
    phoneticUs: "/ɪˈfektɪv/",
    meanings: [
      { pos: "adj.", defCn: "有效的；实际的", examWeight: 5 },
    ],
    rootAffix: { root: "fect", rootMeaning: "做", affixes: [{ part: "ef-", meaning: "出" }], meaning: "ef-(出) + fect(做) + ive → 做出效果的 → 有效的" },
    derivatives: [
      { word: "effectiveness", pos: "n.", defCn: "有效性" },
      { word: "ineffective", pos: "adj.", defCn: "无效的" },
    ],
    collocations: [
      { phrase: "effective measures", meaning: "有效措施" },
      { phrase: "cost-effective", meaning: "合算的；性价比高的" },
    ],
    frequencyRank: 44,
    level: "high-freq",
    examples: [
      { sentence: "The new drug has proven effective against the virus.", translation: "新药已被证明对病毒有效。", source: "考研英语一 阅读", difficulty: 1 },
    ],
  },
  {
    word: "emerge",
    phoneticUs: "/iˈmɜːrdʒ/",
    meanings: [
      { pos: "vi.", defCn: "出现；浮现；暴露", examWeight: 5 },
    ],
    rootAffix: { root: "merg", rootMeaning: "沉/浸", affixes: [{ part: "e-", meaning: "出" }], meaning: "e-(出) + merge(沉入) → 从沉入中出来 → 浮现" },
    derivatives: [
      { word: "emergence", pos: "n.", defCn: "出现；兴起" },
      { word: "emergency", pos: "n.", defCn: "紧急情况" },
      { word: "emergent", pos: "adj.", defCn: "新兴的；紧急的" },
    ],
    frequencyRank: 45,
    level: "high-freq",
    examples: [
      { sentence: "New technologies are emerging at an accelerating pace.", translation: "新技术正以加速的节奏涌现。", source: "考研英语二 阅读", difficulty: 2 },
    ],
  },
  {
    word: "emphasize",
    phoneticUs: "/ˈemfəsaɪz/",
    meanings: [
      { pos: "vt.", defCn: "强调；着重", examWeight: 5 },
    ],
    rootAffix: { root: "pha", rootMeaning: "显示/出现", affixes: [{ part: "em-", meaning: "在...中" }], meaning: "em-(在...中) + phas(显示) → 在话语中显示 → 强调" },
    derivatives: [
      { word: "emphasis", pos: "n.", defCn: "强调；重点" },
      { word: "emphatic", pos: "adj.", defCn: "强调的；有力的" },
    ],
    collocations: [
      { phrase: "emphasize the importance of", meaning: "强调...的重要性" },
    ],
    frequencyRank: 46,
    level: "high-freq",
    examples: [
      { sentence: "The report emphasizes the need for immediate action on climate change.", translation: "报告强调了对气候变化采取立即行动的必要性。", source: "考研英语一 阅读", difficulty: 2 },
    ],
  },
  {
    word: "enable",
    phoneticUs: "/ɪˈneɪbl/",
    meanings: [
      { pos: "vt.", defCn: "使能够；使成为可能", examWeight: 5 },
    ],
    rootAffix: { root: "able", rootMeaning: "能够", affixes: [{ part: "en-", meaning: "使" }], meaning: "en-(使) + able(能够) → 使能够" },
    collocations: [
      { phrase: "enable sb to do", meaning: "使某人能够做" },
    ],
    frequencyRank: 47,
    level: "high-freq",
    examples: [
      { sentence: "Technology enables us to connect with people around the world.", translation: "技术使我们能够与世界各地的人联系。", source: "考研英语二 阅读", difficulty: 1 },
    ],
  },
  {
    word: "environment",
    phoneticUs: "/ɪnˈvaɪrənmənt/",
    meanings: [
      { pos: "n.", defCn: "环境；周围", examWeight: 5 },
    ],
    rootAffix: { root: "viron", rootMeaning: "环绕", affixes: [{ part: "en-", meaning: "在...中" }], meaning: "en-(在...中) + viron(环绕) + ment → 环绕着的东西 → 环境" },
    derivatives: [
      { word: "environmental", pos: "adj.", defCn: "环境的" },
    ],
    collocations: [
      { phrase: "working environment", meaning: "工作环境" },
      { phrase: "protect the environment", meaning: "保护环境" },
    ],
    frequencyRank: 48,
    level: "high-freq",
    examples: [
      { sentence: "We must take responsibility for protecting the environment.", translation: "我们必须承担保护环境的责任。", source: "考研英语一 阅读", difficulty: 1 },
    ],
  },
  {
    word: "establish",
    phoneticUs: "/ɪˈstæblɪʃ/",
    meanings: [
      { pos: "vt.", defCn: "建立；设立；确立", examWeight: 5 },
    ],
    rootAffix: { root: "sta", rootMeaning: "站立", affixes: [{ part: "e-", meaning: "出" }], meaning: "e-(出) + stabl(稳定) + ish → 使稳定出来 → 建立" },
    derivatives: [
      { word: "establishment", pos: "n.", defCn: "建立；机构" },
      { word: "established", pos: "adj.", defCn: "已建立的；确定的" },
    ],
    frequencyRank: 49,
    level: "high-freq",
    examples: [
      { sentence: "The company was established in 1998.", translation: "该公司成立于1998年。", source: "经典例句", difficulty: 1 },
    ],
  },
  {
    word: "evidence",
    phoneticUs: "/ˈevɪdəns/",
    meanings: [
      { pos: "n.", defCn: "证据；迹象", examWeight: 5 },
    ],
    rootAffix: { root: "vid", rootMeaning: "看", affixes: [{ part: "e-", meaning: "出" }], meaning: "e-(出) + vid(看) + ence → 看出来 → 证据" },
    derivatives: [
      { word: "evident", pos: "adj.", defCn: "明显的" },
      { word: "evidently", pos: "adv.", defCn: "显然地" },
    ],
    collocations: [
      { phrase: "scientific evidence", meaning: "科学证据" },
      { phrase: "There is evidence that", meaning: "有证据表明..." },
    ],
    frequencyRank: 50,
    level: "high-freq",
    examples: [
      { sentence: "There is growing evidence that exercise improves mental health.", translation: "越来越多的证据表明锻炼改善心理健康。", source: "考研英语一 阅读", difficulty: 2 },
    ],
  },
];

// Add more mid-frequency words
const midFreqWords: WordEntry[] = [
  {
    word: "fluctuate",
    phoneticUs: "/ˈflʌktʃueɪt/",
    meanings: [{ pos: "vi.", defCn: "波动；起伏；变动", examWeight: 4 }],
    rootAffix: { root: "fluctu", rootMeaning: "流动/波浪", affixes: [], meaning: "fluctu(波浪) + ate → 像波浪一样 → 波动" },
    derivatives: [{ word: "fluctuation", pos: "n.", defCn: "波动；起伏" }],
    collocations: [{ phrase: "fluctuate between", meaning: "在...之间波动" }],
    frequencyRank: 60, level: "mid-freq",
    examples: [{ sentence: "Stock prices fluctuate daily based on market conditions.", translation: "股票价格根据市场状况每天波动。", source: "考研英语二 阅读", difficulty: 2 }],
  },
  {
    word: "inevitable",
    phoneticUs: "/ɪnˈevɪtəbl/",
    meanings: [{ pos: "adj.", defCn: "不可避免的；必然的", examWeight: 4 }],
    rootAffix: { root: "evit", rootMeaning: "避免", affixes: [{ part: "in-", meaning: "不" }], meaning: "in-(不) + evitable(可避免的) → 不可避免的" },
    derivatives: [{ word: "inevitably", pos: "adv.", defCn: "不可避免地" }],
    frequencyRank: 61, level: "mid-freq",
    examples: [{ sentence: "Change is an inevitable part of life.", translation: "变化是生活中不可避免的一部分。", source: "经典例句", difficulty: 2 }],
  },
  {
    word: "justify",
    phoneticUs: "/ˈdʒʌstɪfaɪ/",
    meanings: [{ pos: "vt.", defCn: "证明…正当；为…辩护", examWeight: 4 }],
    rootAffix: { root: "just", rootMeaning: "正义/公正", affixes: [], meaning: "just(公正) + ify(使) → 使公正 → 证明正当" },
    derivatives: [{ word: "justification", pos: "n.", defCn: "正当理由；辩护" }, { word: "justifiable", pos: "adj.", defCn: "有理由的" }],
    collocations: [{ phrase: "justify oneself", meaning: "为自己辩护" }],
    frequencyRank: 62, level: "mid-freq",
    examples: [{ sentence: "How can you justify spending so much money on this project?", translation: "你如何为在这个项目上花这么多钱辩护？", source: "经典例句", difficulty: 2 }],
  },
  {
    word: "legislation",
    phoneticUs: "/ˌledʒɪsˈleɪʃn/",
    meanings: [{ pos: "n.", defCn: "立法；法律；法规", examWeight: 4 }],
    rootAffix: { root: "leg", rootMeaning: "法律", affixes: [], meaning: "leg(法律) + islation → 立法" },
    derivatives: [{ word: "legislative", pos: "adj.", defCn: "立法的" }, { word: "legislature", pos: "n.", defCn: "立法机关" }],
    collocations: [{ phrase: "pass legislation", meaning: "通过立法" }],
    frequencyRank: 63, level: "mid-freq",
    examples: [{ sentence: "New legislation has been introduced to protect consumers' rights.", translation: "已引入新的立法来保护消费者权益。", source: "考研英语一 阅读", difficulty: 3 }],
  },
  {
    word: "mechanism",
    phoneticUs: "/ˈmekənɪzəm/",
    meanings: [{ pos: "n.", defCn: "机制；机械装置；方法", examWeight: 4 }],
    rootAffix: { root: "mechan", rootMeaning: "机器", affixes: [], meaning: "mechan(机器) + ism → 机械结构 → 机制" },
    derivatives: [{ word: "mechanical", pos: "adj.", defCn: "机械的" }, { word: "mechanic", pos: "n.", defCn: "机械师" }],
    frequencyRank: 64, level: "mid-freq",
    examples: [{ sentence: "The body has a natural defense mechanism against infections.", translation: "人体有对抗感染的天然防御机制。", source: "考研英语一 阅读", difficulty: 2 }],
  },
  {
    word: "negotiate",
    phoneticUs: "/nɪˈɡoʊʃieɪt/",
    meanings: [{ pos: "v.", defCn: "谈判；协商；商定", examWeight: 4 }],
    rootAffix: { root: "neg", rootMeaning: "否定/没有", affixes: [], meaning: "neg(不) + oti + ate → 不是休闲的 → 谈判" },
    derivatives: [{ word: "negotiation", pos: "n.", defCn: "谈判；协商" }],
    frequencyRank: 65, level: "mid-freq",
    examples: [{ sentence: "The union is negotiating with management for better working conditions.", translation: "工会正在与管理层谈判改善工作条件。", source: "考研英语二 阅读", difficulty: 2 }],
  },
  {
    word: "perspective",
    phoneticUs: "/pərˈspektɪv/",
    meanings: [{ pos: "n.", defCn: "观点；视角；透视", examWeight: 5 }],
    rootAffix: { root: "spect", rootMeaning: "看", affixes: [{ part: "per-", meaning: "穿过" }], meaning: "per-(穿过) + spect(看) + ive → 看穿 → 视角/观点" },
    collocations: [{ phrase: "from a ... perspective", meaning: "从...角度看" }, { phrase: "broaden one's perspective", meaning: "开阔视野" }],
    frequencyRank: 66, level: "mid-freq",
    examples: [{ sentence: "From a historical perspective, this event was inevitable.", translation: "从历史角度看，这一事件是不可避免的。", source: "考研英语一 阅读", difficulty: 2 }],
  },
  {
    word: "phenomenon",
    phoneticUs: "/fɪˈnɑːmɪnən/",
    meanings: [{ pos: "n.", defCn: "现象；奇迹", examWeight: 4 }],
    rootAffix: { root: "pheno", rootMeaning: "显现/出现", affixes: [], meaning: "pheno(显现) + menon → 显现出来的东西 → 现象" },
    derivatives: [{ word: "phenomenal", pos: "adj.", defCn: "非凡的；现象的" }],
    frequencyRank: 67, level: "mid-freq",
    examples: [{ sentence: "Globalization is a complex phenomenon that affects every aspect of our lives.", translation: "全球化是一个复杂的现象，影响着我们生活的方方面面。", source: "考研英语二 阅读", difficulty: 3 }],
  },
  {
    word: "priority",
    phoneticUs: "/praɪˈɔːrəti/",
    meanings: [{ pos: "n.", defCn: "优先；优先事项", examWeight: 4 }],
    rootAffix: { root: "prior", rootMeaning: "在前/优先", affixes: [], meaning: "prior(在前) + ity → 优先" },
    derivatives: [{ word: "prioritize", pos: "vt.", defCn: "优先考虑；排序" }],
    collocations: [{ phrase: "give priority to", meaning: "优先考虑" }, { phrase: "top priority", meaning: "重中之重" }],
    frequencyRank: 68, level: "mid-freq",
    examples: [{ sentence: "Education should be a top priority for any government.", translation: "教育应是任何政府的首要任务。", source: "考研英语一 阅读", difficulty: 2 }],
  },
  {
    word: "psychology",
    phoneticUs: "/saɪˈkɑːlədʒi/",
    meanings: [{ pos: "n.", defCn: "心理学；心理", examWeight: 4 }],
    rootAffix: { root: "psycho", rootMeaning: "心灵/精神", affixes: [{ part: "logy", meaning: "学科" }], meaning: "psycho(心灵) + logy(学科) → 心理学" },
    derivatives: [{ word: "psychological", pos: "adj.", defCn: "心理的" }, { word: "psychologist", pos: "n.", defCn: "心理学家" }],
    frequencyRank: 69, level: "mid-freq",
    examples: [{ sentence: "Color psychology suggests that blue has a calming effect.", translation: "色彩心理学表明蓝色有镇静作用。", source: "考研英语一 阅读", difficulty: 2 }],
  },
  {
    word: "restrict",
    phoneticUs: "/rɪˈstrɪkt/",
    meanings: [{ pos: "vt.", defCn: "限制；约束；限定", examWeight: 4 }],
    rootAffix: { root: "strict", rootMeaning: "拉紧", affixes: [{ part: "re-", meaning: "回/再次" }], meaning: "re-(回) + strict(拉紧) → 拉回来 → 限制" },
    derivatives: [{ word: "restriction", pos: "n.", defCn: "限制；约束" }, { word: "restrictive", pos: "adj.", defCn: "限制性的" }],
    frequencyRank: 70, level: "mid-freq",
    examples: [{ sentence: "The new law restricts the sale of tobacco to minors.", translation: "新法限制向未成年人出售烟草。", source: "考研英语二 阅读", difficulty: 2 }],
  },
  {
    word: "revolution",
    phoneticUs: "/ˌrevəˈluːʃn/",
    meanings: [{ pos: "n.", defCn: "革命；变革；旋转", examWeight: 4 }],
    rootAffix: { root: "volu", rootMeaning: "转/滚", affixes: [{ part: "re-", meaning: "回/重新" }], meaning: "re-(回) + volu(转) + tion → 翻转过来 → 革命" },
    derivatives: [{ word: "revolutionary", pos: "adj.", defCn: "革命性的" }],
    collocations: [{ phrase: "Industrial Revolution", meaning: "工业革命" }, { phrase: "digital revolution", meaning: "数字革命" }],
    frequencyRank: 71, level: "mid-freq",
    examples: [{ sentence: "The digital revolution has transformed the way we communicate.", translation: "数字革命已经改变了我们沟通的方式。", source: "考研英语二 阅读", difficulty: 2 }],
  },
  {
    word: "species",
    phoneticUs: "/ˈspiːʃiːz/",
    meanings: [{ pos: "n.", defCn: "物种；种类", examWeight: 4 }],
    rootAffix: { root: "spec", rootMeaning: "看/种类", affixes: [], meaning: "spec(种类) + ies → 物种" },
    collocations: [{ phrase: "endangered species", meaning: "濒危物种" }],
    frequencyRank: 72, level: "mid-freq",
    examples: [{ sentence: "Hundreds of species become extinct every year due to habitat loss.", translation: "每年有数百个物种因栖息地丧失而灭绝。", source: "考研英语一 阅读", difficulty: 2 }],
  },
  {
    word: "strategy",
    phoneticUs: "/ˈstrætədʒi/",
    meanings: [{ pos: "n.", defCn: "策略；战略", examWeight: 5 }],
    rootAffix: { root: "strat", rootMeaning: "军队/层", affixes: [], meaning: "strat(军队) + egy → 军事指挥 → 战略" },
    derivatives: [{ word: "strategic", pos: "adj.", defCn: "战略的；策略的" }],
    frequencyRank: 73, level: "mid-freq",
    examples: [{ sentence: "The company needs to develop a new marketing strategy.", translation: "公司需要制定新的营销策略。", source: "考研英语二 阅读", difficulty: 2 }],
  },
  {
    word: "sufficient",
    phoneticUs: "/səˈfɪʃnt/",
    meanings: [{ pos: "adj.", defCn: "足够的；充分的", examWeight: 4 }],
    rootAffix: { root: "fic", rootMeaning: "做", affixes: [{ part: "suf-", meaning: "下面" }], meaning: "suf-(在下面) + fic(做) + ient → 在下面做的 → 足够的支撑 → 充分的" },
    derivatives: [{ word: "sufficiency", pos: "n.", defCn: "充足" }, { word: "insufficient", pos: "adj.", defCn: "不足的" }],
    frequencyRank: 74, level: "mid-freq",
    examples: [{ sentence: "The evidence is not sufficient to prove his guilt.", translation: "证据不足以证明他有罪。", source: "经典例句", difficulty: 2 }],
  },
  {
    word: "survive",
    phoneticUs: "/sərˈvaɪv/",
    meanings: [{ pos: "v.", defCn: "幸存；生存；比...活得长", examWeight: 4 }],
    rootAffix: { root: "viv", rootMeaning: "活/生命", affixes: [{ part: "sur-", meaning: "超过/上面" }], meaning: "sur-(超过) + vive(活) → 活得超过 → 幸存" },
    derivatives: [{ word: "survival", pos: "n.", defCn: "幸存；生存" }, { word: "survivor", pos: "n.", defCn: "幸存者" }],
    frequencyRank: 75, level: "mid-freq",
    examples: [{ sentence: "Only a few species can survive in such extreme conditions.", translation: "只有少数物种能在如此极端的环境下生存。", source: "考研英语一 阅读", difficulty: 2 }],
  },
  {
    word: "sustainable",
    phoneticUs: "/səˈsteɪnəbl/",
    meanings: [{ pos: "adj.", defCn: "可持续的；可支撑的", examWeight: 5 }],
    rootAffix: { root: "tain", rootMeaning: "保持/持有", affixes: [{ part: "sus-", meaning: "下面" }], meaning: "sus-(在下面) + tain(保持) + able → 能从下面支撑的 → 可持续的" },
    derivatives: [{ word: "sustainability", pos: "n.", defCn: "可持续性" }],
    collocations: [{ phrase: "sustainable development", meaning: "可持续发展" }],
    frequencyRank: 76, level: "mid-freq",
    examples: [{ sentence: "Sustainable development is crucial for the future of our planet.", translation: "可持续发展对我们星球的未来至关重要。", source: "考研英语一 阅读", difficulty: 2 }],
  },
  {
    word: "transform",
    phoneticUs: "/trænsˈfɔːrm/",
    meanings: [{ pos: "vt.", defCn: "转变；改造；转换", examWeight: 4 }],
    rootAffix: { root: "form", rootMeaning: "形状/形式", affixes: [{ part: "trans-", meaning: "跨越/转变" }], meaning: "trans-(转变) + form(形状) → 改变形状 → 转变" },
    derivatives: [{ word: "transformation", pos: "n.", defCn: "转变；改造" }],
    frequencyRank: 77, level: "mid-freq",
    examples: [{ sentence: "Technology has transformed every aspect of modern life.", translation: "技术已经改变了现代生活的方方面面。", source: "考研英语二 阅读", difficulty: 2 }],
  },
  {
    word: "trend",
    phoneticUs: "/trend/",
    meanings: [{ pos: "n.", defCn: "趋势；潮流；走向", examWeight: 4 }],
    collocations: [{ phrase: "economic trend", meaning: "经济趋势" }, { phrase: "follow the trend", meaning: "跟随潮流" }],
    frequencyRank: 78, level: "mid-freq",
    examples: [{ sentence: "There is a growing trend towards remote working.", translation: "远程工作的趋势日益增长。", source: "考研英语二 阅读", difficulty: 1 }],
  },
  {
    word: "ultimate",
    phoneticUs: "/ˈʌltɪmət/",
    meanings: [{ pos: "adj.", defCn: "最终的；终极的；根本的", examWeight: 4 }],
    rootAffix: { root: "ultim", rootMeaning: "最后/最远", affixes: [], meaning: "ultim(最远) + ate → 最终的" },
    derivatives: [{ word: "ultimately", pos: "adv.", defCn: "最终；根本上" }],
    frequencyRank: 79, level: "mid-freq",
    examples: [{ sentence: "The ultimate goal of education is to cultivate independent thinkers.", translation: "教育的最终目标是培养独立思考者。", source: "考研英语一 阅读", difficulty: 2 }],
  },
  {
    word: "valid",
    phoneticUs: "/ˈvælɪd/",
    meanings: [{ pos: "adj.", defCn: "有效的；合理的；有根据的", examWeight: 4 }],
    rootAffix: { root: "val", rootMeaning: "力量/价值", affixes: [], meaning: "val(价值) + id → 有价值的 → 有效的" },
    derivatives: [{ word: "validity", pos: "n.", defCn: "有效性；合法性" }, { word: "invalid", pos: "adj.", defCn: "无效的" }],
    frequencyRank: 80, level: "mid-freq",
    examples: [{ sentence: "This ticket is valid for three months.", translation: "这张票有效期为三个月。", source: "经典例句", difficulty: 1 }],
  },
];

// Add more low-frequency words
const lowFreqWords: WordEntry[] = [
  {
    word: "ambiguous",
    phoneticUs: "/æmˈbɪɡjuəs/",
    meanings: [{ pos: "adj.", defCn: "模糊的；模棱两可的；含糊不清的", examWeight: 3 }],
    rootAffix: { root: "ambi", rootMeaning: "两/两边", affixes: [], meaning: "ambi(两边) + guous → 两边都可以走 → 模棱两可的" },
    derivatives: [{ word: "ambiguity", pos: "n.", defCn: "模糊；歧义" }],
    frequencyRank: 120, level: "low-freq",
    examples: [{ sentence: "The contract contains some ambiguous clauses.", translation: "合同包含一些模棱两可的条款。", source: "考研英语一 阅读", difficulty: 3 }],
  },
  {
    word: "coincidence",
    phoneticUs: "/koʊˈɪnsɪdəns/",
    meanings: [{ pos: "n.", defCn: "巧合；同时发生", examWeight: 3 }],
    rootAffix: { root: "cid", rootMeaning: "落下/发生", affixes: [{ part: "co-", meaning: "共同" }, { part: "in-", meaning: "在...上" }], meaning: "co-(共同) + in(在) + cid(发生) → 共同发生 → 巧合" },
    collocations: [{ phrase: "pure coincidence", meaning: "纯属巧合" }],
    frequencyRank: 121, level: "low-freq",
    examples: [{ sentence: "It's no coincidence that the best students also read the most.", translation: "最好的学生也是读书最多的，这并非巧合。", source: "经典例句", difficulty: 2 }],
  },
  {
    word: "dilemma",
    phoneticUs: "/dɪˈlemə/",
    meanings: [{ pos: "n.", defCn: "困境；进退两难", examWeight: 3 }],
    rootAffix: { root: "lemma", rootMeaning: "假设/前提", affixes: [{ part: "di-", meaning: "二" }], meaning: "di-(二) + lemma(假设) → 两个假设之间 → 进退两难" },
    frequencyRank: 122, level: "low-freq",
    examples: [{ sentence: "The doctor faced an ethical dilemma.", translation: "医生面临道德困境。", source: "考研英语一 阅读", difficulty: 3 }],
  },
  {
    word: "endeavor",
    phoneticUs: "/ɪnˈdevər/",
    meanings: [{ pos: "n./vi.", defCn: "努力；尽力；尝试", examWeight: 3 }],
    frequencyRank: 123, level: "low-freq",
    examples: [{ sentence: "In spite of our best endeavors, we failed to meet the deadline.", translation: "尽管我们尽了最大努力，还是没能按时完成。", source: "考研英语一 阅读", difficulty: 3 }],
  },
  {
    word: "friction",
    phoneticUs: "/ˈfrɪkʃn/",
    meanings: [{ pos: "n.", defCn: "摩擦；冲突；不和", examWeight: 3 }],
    derivatives: [{ word: "frictional", pos: "adj.", defCn: "摩擦的" }],
    frequencyRank: 124, level: "low-freq",
    examples: [{ sentence: "There is a certain amount of friction between the two departments.", translation: "两个部门之间存在一定的摩擦。", source: "考研英语二 阅读", difficulty: 2 }],
  },
  {
    word: "hierarchy",
    phoneticUs: "/ˈhaɪərɑːrki/",
    meanings: [{ pos: "n.", defCn: "等级制度；层级；层次", examWeight: 3 }],
    rootAffix: { root: "hier", rootMeaning: "神圣", affixes: [], meaning: "hier(神圣) + archy(统治) → 神职人员的统治等级 → 等级制度" },
    derivatives: [{ word: "hierarchical", pos: "adj.", defCn: "等级制度的" }],
    frequencyRank: 125, level: "low-freq",
    examples: [{ sentence: "The company has a rigid hierarchy.", translation: "该公司有着严格的等级制度。", source: "经典例句", difficulty: 2 }],
  },
  {
    word: "inflation",
    phoneticUs: "/ɪnˈfleɪʃn/",
    meanings: [{ pos: "n.", defCn: "通货膨胀；膨胀", examWeight: 3 }],
    rootAffix: { root: "flat", rootMeaning: "吹/膨胀", affixes: [{ part: "in-", meaning: "进入" }], meaning: "in-(进入) + flat(吹) + ion → 吹进去 → 膨胀" },
    frequencyRank: 126, level: "low-freq",
    examples: [{ sentence: "The government is taking measures to control inflation.", translation: "政府正在采取措施控制通货膨胀。", source: "考研英语二 阅读", difficulty: 2 }],
  },
  {
    word: "legitimate",
    phoneticUs: "/lɪˈdʒɪtɪmət/",
    meanings: [{ pos: "adj.", defCn: "合法的；正当的；合理的", examWeight: 3 }],
    rootAffix: { root: "leg", rootMeaning: "法律", affixes: [], meaning: "leg(法律) + itimate → 法律的 → 合法的" },
    collocations: [{ phrase: "legitimate concern", meaning: "合理的担忧" }],
    frequencyRank: 127, level: "low-freq",
    examples: [{ sentence: "The government has a legitimate interest in protecting public health.", translation: "政府在保护公众健康方面有正当利益。", source: "考研英语一 阅读", difficulty: 3 }],
  },
  {
    word: "momentum",
    phoneticUs: "/moʊˈmentəm/",
    meanings: [{ pos: "n.", defCn: "势头；动力；动量", examWeight: 3 }],
    collocations: [{ phrase: "gain momentum", meaning: "获得动力/势头增长" }],
    frequencyRank: 128, level: "low-freq",
    examples: [{ sentence: "The campaign has gained momentum in recent weeks.", translation: "该运动在最近几周势头增长。", source: "考研英语二 阅读", difficulty: 2 }],
  },
  {
    word: "prejudice",
    phoneticUs: "/ˈpredʒudɪs/",
    meanings: [{ pos: "n.", defCn: "偏见；歧视；成见", examWeight: 3 }],
    rootAffix: { root: "jud", rootMeaning: "判断", affixes: [{ part: "pre-", meaning: "之前" }], meaning: "pre-(之前) + jud(判断) + ice → 提前判断 → 偏见" },
    collocations: [{ phrase: "racial prejudice", meaning: "种族偏见" }, { phrase: "without prejudice", meaning: "不带偏见" }],
    frequencyRank: 129, level: "low-freq",
    examples: [{ sentence: "Pride and Prejudice is a classic novel by Jane Austen.", translation: "《傲慢与偏见》是简·奥斯汀的经典小说。", source: "经典例句", difficulty: 1 }],
  },
];

// Add more core words
const coreWords: WordEntry[] = [
  {
    word: "resilience",
    phoneticUs: "/rɪˈzɪliəns/",
    meanings: [{ pos: "n.", defCn: "韧性；复原力；适应力", examWeight: 5 }],
    rootAffix: { root: "sili", rootMeaning: "跳", affixes: [{ part: "re-", meaning: "回" }], meaning: "re-(回) + sili(跳) + ence → 跳回来 → 韧性" },
    derivatives: [{ word: "resilient", pos: "adj.", defCn: "有韧性的；能复原的" }],
    frequencyRank: 200, level: "core",
    examples: [{ sentence: "The economy has shown remarkable resilience after the crisis.", translation: "危机后经济展现出非凡的韧性。", source: "考研英语一 阅读", difficulty: 3 }],
  },
  {
    word: "artificial",
    phoneticUs: "/ˌɑːrtɪˈfɪʃl/",
    meanings: [{ pos: "adj.", defCn: "人工的；人造的；虚假的", examWeight: 5 }],
    rootAffix: { root: "art", rootMeaning: "技艺/技巧", affixes: [], meaning: "art(技艺) + ficial → 用技艺做的 → 人工的" },
    collocations: [{ phrase: "artificial intelligence", meaning: "人工智能" }],
    frequencyRank: 201, level: "core",
    examples: [{ sentence: "Artificial intelligence is reshaping every industry.", translation: "人工智能正在重塑每个行业。", source: "考研英语二 阅读", difficulty: 2 }],
  },
  {
    word: "bias",
    phoneticUs: "/ˈbaɪəs/",
    meanings: [{ pos: "n.", defCn: "偏见；偏向；偏差", examWeight: 4 }],
    collocations: [{ phrase: "confirmation bias", meaning: "确认偏误" }, { phrase: "unconscious bias", meaning: "无意识偏见" }],
    frequencyRank: 202, level: "core",
    examples: [{ sentence: "The research was criticized for its selection bias.", translation: "该研究因其选择偏差而受到批评。", source: "考研英语一 阅读", difficulty: 3 }],
  },
  {
    word: "cognitive",
    phoneticUs: "/ˈkɑːɡnətɪv/",
    meanings: [{ pos: "adj.", defCn: "认知的；认识的", examWeight: 5 }],
    rootAffix: { root: "cogn", rootMeaning: "知道/认识", affixes: [], meaning: "cogn(知道) + itive → 认知的" },
    derivatives: [{ word: "cognition", pos: "n.", defCn: "认知；认识" }],
    collocations: [{ phrase: "cognitive science", meaning: "认知科学" }, { phrase: "cognitive ability", meaning: "认知能力" }],
    frequencyRank: 203, level: "core",
    examples: [{ sentence: "Cognitive decline is a major concern for the aging population.", translation: "认知衰退是老龄化人口的主要关切。", source: "考研英语一 阅读", difficulty: 3 }],
  },
  {
    word: "diversity",
    phoneticUs: "/daɪˈvɜːrsəti/",
    meanings: [{ pos: "n.", defCn: "多样性；差异性", examWeight: 5 }],
    rootAffix: { root: "vers", rootMeaning: "转", affixes: [{ part: "di-", meaning: "分开" }], meaning: "di-(分开) + vers(转) + ity → 转向不同方向 → 多样性" },
    derivatives: [{ word: "diverse", pos: "adj.", defCn: "多样的；不同的" }],
    frequencyRank: 204, level: "core",
    examples: [{ sentence: "Cultural diversity is one of our greatest strengths.", translation: "文化多样性是我们最大的优势之一。", source: "考研英语一 阅读", difficulty: 2 }],
  },
  {
    word: "ethics",
    phoneticUs: "/ˈeθɪks/",
    meanings: [{ pos: "n.", defCn: "伦理学；道德规范", examWeight: 4 }],
    derivatives: [{ word: "ethical", pos: "adj.", defCn: "伦理的；道德的" }],
    frequencyRank: 205, level: "core",
    examples: [{ sentence: "The ethics of genetic engineering is a hotly debated topic.", translation: "基因工程的伦理是一个激烈争论的话题。", source: "考研英语一 阅读", difficulty: 3 }],
  },
  {
    word: "innovation",
    phoneticUs: "/ˌɪnəˈveɪʃn/",
    meanings: [{ pos: "n.", defCn: "创新；革新；新方法", examWeight: 5 }],
    rootAffix: { root: "nov", rootMeaning: "新", affixes: [{ part: "in-", meaning: "进入" }], meaning: "in-(进入) + nov(新) + ation → 引入新东西 → 创新" },
    derivatives: [{ word: "innovative", pos: "adj.", defCn: "创新的；革新的" }, { word: "innovator", pos: "n.", defCn: "创新者" }],
    frequencyRank: 206, level: "core",
    examples: [{ sentence: "Innovation is the key driver of economic growth.", translation: "创新是经济增长的关键驱动力。", source: "考研英语二 阅读", difficulty: 2 }],
  },
  {
    word: "paradigm",
    phoneticUs: "/ˈpærədaɪm/",
    meanings: [{ pos: "n.", defCn: "范式；典范；模式", examWeight: 4 }],
    collocations: [{ phrase: "paradigm shift", meaning: "范式转变" }],
    frequencyRank: 207, level: "core",
    examples: [{ sentence: "The internet has caused a paradigm shift in the way we access information.", translation: "互联网引发了信息获取方式的范式转变。", source: "考研英语一 阅读", difficulty: 3 }],
  },
  {
    word: "rational",
    phoneticUs: "/ˈræʃənəl/",
    meanings: [{ pos: "adj.", defCn: "理性的；合理的", examWeight: 4 }],
    rootAffix: { root: "rat", rootMeaning: "计算/推理", affixes: [], meaning: "rat(推理) + ional → 推理的 → 理性的" },
    derivatives: [{ word: "irrational", pos: "adj.", defCn: "非理性的" }, { word: "rationality", pos: "n.", defCn: "理性" }],
    frequencyRank: 208, level: "core",
    examples: [{ sentence: "We need to take a more rational approach to this problem.", translation: "我们需要以更理性的方式处理这个问题。", source: "考研英语一 阅读", difficulty: 2 }],
  },
  {
    word: "skeptical",
    phoneticUs: "/ˈskeptɪkl/",
    meanings: [{ pos: "adj.", defCn: "怀疑的；不相信的", examWeight: 4 }],
    rootAffix: { root: "skept", rootMeaning: "思考/审视", affixes: [], meaning: "skept(审视) + ical → 审视的 → 怀疑的" },
    derivatives: [{ word: "skepticism", pos: "n.", defCn: "怀疑论；怀疑态度" }],
    collocations: [{ phrase: "be skeptical about/of", meaning: "对...持怀疑态度" }],
    frequencyRank: 209, level: "core",
    examples: [{ sentence: "Many scientists remain skeptical about the claims.", translation: "许多科学家对这些说法仍持怀疑态度。", source: "考研英语一 阅读", difficulty: 2 }],
  },
];

// Write the expanded words
const wordsDir = path.join(__dirname, 'words');

function appendToFile(filename: string, words: WordEntry[]) {
  const filePath = path.join(wordsDir, filename);
  const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const merged = [...existing, ...words];
  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
  console.log(`  ${filename}: ${existing.length} → ${merged.length} words`);
}

console.log('\nExpanding vocabulary data...\n');
appendToFile('high-frequency.json', highFreqWords);
appendToFile('mid-frequency.json', midFreqWords);
appendToFile('low-frequency.json', lowFreqWords);
appendToFile('core.json', coreWords);

const allFiles = fs.readdirSync(wordsDir).filter(f => f.endsWith('.json'));
let total = 0;
for (const file of allFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(wordsDir, file), 'utf-8'));
  total += data.length;
}
console.log(`\nTotal words across all files: ${total}`);
console.log('\nNext step: run "cd data && npm run seed" to reseed the database');
