import mongoose, { Document, Schema } from 'mongoose';

export interface IExample extends Document {
  wordId: mongoose.Types.ObjectId;
  sentence: string;
  translation: string;
  source?: string;
  audioUrl?: string;
  difficulty?: number;
  createdAt: Date;
  updatedAt: Date;
}

const exampleSchema = new Schema<IExample>(
  {
    wordId: { type: Schema.Types.ObjectId, ref: 'Word', required: true, index: true },
    sentence: { type: String, required: true },
    translation: { type: String, required: true },
    source: { type: String },
    audioUrl: { type: String },
    difficulty: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

export default mongoose.model<IExample>('Example', exampleSchema);
