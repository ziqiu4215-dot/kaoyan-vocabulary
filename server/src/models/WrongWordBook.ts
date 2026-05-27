import mongoose, { Document, Schema } from 'mongoose';

export type WordBookType = 'wrong' | 'favorite';

export interface IWrongWordBook extends Document {
  userId: mongoose.Types.ObjectId;
  wordId: mongoose.Types.ObjectId;
  type: WordBookType;
  createdAt: Date;
  updatedAt: Date;
}

const wrongWordBookSchema = new Schema<IWrongWordBook>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    wordId: { type: Schema.Types.ObjectId, ref: 'Word', required: true },
    type: { type: String, required: true, enum: ['wrong', 'favorite'], default: 'wrong' },
  },
  { timestamps: true }
);

wrongWordBookSchema.index({ userId: 1, wordId: 1, type: 1 }, { unique: true });

export default mongoose.model<IWrongWordBook>('WrongWordBook', wrongWordBookSchema);
