import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kaoyan-vocabulary';

interface WordData {
  word: string;
  phoneticUs?: string;
  phoneticUk?: string;
  meanings: { pos: string; defCn: string; defEn?: string; examWeight?: number }[];
  rootAffix?: { root?: string; rootMeaning?: string; affixes?: { part: string; meaning: string }[]; meaning: string };
  derivatives?: { word: string; pos: string; defCn: string }[];
  frequencyRank?: number;
  collocations?: { phrase: string; meaning: string }[];
  level: string;
  examples?: { sentence: string; translation: string; source?: string; difficulty?: number }[];
}

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  const db = mongoose.connection.db!;

  // Clear existing data
  await db.dropCollection('words').catch(() => console.log('No words collection to drop'));
  await db.dropCollection('examples').catch(() => console.log('No examples collection to drop'));

  const wordsDir = path.join(__dirname, 'words');
  const files = fs.readdirSync(wordsDir).filter(f => f.endsWith('.json'));

  let totalWords = 0;
  let totalExamples = 0;

  for (const file of files) {
    const filePath = path.join(wordsDir, file);
    const data: WordData[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`Processing ${file}: ${data.length} words`);

    const words = [];
    const examples = [];

    for (const item of data) {
      const { examples: exData, ...wordData } = item;
      words.push(wordData);

      if (exData && exData.length > 0) {
        for (const ex of exData) {
          examples.push({
            word: item.word,
            ...ex,
          } as any);  // word field is temporary, will resolve after insert
        }
      }
    }

    // Insert words
    const insertedWords = await db.collection('words').insertMany(words as any[]);
    totalWords += insertedWords.insertedCount;

    // Resolve word IDs for examples
    if (examples.length > 0) {
      const wordMap = new Map<string, mongoose.Types.ObjectId>();
      for (let i = 0; i < insertedWords.insertedIds.length; i++) {
        const word = words[i];
        wordMap.set(word.word, insertedWords.insertedIds[i] as mongoose.Types.ObjectId);
      }

      const examplesToInsert = examples.map(ex => {
        const { word, ...rest } = ex;
        return { wordId: wordMap.get(word), ...rest };
      }).filter(ex => ex.wordId);

      if (examplesToInsert.length > 0) {
        const result = await db.collection('examples').insertMany(examplesToInsert);
        totalExamples += result.insertedCount;
      }
    }
  }

  console.log(`\nSeed complete!`);
  console.log(`  Words inserted: ${totalWords}`);
  console.log(`  Examples inserted: ${totalExamples}`);

  // Create indexes
  await db.collection('words').createIndex({ word: 1 }, { unique: true });
  await db.collection('words').createIndex({ level: 1 });
  await db.collection('words').createIndex({ frequencyRank: 1 });
  await db.collection('words').createIndex({ word: 'text' });
  await db.collection('examples').createIndex({ wordId: 1 });
  console.log('Indexes created.');

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
