import mongoose, { Schema, model, models } from "mongoose";

const QuestionSchema = new Schema(
	{
		eventId: { type: String, required: true },
		question: { type: String, required: true },
		askedBy: { type: String, required: true },
		askedByName: { type: String, required: true },
		answer: { type: String, default: "" },
		answeredBy: { type: String, default: "" },
		answeredByName: { type: String, default: "" },
		status: { type: String, enum: ['pending', 'answered'], default: 'pending' },
	},
	{ timestamps: true }
);

export type QuestionDocument = mongoose.InferSchemaType<typeof QuestionSchema> & { _id: mongoose.Types.ObjectId };

export const Question = models.Question || model("Question", QuestionSchema);
