import { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../lib/mongoose";
import { ChatMessage } from "../../../models/Chat";
import { ok, badRequest, created, serverError, unauthorized } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { publish } from "../../../lib/pubsub";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		const session = await getServerSession(req, res, authOptions);
		if (!session) return unauthorized(res);
		await connectMongo();

		if (req.method === "GET") {
			const { eventId, teamId } = req.query as any;
			const filter: any = {};
			if (eventId) filter.eventId = eventId;
			if (teamId) filter.teamId = teamId;
			const list = await (ChatMessage as any).find(filter as any, null, { sort: { createdAt: -1 }, limit: 200 });
			return ok(res, list);
		}

		if (req.method === "POST") {
			const body = req.body as any;
			if (!body?.eventId || !body?.content) return badRequest(res, "Missing fields");
			const msg = await (ChatMessage as any).create({ eventId: body.eventId, teamId: body.teamId, userId: (session.user as any).id, content: body.content, attachments: body.attachments ?? [] } as any);
			// Broadcast to event channel and team-specific channel if provided
			await publish(`event-${body.eventId}`, "chat:new", { _id: String(msg._id), content: msg.content, teamId: msg.teamId, userId: msg.userId, createdAt: msg.createdAt });
			if (body.teamId) {
				await publish(`team-${body.teamId}`, "chat:new", { _id: String(msg._id), content: msg.content, teamId: msg.teamId, userId: msg.userId, createdAt: msg.createdAt });
			}
			return created(res, msg);
		}

		return badRequest(res, "Method not allowed");
	} catch (error) {
		return serverError(res, error);
	}
}


