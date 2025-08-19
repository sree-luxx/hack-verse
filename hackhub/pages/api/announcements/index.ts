import { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../lib/mongoose";
import { Announcement } from "../../../models/Announcement";
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
			const list = await (Announcement as any).find(filter as any, null, { sort: { createdAt: -1 } });
			return ok(res, list);
		}

		if (req.method === "POST") {
			if (role !== "ORGANIZER") return forbidden(res);
			const body = req.body as any;
			if (!body?.eventId || !body?.title || !body?.message) return badRequest(res, "Missing fields");
			const ann = await (Announcement as any).create({ eventId: body.eventId, title: body.title, message: body.message, createdBy: (session.user as any).id } as any);
			await publish(`event-${body.eventId}`, "announcement:new", ann);
			return created(res, ann);
		}

		return badRequest(res, "Method not allowed");
	} catch (error) {
		return serverError(res, error);
	}
}


