import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
const webpush = require("web-push");


// Configure VAPID
webpush.setVapidDetails(
  "mailto:contact@glupp.fr",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, title, body: messageBody, url } = body;

    if (!user_id || !title) {
      return NextResponse.json({ error: "user_id and title required" }, { status: 400 });
    }

    // Vérifier que l'appelant est admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer les subscriptions de l'utilisateur cible
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (error || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ error: "Aucune subscription push trouvée" }, { status: 404 });
    }

    const payload = JSON.stringify({
      title,
      body: messageBody || "",
      icon: "/icon-192x192.png",
      url: url || "/",
    });

    // Envoyer à toutes les subscriptions de l'utilisateur
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          );
          return { success: true, endpoint: sub.endpoint };
        } catch (err: any) {
          // Si la subscription est expirée, la supprimer
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
          }
          return { success: false, endpoint: sub.endpoint, error: err.message };
        }
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled" && (r.value as any).success).length;

    return NextResponse.json({ sent, total: subscriptions.length });
  } catch (err: any) {
    console.error("Push send error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
