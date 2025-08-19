import mongoose, { Schema, model, models } from "mongoose";

const ChatMessageSchema = new Schema(
	{
		eventId: { type: String, required: true },
		teamId: { type: String },
		userId: { type: String, required: true },
		content: { type: String, required: true },
		attachments: [
			{
				name: String,
				url: String,
				contentType: String,
				size: Number,
			},
		],
	},
	{ timestamps: true }
);

export type ChatMessageDocument = mongoose.InferSchemaType<typeof ChatMessageSchema> & { _id: mongoose.Types.ObjectId };

export const ChatMessage = models.ChatMessage || model("ChatMessage", ChatMessageSchema);



