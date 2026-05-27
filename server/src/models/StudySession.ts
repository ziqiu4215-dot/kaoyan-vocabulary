import mongoose, { Document, Schema } from 'mongoose';

export interface IStudySession extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  newWordsCount: number;
  reviewWordsCount: number;
  durationSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

const studySessionSchema = new Schema<IStudySession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    newWordsCount: { type: Number, default: 0 },
    reviewWordsCount: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

studySessionSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<IStudySession>('StudySession', studySessionSchema);
