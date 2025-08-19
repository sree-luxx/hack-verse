import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { badRequest, created, ok, serverError, unauthorized } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		const session = await getServerSession(req, res, authOptions);
		if (!session) return unauthorized(res);
		const userId = (session.user as any).id as string;

		if (req.method === "GET") {
			try {
				const { mine, eventId } = req.query as any;
				const where: any = {};
				if (eventId && typeof eventId === "string") where.eventId = eventId;
				if (mine === "true") {
					where.members = { some: { userId } } as any;
				}
				const teams = await prisma.team.findMany({ where, include: { members: true } });
				return ok(res, teams);
			} catch (dbError) {
				console.log("Database temporarily unavailable, returning empty teams list");
				return ok(res, [], "Database temporarily unavailable, showing empty list");
			}
		}

		if (req.method === "POST") {
			try {
				const { eventId, name } = req.body as any;
				if (!eventId || !name) return badRequest(res, "Missing fields");
				const team = await prisma.team.create({ data: { eventId, name } });
				await prisma.teamMember.create({ data: { teamId: team.id, userId } });
				return created(res, team);
			} catch (dbError) {
				console.error("Database error creating team:", dbError);
				return serverError(res, "Database temporarily unavailable. Please try again later.");
			}
		}

		return badRequest(res, "Method not allowed");
	} catch (error) {
		return serverError(res, error);
	}
}


