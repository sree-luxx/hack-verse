import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { badRequest, created, ok, serverError, unauthorized, forbidden } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const session = await getServerSession(req, res, authOptions);
        if (!session) return unauthorized(res);
        const userId = (session.user as any).id as string;
        const role = (session.user as any)?.role as string | undefined;

        if (req.method === "GET") {
            try {
                const { eventId, judgeId } = req.query as any;
                const where: any = {};
                if (eventId) where.eventId = eventId;
                if (judgeId) where.judgeId = judgeId;
                const rows = await prisma.judgeAssignment.findMany({ where, include: { event: true, judge: true } as any });
                return ok(res, rows);
            } catch (dbError) {
                console.log("Database temporarily unavailable, returning empty assignments list");
                return ok(res, [], "Database temporarily unavailable, showing empty list");
            }
        }

        if (req.method === "POST") {
            if (role !== "ORGANIZER") return forbidden(res);
            const body = req.body as any;
            if (!body?.eventId || !body?.judgeId) return badRequest(res, "Missing fields");
            // Ensure the requester is the organizer of the event
            const event = await prisma.event.findUnique({ where: { id: body.eventId }, select: { organizerId: true } });
            if (!event) return badRequest(res, "Event not found");
            if (event.organizerId !== userId) return unauthorized(res);

            try {
                const assignment = await prisma.judgeAssignment.upsert({
                    where: { eventId_judgeId: { eventId: body.eventId, judgeId: body.judgeId } } as any,
                    update: {},
                    create: { eventId: body.eventId, judgeId: body.judgeId },
                });
                return created(res, assignment);
            } catch (dbError) {
                return serverError(res, dbError);
            }
        }

        return badRequest(res, "Method not allowed");
    } catch (error) {
        return serverError(res, error);
    }
}


