import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/app";

export default function handler(req: VercelRequest, res: VercelResponse) {
    return (app as unknown as (req: VercelRequest, res: VercelResponse) => void)(req, res);
}


