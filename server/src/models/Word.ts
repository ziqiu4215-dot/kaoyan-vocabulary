import mongoose, { Document, Schema } from 'mongoose';

interface IMeaning {
  pos: string;       // 词性: n./v./adj./adv./prep./conj.
  defCn: string;     // 中文释义
  defEn?: string;    // 英文释义
  examWeight?: number; // 考义权重 1-5
}

interface IRootAffix {
  root?: string;
  rootMeaning?: string;
  affixes?: { part: string; meaning: string }[];
  meaning: string;
}

interface IDerivative {
  word: string;
  pos: string;
  defCn: string;
}

interface ICollocation {
  phrase: string;
  meaning: string;
}

export interface IWord extends Document {
  word: string;
  phoneticUs?: string;
  phoneticUk?: string;
  meanings: IMeaning[];
  rootAffix?: IRootAffix;
  derivatives?: IDerivative[];
  frequencyRank?: number;
  collocations?: ICollocation[];
  level: 'high-freq' | 'mid-freq' | 'low-freq' | 'core' | 'cet4' | 'cet6' | 'postgraduate';
  createdAt: Date;
  updatedAt: Date;
}

const wordSchema = new Schema<IWord>(
  {
    word: { type: String, required: true, unique: true, index: true },
    phoneticUs: { type: String },
    phoneticUk: { type: String },
    meanings: [
      {
        pos: { type: String, required: true },
        defCn: { type: String, required: true },
        defEn: { type: String },
        examWeight: { type: Number, min: 1, max: 5 },
      },
    ],
    rootAffix: {
      root: String,
      rootMeaning: String,
      affixes: [{ part: String, meaning: String }],
      meaning: String,
    },
    derivatives: [
      {
        word: { type: String, required: true },
        pos: { type: String, required: true },
        defCn: { type: String, required: true },
      },
    ],
    frequencyRank: { type: Number, index: true },
    collocations: [
      {
        phrase: { type: String, required: true },
        meaning: { type: String, required: true },
      },
    ],
    level: {
      type: String,
      required: true,
      enum: ['high-freq', 'mid-freq', 'low-freq', 'core', 'cet4', 'cet6', 'postgraduate'],
      index: true,
    },
  },
  { timestamps: true }
);

wordSchema.index({ word: 'text' });

export default mongoose.model<IWord>('Word', wordSchema);
