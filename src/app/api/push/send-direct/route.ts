import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const webpush = require("web-push");

export async function POST(request: NextRequest) {
  try {
    webpush.setVapidDetails(
      "mailto:contact@glupp.fr",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    const { endpoint, p256dh, auth, payload } = await request.json();

    if (!endpoint || !p256dh || !auth || !payload) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await webpush.sendNotification(
      { endpoint, keys: { p256dh, auth } },
      typeof payload === "string" ? payload : JSON.stringify(payload)
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      return NextResponse.json({ error: "Subscription expired" }, { status: 410 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}