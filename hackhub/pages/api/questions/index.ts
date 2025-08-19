import { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../lib/mongoose";
import { Question } from "../../../models/Question";
import { ok, badRequest, created, serverError, unauthorized, forbidden } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { publish } from "../../../lib/pubsub";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		const session = await getServerSession(req, res, authOptions);
		if (!session) return unauthorized(res);
		const role = (session.user as any)?.role;
		await connectMongo();

		if (req.method === "GET") {
			const { eventId } = req.query as any;
			const filter: any = {};
			if (eventId) filter.eventId = eventId;
			
			// Organizers can see all questions for their events
			if (role === "ORGANIZER") {
				// For now, show all questions. In future, filter by organizer's events
			}
			
			const list = await (Question as any).find(filter as any, null, { sort: { createdAt: -1 } });
			return ok(res, list);
		}

		if (req.method === "POST") {
			const body = req.body as any;
			if (!body?.eventId || !body?.question) return badRequest(res, "Missing fields");
			
			const question = await (Question as any).create({ 
				eventId: body.eventId, 
				question: body.question, 
				askedBy: (session.user as any).id,
				askedByName: (session.user as any).name || 'Anonymous'
			} as any);
			
			await publish(`event-${body.eventId}`, "question:new", question);
			return created(res, question);
		}

		if (req.method === "PUT") {
			if (role !== "ORGANIZER") return forbidden(res);
			const { id, answer } = req.body as any;
			if (!id || !answer) return badRequest(res, "Missing fields");
			
			const question = await (Question as any).findByIdAndUpdate(id, {
				answer,
				answeredBy: (session.user as any).id,
				answeredByName: (session.user as any).name || 'Organizer',
				status: 'answered'
			}, { new: true });
			
			if (question) {
				await publish(`event-${question.eventId}`, "question:answered", question);
			}
			
			return ok(res, question);
		}

		return badRequest(res, "Method not allowed");
	} catch (error) {
		return serverError(res, error);
	}
}
