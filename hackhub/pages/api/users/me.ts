import { NextApiRequest, NextApiResponse } from "next";
import { ok, unauthorized } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const session = await getServerSession(req, res, authOptions);
	if (!session) return unauthorized(res);
	return ok(res, session.user);
}



