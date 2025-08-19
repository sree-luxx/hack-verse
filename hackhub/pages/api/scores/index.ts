import { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../lib/mongoose";
import { Score } from "../../../models/Score";
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
			const { eventId, teamId } = req.query as any;
			const filter: any = {};
			if (eventId) filter.eventId = eventId;
			if (teamId) filter.teamId = teamId;
			const scores = await (Score as any).find(filter as any, null, { sort: { createdAt: -1 } });
			return ok(res, scores);
		}

		if (req.method === "POST") {
			if (role !== "JUDGE") return forbidden(res);
			const body = req.body as any;
			if (!body?.eventId || !body?.teamId || !body?.submissionId || !body?.criteria) return badRequest(res, "Missing fields");
			const total = (body.criteria as Array<{ score: number }>).reduce((s, c) => s + (c.score || 0), 0);
			const score = await (Score as any).create({
				eventId: body.eventId,
				teamId: body.teamId,
				submissionId: body.submissionId,
				judgeId: (session.user as any).id,
				criteria: body.criteria,
				total,
				notes: body.notes,
			} as any);
			await publish(`event-${body.eventId}`, "score:update", { teamId: body.teamId });
			return created(res, score);
		}

		return badRequest(res, "Method not allowed");
	} catch (error) {
		return serverError(res, error);
	}
}


