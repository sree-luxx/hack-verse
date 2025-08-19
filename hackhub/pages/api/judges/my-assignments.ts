import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { ok, serverError, unauthorized } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const session = await getServerSession(req, res, authOptions);
        if (!session) return unauthorized(res);
        
        const userId = (session.user as any).id as string;
        const role = (session.user as any)?.role as string | undefined;

        // Only judges can access this endpoint
        if (role !== "JUDGE") {
            return res.status(403).json({ error: "Only judges can access this endpoint" });
        }

        if (req.method === "GET") {
            try {
                // Fetch all events assigned to this judge
                const assignments = await prisma.judgeAssignment.findMany({
                    where: { judgeId: userId },
                    include: {
                        event: {
                            select: {
                                id: true,
                                name: true,
                                theme: true,
                                description: true,
                                startAt: true,
                                endAt: true,
                                location: true,
                                online: true,
                                organizer: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true
                                    }
                                },
                                _count: {
                                    select: {
                                        registrations: true,
                                        teams: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                });

                // Transform the data to be more frontend-friendly
                const assignedEvents = assignments.map(assignment => ({
                    assignmentId: assignment.id,
                    assignedAt: assignment.createdAt,
                    event: assignment.event
                }));

                return ok(res, assignedEvents);
            } catch (dbError) {
                console.error("Database error:", dbError);
                return serverError(res, dbError);
            }
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
        console.error("API error:", error);
        return serverError(res, error);
    }
}
