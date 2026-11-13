import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { NEWS_ADMIN_UID } from "./admin";

export function serverApp(){
  const existing=getApps().find((app)=>app.name==="celupnews-server");
  if(existing)return existing;
  const projectId=process.env.CELUPNEWS_FIREBASE_PROJECT_ID;
  const clientEmail=process.env.CELUPNEWS_FIREBASE_CLIENT_EMAIL;
  const privateKey=process.env.CELUPNEWS_FIREBASE_PRIVATE_KEY?.replace(/\\n/g,"\n");
  if(!projectId)throw new Error("Firebase CELUPNEWS server configuration is missing");
  const credential=clientEmail&&privateKey?cert({projectId,clientEmail,privateKey}):applicationDefault();
  return initializeApp({credential,projectId},"celupnews-server");
}
export const serverDb=()=>getFirestore(serverApp());
export async function requireAdmin(req:VercelRequest,res:VercelResponse){
  const header=req.headers.authorization||"";const token=header.startsWith("Bearer ")?header.slice(7):"";
  if(!token){res.status(401).json({error:"Authentication required"});return false;}
  try{const decoded=await getAuth(serverApp()).verifyIdToken(token);if(decoded.uid!==NEWS_ADMIN_UID){res.status(403).json({error:"Forbidden"});return false;}return true;}
  catch{res.status(401).json({error:"Invalid session"});return false;}
}
export function jsonHeaders(res:VercelResponse){res.setHeader("Cache-Control","no-store");res.setHeader("X-Content-Type-Options","nosniff");}
export function safeText(value:unknown){return String(value??"").replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]||c));}
export function publicImage(value:unknown){const u=String(value??"");try{const parsed=new URL(u);return parsed.protocol==="https:"&&parsed.hostname==="res.cloudinary.com"?u:"";}catch{return "";}}
