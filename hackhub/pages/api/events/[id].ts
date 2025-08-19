import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { badRequest, ok, serverError, unauthorized, forbidden } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const { id } = req.query;
	if (typeof id !== "string") return badRequest(res, "Invalid id");
	try {
		if (req.method === "GET") {
			const event = await prisma.event.findUnique({
				where: { id },
				include: { tracks: true, rules: true, prizes: true, sponsors: true, teams: true, registrations: true, _count: { select: { registrations: true, teams: true } } },
			});
			return ok(res, event);
		}

		const session = await getServerSession(req, res, authOptions);
		if (!session) return unauthorized(res);
		const role = (session.user as any)?.role;

		if (req.method === "PUT") {
			if (role !== "ORGANIZER") return forbidden(res);
			const body = req.body as any;
			const event = await prisma.event.update({
				where: { id },
				data: {
					name: body.name,
					description: body.description,
					theme: body.theme,
					online: body.online,
					location: body.location,
					startAt: body.startAt ? new Date(body.startAt) : undefined,
					endAt: body.endAt ? new Date(body.endAt) : undefined,
					registrationOpenAt: body.registrationOpenAt ? new Date(body.registrationOpenAt) : undefined,
					registrationCloseAt: body.registrationCloseAt ? new Date(body.registrationCloseAt) : undefined,
					submissionOpenAt: body.submissionOpenAt ? new Date(body.submissionOpenAt) : undefined,
					submissionCloseAt: body.submissionCloseAt ? new Date(body.submissionCloseAt) : undefined,
					judgingStartAt: body.judgingStartAt ? new Date(body.judgingStartAt) : undefined,
					judgingEndAt: body.judgingEndAt ? new Date(body.judgingEndAt) : undefined,
				},
			});
			return ok(res, event, "Updated");
		}

		return badRequest(res, "Method not allowed");
	} catch (error) {
		return serverError(res, error);
	}
}


