import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { badRequest, created, ok, serverError, unauthorized, forbidden } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (req.method === "GET") {
			try {
				const { mine, organizerId } = req.query as any;
				const where: any = {};
				if (mine === "true") {
					const session = await getServerSession(req, res, authOptions);
					if (!session) return unauthorized(res);
					where.organizerId = (session.user as any).id;
				}
				if (organizerId && typeof organizerId === "string") {
					where.organizerId = organizerId;
				}

				const events = await prisma.event.findMany({
					where,
					include: { tracks: true, rules: true, prizes: true, sponsors: true, _count: { select: { registrations: true, teams: true } } },
					orderBy: { startAt: "desc" },
				});
				return ok(res, events);
			} catch (dbError) {
				// If database is unavailable, return empty array with message
				console.log("Database temporarily unavailable, returning empty events list");
				return ok(res, [], "Database temporarily unavailable, showing empty list");
			}
		}

		const session = await getServerSession(req, res, authOptions);
		if (!session) return unauthorized(res);
		const role = (session.user as any)?.role;
		if (req.method === "POST") {
			if (role !== "ORGANIZER") return forbidden(res);
			const body = req.body as any;
			if (!body?.name || !body?.startAt || !body?.endAt) return badRequest(res, "Missing required fields");
			try {
				const event = await prisma.event.create({
					data: {
						name: body.name,
						description: body.description,
						theme: body.theme,
						online: body.online ?? true,
						location: body.location,
						startAt: new Date(body.startAt),
						endAt: new Date(body.endAt),
						registrationOpenAt: body.registrationOpenAt ? new Date(body.registrationOpenAt) : undefined,
						registrationCloseAt: body.registrationCloseAt ? new Date(body.registrationCloseAt) : undefined,
						submissionOpenAt: body.submissionOpenAt ? new Date(body.submissionOpenAt) : undefined,
						submissionCloseAt: body.submissionCloseAt ? new Date(body.submissionCloseAt) : undefined,
						judgingStartAt: body.judgingStartAt ? new Date(body.judgingStartAt) : undefined,
						judgingEndAt: body.judgingEndAt ? new Date(body.judgingEndAt) : undefined,
						organizerId: (session.user as any).id,
						tracks: { create: (body.tracks ?? []).map((name: string) => ({ name })) },
						rules: { create: (body.rules ?? []).map((text: string) => ({ text })) },
						prizes: { create: (body.prizes ?? []).map((p: any) => ({ title: p.title, description: p.description })) },
						sponsors: { create: (body.sponsors ?? []).map((s: any) => ({ name: s.name, logoUrl: s.logoUrl })) },
					},
					include: { tracks: true, rules: true, prizes: true, sponsors: true },
				});
				return created(res, event);
			} catch (dbError) {
				console.error("Database error creating event:", dbError);
				return serverError(res, "Database temporarily unavailable. Please try again later.");
			}
		}

		return badRequest(res, "Method not allowed");
	} catch (error) {
		return serverError(res, error);
	}
}


