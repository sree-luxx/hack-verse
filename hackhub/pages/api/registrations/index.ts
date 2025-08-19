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
				const { eventId, forEvent } = req.query as any;
				// If organizer requests registrants for a specific event they created
				if (forEvent && typeof forEvent === "string") {
					// Ensure requester is the organizer of the event
					const event = await prisma.event.findUnique({ where: { id: forEvent }, select: { organizerId: true } });
					if (!event) return badRequest(res, "Event not found");
					if (event.organizerId !== userId) return unauthorized(res);
					const regs = await prisma.registration.findMany({ where: { eventId: forEvent }, include: { user: true, team: true } as any });
					return ok(res, regs);
				}

				// Participant can request registrants for an event they are registered in
				if (eventId && typeof eventId === "string") {
					const mine = await prisma.registration.findUnique({ where: { userId_eventId: { userId, eventId } } as any });
					if (!mine) return unauthorized(res);
					const regs = await prisma.registration.findMany({ where: { eventId }, include: { user: true, team: true } as any });
					return ok(res, regs);
				}

				// Default: return my registrations
				const regs = await prisma.registration.findMany({ where: { userId }, include: { event: true, team: true } });
				return ok(res, regs);
			} catch (dbError) {
				console.log("Database temporarily unavailable, returning empty registrations list");
				return ok(res, [], "Database temporarily unavailable, showing empty list");
			}
		}

		if (req.method === "POST") {
			try {
				const { eventId } = req.body as any;
				if (!eventId) return badRequest(res, "Missing eventId");
				const reg = await prisma.registration.create({ data: { eventId, userId } });
				return created(res, reg);
			} catch (dbError) {
				console.error("Database error creating registration:", dbError);
				return serverError(res, "Database temporarily unavailable. Please try again later.");
			}
		}

		return badRequest(res, "Method not allowed");
	} catch (error) {
		return serverError(res, error);
	}
}


