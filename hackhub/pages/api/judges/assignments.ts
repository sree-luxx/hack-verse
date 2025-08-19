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
            if (!body?.eventId || !body?.judgeEmail) return badRequest(res, "Missing fields");
            
            // Ensure the requester is the organizer of the event
            const event = await prisma.event.findUnique({ where: { id: body.eventId }, select: { organizerId: true } });
            if (!event) return badRequest(res, "Event not found");
            if (event.organizerId !== userId) return unauthorized(res);

            try {
                // Find or create judge user by email
                let judge = await prisma.user.findUnique({
                    where: { email: body.judgeEmail }
                });

                if (!judge) {
                    // Create a new judge user if they don't exist
                    judge = await prisma.user.create({
                        data: {
                            email: body.judgeEmail,
                            name: body.judgeEmail.split('@')[0], // Use email prefix as name
                            role: 'JUDGE'
                        }
                    });
                } else if (judge.role !== 'JUDGE') {
                    // Update existing user to judge role if needed
                    judge = await prisma.user.update({
                        where: { id: judge.id },
                        data: { role: 'JUDGE' }
                    });
                }

                // Create or update the assignment
                const assignment = await prisma.judgeAssignment.upsert({
                    where: { eventId_judgeId: { eventId: body.eventId, judgeId: judge.id } } as any,
                    update: {},
                    create: { eventId: body.eventId, judgeId: judge.id },
                });

                return created(res, {
                    ...assignment,
                    judge: {
                        id: judge.id,
                        email: judge.email,
                        name: judge.name,
                        role: judge.role
                    }
                });
            } catch (dbError) {
                console.error("Database error:", dbError);
                return serverError(res, dbError);
            }
        }

        return badRequest(res, "Method not allowed");
    } catch (error) {
        return serverError(res, error);
    }
}


