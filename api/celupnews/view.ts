import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import { jsonHeaders, serverDb } from "../../celupnews/server";
const BOT=/bot|crawler|spider|preview|whatsapp|facebookexternalhit|slackbot|twitterbot/i;
export default async function handler(req:VercelRequest,res:VercelResponse){jsonHeaders(res);if(req.method!=="POST")return res.status(405).end();const n=String(req.query.number||"");if(!/^\d{2,4}$/.test(n))return res.status(400).end();if(BOT.test(String(req.headers["user-agent"]||"")))return res.status(204).end();try{const ref=serverDb().collection("articles").doc(n);await serverDb().runTransaction(async tx=>{const snap=await tx.get(ref);if(snap.exists&&snap.data()?.status==="published")tx.update(ref,{viewCount:FieldValue.increment(1)});});return res.status(204).end();}catch{return res.status(204).end();}}
