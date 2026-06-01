/**
 * 例句/短语丰富脚本 — 从多个词库源合并例句和搭配
 */
import * as fs from 'fs';
import * as path from 'path';

interface Example { sentence: string; translation: string; source: string; difficulty: number; }
interface Phrase { phrase: string; meaning: string; }
interface Word {
  word: string;
  phoneticUs?: string;
  phoneticUk?: string;
  meanings: { pos: string; defCn: string; examWeight: number }[];
  rootAffix?: any;
  derivatives?: { word: string; pos: string; defCn: string }[];
  frequencyRank: number;
  collocations?: Phrase[];
  level: string;
  examples: Example[];
}

// Load a JSONL dict file and return word → { sentences, phrases } map
function loadDict(filepath: string): Map<string, { sentences: { en: string; cn: string }[]; phrases: { en: string; cn: string }[] }> {
  const map = new Map<string, any>();
  if (!fs.existsSync(filepath)) return map;

  const raw = fs.readFileSync(filepath, 'utf-8');
  for (const line of raw.trim().split('\n')) {
    try {
      const obj = JSON.parse(line);
      const word = (obj.headWord || '').toLowerCase().trim();
      if (!word) continue;

      const c = obj.content?.word?.content;
      const sentences: { en: string; cn: string }[] = [];
      const phrases: { en: string; cn: string }[] = [];

      if (c?.sentence?.sentences) {
        for (const s of c.sentence.sentences) {
          if (s.sContent && s.sCn) sentences.push({ en: s.sContent, cn: s.sCn });
        }
      }
      if (c?.phrase?.phrases) {
        for (const p of c.phrase.phrases) {
          if (p.pContent && p.pCn) phrases.push({ en: p.pContent, cn: p.pCn });
        }
      }

      map.set(word, { sentences, phrases });
    } catch { /* skip malformed */ }
  }
  return map;
}

// Load existing word JSON
function loadWords(filepath: string): Word[] {
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

// Normalize for dedup
function norm(s: string) { return s.toLowerCase().replace(/[^a-z0-9]/g, ''); }

// Main
console.log('Loading supplemental dict sources...');

const dicts = [
  { name: 'KaoYan_1', path: '/tmp/dict_all/KaoYan_1/KaoYan_1.json' },
  { name: 'KaoYan_2', path: '/tmp/dict_all/KaoYan_2/KaoYan_2.json' },
  { name: 'KaoYan_3', path: '/tmp/dict_all/KaoYan_3/KaoYan_3.json' },
  { name: 'KaoYanluan_1', path: '/tmp/dict_all/KaoYanluan_1/KaoYanluan_1.json' },
];

const allDicts = dicts.map(d => ({ name: d.name, data: loadDict(d.path) }));
for (const d of allDicts) console.log(`  ${d.name}: ${d.data.size} entries`);

// Load existing word files
const wordsDir = path.join(__dirname, 'words');
const files = fs.readdirSync(wordsDir).filter(f => f.endsWith('.json'));

let totalAddedExamples = 0;
let totalAddedPhrases = 0;

for (const file of files) {
  const words = loadWords(path.join(wordsDir, file));
  console.log(`\nProcessing ${file}: ${words.length} words`);

  for (const word of words) {
    const wl = word.word.toLowerCase().trim();

    // Collect all unique sentences and phrases from all dicts
    const seenSentences = new Set(word.examples.map(e => norm(e.sentence)));
    const seenPhrases = new Set((word.collocations || []).map(p => norm(p.phrase)));

    for (const dict of allDicts) {
      const entry = dict.data.get(wl);
      if (!entry) continue;

      for (const s of entry.sentences) {
        const key = norm(s.en);
        if (!seenSentences.has(key) && word.examples.length < 5) {
          word.examples.push({
            sentence: s.en,
            translation: s.cn,
            source: '考研真题',
            difficulty: 2,
          });
          seenSentences.add(key);
          totalAddedExamples++;
        }
      }

      for (const p of entry.phrases) {
        const key = norm(p.en);
        if (!seenPhrases.has(key)) {
          if (!word.collocations) word.collocations = [];
          word.collocations.push({ phrase: p.en, meaning: p.cn });
          seenPhrases.add(key);
          totalAddedPhrases++;
        }
      }
    }
  }

  // Write enriched file
  fs.writeFileSync(path.join(wordsDir, file), JSON.stringify(words, null, 2));
  const avgEx = words.reduce((s, w) => s + w.examples.length, 0) / words.length;
  const avgPh = words.reduce((s, w) => s + (w.collocations?.length || 0), 0) / words.length;
  console.log(`  → avg ${avgEx.toFixed(1)} examples, ${avgPh.toFixed(1)} phrases per word`);
}

console.log(`\n=== Done ===`);
console.log(`Added ${totalAddedExamples} examples, ${totalAddedPhrases} phrases`);
console.log(`Next: npm run seed`);
