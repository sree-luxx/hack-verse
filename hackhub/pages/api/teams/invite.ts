import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { badRequest, ok, serverError, unauthorized } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		const session = await getServerSession(req, res, authOptions);
		if (!session) return unauthorized(res);

		if (req.method !== "POST") return badRequest(res, "Method not allowed");

		const { teamId, userId } = req.body as any;
		if (!teamId || !userId) return badRequest(res, "Missing fields");

		const existing = await prisma.teamMember.findUnique({ where: { teamId_userId: { teamId, userId } } as any });
		if (!existing) {
			await prisma.teamMember.create({ data: { teamId, userId } });
		}
		return ok(res, { teamId, userId }, "User added to team");
	} catch (error) {
		return serverError(res, error);
	}
}


