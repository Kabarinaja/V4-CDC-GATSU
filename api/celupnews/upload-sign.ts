import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash } from "node:crypto";
import { jsonHeaders, requireAdmin } from "../../celupnews/server";

const ALLOWED_FOLDERS=new Set(["celupnews/logo","celupnews/articles/thumbnails","celupnews/articles/featured","celupnews/articles/content","celupnews/authors/profile","celupnews/banners"]);
export default async function handler(req:VercelRequest,res:VercelResponse){jsonHeaders(res);if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).end();}if(!await requireAdmin(req,res))return;
  const folder=typeof req.body?.folder==="string"?req.body.folder:"";if(!ALLOWED_FOLDERS.has(folder))return res.status(400).json({error:"Invalid media folder"});
  const secret=process.env.CELUPNEWS_CLOUDINARY_API_SECRET;const apiKey=process.env.CELUPNEWS_CLOUDINARY_API_KEY;if(!secret||!apiKey)return res.status(503).json({error:"Media service is not configured"});
  const timestamp=Math.floor(Date.now()/1000);const signature=createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest("hex");return res.status(200).json({api_key:apiKey,folder,timestamp,signature});
}
