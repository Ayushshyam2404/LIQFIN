import { Schema, model, Document, Types } from 'mongoose';

export interface IProcessedEmail extends Document {
  userId: Types.ObjectId;
  messageId: string;
  processedAt: Date;
}

const ProcessedEmailSchema = new Schema<IProcessedEmail>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  messageId: { type: String, required: true, index: true },
  processedAt: { type: Date, default: Date.now }
});

// Compound index to ensure uniqueness per user and message ID
ProcessedEmailSchema.index({ userId: 1, messageId: 1 }, { unique: true });

export const ProcessedEmail = model<IProcessedEmail>('ProcessedEmail', ProcessedEmailSchema);
