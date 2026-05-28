/**
 * 考研 5500 大纲词库构建脚本
 * 数据源：
 *   1. NETEMVocabulary — 5530 词 + 词频排序
 *   2. beichenglangzi/dict (KaoYan_2) — 4533 词 + 音标/例句/短语
 *
 * 用法: npx ts-node build-vocabulary.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface NetemWord {
  序号: number;
  词频: number;
  单词: string;
  释义: string;
  其他拼写: string | null;
}

interface DictSentence {
  sContent: string;
  sCn: string;
}

interface DictPhrase {
  pContent: string;
  pCn: string;
}

interface DictWordContent {
  word: {
    wordHead: string;
    content: {
      usphone?: string;
      ukphone?: string;
      sentence?: { sentences?: DictSentence[]; desc?: string };
      phrase?: { phrases?: DictPhrase[]; desc?: string };
      star?: number;
      tran?: { tranCn?: string; pos?: string }[];
    };
  };
}

interface OurWord {
  word: string;
  phoneticUs?: string;
  phoneticUk?: string;
  meanings: { pos: string; defCn: string; examWeight: number }[];
  rootAffix?: any;
  derivatives?: { word: string; pos: string; defCn: string }[];
  frequencyRank: number;
  collocations?: { phrase: string; meaning: string }[];
  level: string;
  examples: { sentence: string; translation: string; source: string; difficulty: number }[];
}

// Stop words to filter out for "core" category
const STOP_WORDS = new Set([
  'the', 'be', 'a', 'an', 'to', 'of', 'and', 'in', 'that', 'have', 'i', 'for',
  'it', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by',
  'from', 'they', 'we', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all',
  'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who',
  'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
  'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good',
  'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look',
  'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use',
  'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want',
  'because', 'any', 'these', 'give', 'day', 'most', 'us', 'been', 'is', 'was',
  'are', 'were', 'being', 'been', 'has', 'had', 'having', 'does', 'did',
  'doing', 'should', 'may', 'might', 'must', 'shall', 'need', 'dare', 'ought',
  'used', 'am', 'not', 'nor', 'too', 'very', 's', 't', 'don', 'can', 'will',
  'just', 'say', 'said', 'says', 'saying', 'go', 'went', 'gone', 'going',
  'get', 'got', 'gotten', 'getting', 'make', 'made', 'making',
  'more', 'much', 'many', 'few', 'lot', 'every', 'each', 'both', 'such',
  'same', 'different', 'own', 'little', 'great', 'big', 'small', 'large',
  'long', 'old', 'young', 'high', 'low', 'early', 'late', 'right', 'left',
  'next', 'last', 'first', 'second', 'another', 'still', 'yet', 'already',
  'always', 'often', 'usually', 'never', 'ever', 'also', 'however',
  'therefore', 'thus', 'though', 'although', 'unless', 'until', 'while',
  'where', 'why', 'which', 'who', 'whom', 'whose', 'how', 'when', 'what',
]);

function loadNetemWords(): NetemWord[] {
  const raw = fs.readFileSync('/tmp/NETEMVocabulary/netem_full_list.json', 'utf-8');
  const data = JSON.parse(raw);
  const key = Object.keys(data)[0];
  return data[key] as NetemWord[];
}

function loadDictWords(): Map<string, any> {
  const raw = fs.readFileSync('/tmp/dict_extracted/KaoYan_2/KaoYan_2.json', 'utf-8');
  const map = new Map<string, any>();
  for (const line of raw.trim().split('\n')) {
    try {
      const obj = JSON.parse(line);
      // Structure: { headWord: "paragraph", content: { word: { content: {...} } } }
      const word = (obj.headWord || '').toLowerCase().trim();
      if (word) map.set(word, obj);
    } catch { /* skip malformed lines */ }
  }
  return map;
}

function parseTran(tranCn?: string): { pos: string; defCn: string; examWeight: number }[] {
  if (!tranCn) return [{ pos: '', defCn: '', examWeight: 1 }];
  // Parse strings like "n. 段落；短篇" or "v. 做；制造"
  const parts = tranCn.split(/[；;]/);
  const results: { pos: string; defCn: string; examWeight: number }[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    const dotIdx = trimmed.indexOf('.');
    if (dotIdx > 0) {
      const pos = trimmed.substring(0, dotIdx + 1);
      const meaning = trimmed.substring(dotIdx + 1).trim();
      results.push({ pos: pos.trim(), defCn: meaning, examWeight: 1 });
    } else {
      // No pos marker, append to last or create new
      if (results.length > 0) {
        results[results.length - 1].defCn += '；' + trimmed;
      } else {
        results.push({ pos: '', defCn: trimmed, examWeight: 1 });
      }
    }
  }
  return results;
}

function buildWords(): Record<string, OurWord[]> {
  console.log('Loading NETEM 5530 word list...');
  const netemWords = loadNetemWords();
  console.log(`  ${netemWords.length} words loaded`);

  console.log('Loading dict detailed data (KaoYan_2)...');
  const dictMap = loadDictWords();
  console.log(`  ${dictMap.size} detailed entries loaded`);

  const levels: Record<string, OurWord[]> = {
    core: [],
    'high-freq': [],
    'mid-freq': [],
    'low-freq': [],
  };

  let matchedDetailed = 0;
  let totalContentWords = 0;

  for (const nw of netemWords) {
    const wordLower = nw.单词.toLowerCase().trim();
    const isStopWord = STOP_WORDS.has(wordLower);

    // Skip stop words for content word classification
    if (isStopWord) continue;

    totalContentWords++;

    const freq = nw.词频;
    const dictEntry = dictMap.get(wordLower);

    let meanings: { pos: string; defCn: string; examWeight: number }[];
    let phonetics: { us?: string; uk?: string } = {};
    const examples: { sentence: string; translation: string; source: string; difficulty: number }[] = [];
    const collocations: { phrase: string; meaning: string }[] = [];

    if (dictEntry) {
      matchedDetailed++;
      // Structure: { headWord, content: { word: { content: { usphone, ukphone, sentence: { sentences: [...] }, phrase: { phrases: [...] }, tran: [...] } } } }
      const c = dictEntry.content?.word?.content;
      if (c) {
        phonetics = { us: c.usphone, uk: c.ukphone };

        // Parse translations
        if (c.tran && c.tran.length > 0) {
          const tranCn = c.tran.map((t: any) => `${t.pos || ''}${t.pos ? '. ' : ''}${t.tranCn || ''}`).join('；');
          meanings = parseTran(tranCn);
        } else {
          meanings = [{ pos: '', defCn: nw.释义, examWeight: 1 }];
        }

        // Parse sentences
        if (c.sentence?.sentences) {
          for (const s of c.sentence.sentences) {
            examples.push({
              sentence: s.sContent,
              translation: s.sCn,
              source: '考研真题',
              difficulty: 2,
            });
          }
        }

        // Parse phrases
        if (c.phrase?.phrases) {
          for (const p of c.phrase.phrases) {
            collocations.push({ phrase: p.pContent, meaning: p.pCn });
          }
        }
      } else {
        meanings = [{ pos: '', defCn: nw.释义, examWeight: 1 }];
      }
    } else {
      // No detailed data, use minimal info
      meanings = [{ pos: '', defCn: nw.释义, examWeight: 1 }];
    }

    // Determine level based on frequency rank (among content words)
    let level: string;
    if (totalContentWords <= 500) {
      level = 'core';
    } else if (totalContentWords <= 2000) {
      level = 'high-freq';
    } else if (totalContentWords <= 4000) {
      level = 'mid-freq';
    } else {
      level = 'low-freq';
    }

    // Set exam weight based on frequency
    const examWeight = freq > 5000 ? 5 : freq > 1000 ? 4 : freq > 100 ? 3 : 2;

    const word: OurWord = {
      word: nw.单词,
      phoneticUs: phonetics.us ? `/${phonetics.us}/` : undefined,
      phoneticUk: phonetics.uk ? `/${phonetics.uk}/` : undefined,
      meanings: meanings.map((m, i) => ({
        ...m,
        examWeight: i === 0 ? examWeight : Math.max(1, examWeight - 1),
      })),
      frequencyRank: totalContentWords,
      collocations: collocations.length > 0 ? collocations : undefined,
      level,
      examples,
    };

    levels[level].push(word);
  }

  console.log(`\nResults:`);
  console.log(`  Total content words: ${totalContentWords}`);
  console.log(`  Matched with detailed data: ${matchedDetailed}`);
  console.log(`  Core: ${levels.core.length}`);
  console.log(`  High-freq: ${levels['high-freq'].length}`);
  console.log(`  Mid-freq: ${levels['mid-freq'].length}`);
  console.log(`  Low-freq: ${levels['low-freq'].length}`);

  return levels;
}

// ── Main ──
console.log('='.repeat(50));
console.log('  考研 5500 大纲词库构建');
console.log('='.repeat(50));

const levels = buildWords();

const wordsDir = path.join(__dirname, 'words');

// Backup existing files
const backupDir = path.join(__dirname, 'words_backup');
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
const existingFiles = fs.readdirSync(wordsDir).filter(f => f.endsWith('.json'));
for (const f of existingFiles) {
  fs.copyFileSync(path.join(wordsDir, f), path.join(backupDir, f));
}
console.log(`\nBacked up existing files to words_backup/`);

// Write new files
for (const [level, words] of Object.entries(levels)) {
  const filename = `${level}.json`;
  const filePath = path.join(wordsDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(words, null, 2));
  console.log(`  Wrote ${filename}: ${words.length} words`);
}

// Show sample
const coreWords = levels['core'];
const sampleWord = coreWords.find((w: OurWord) => w.examples.length > 0) || coreWords[0];
console.log(`\nSample core word:`);
console.log(JSON.stringify({
  word: sampleWord.word,
  phonetic: sampleWord.phoneticUs,
  meanings: sampleWord.meanings,
  examples: sampleWord.examples?.slice(0, 1),
  collocations: sampleWord.collocations?.slice(0, 2),
}, null, 2));

console.log('\nDone! Next: cd data && npm run seed');
