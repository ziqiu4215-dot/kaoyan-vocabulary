import mongoose, { Document, Schema } from 'mongoose';

export type WordStatus = 'new' | 'learning' | 'review' | 'mastered';

export interface ILearningRecord extends Document {
  userId: mongoose.Types.ObjectId;
  wordId: mongoose.Types.ObjectId;
  status: WordStatus;
  easeFactor: number;
  interval: number;
  repetitions: number;
  lastReviewAt?: Date;
  nextReviewAt?: Date;
  correctCount: number;
  incorrectCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const learningRecordSchema = new Schema<ILearningRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    wordId: { type: Schema.Types.ObjectId, ref: 'Word', required: true },
    status: {
      type: String,
      required: true,
      enum: ['new', 'learning', 'review', 'mastered'],
      default: 'new',
    },
    easeFactor: { type: Number, default: 2.5, min: 1.3, max: 2.5 },
    interval: { type: Number, default: 0 },
    repetitions: { type: Number, default: 0 },
    lastReviewAt: { type: Date },
    nextReviewAt: { type: Date, index: true },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

learningRecordSchema.index({ userId: 1, wordId: 1 }, { unique: true });

export default mongoose.model<ILearningRecord>('LearningRecord', learningRecordSchema);
