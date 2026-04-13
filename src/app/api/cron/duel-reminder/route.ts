import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const webpush = require("web-push");

export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret pour sécuriser le cron
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    webpush.setVapidDetails(
      "mailto:contact@glupp.fr",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    // Client Supabase avec service role pour accéder à toutes les données
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Heure actuelle en France (UTC+1 ou UTC+2 selon été/hiver)
    const now = new Date();
    const franceTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
    const currentHour = franceTime.getHours();
    const currentMinute = franceTime.getMinutes();

    // Fenêtre de 15 minutes (le cron tourne toutes les 15 min)
    // Ex: si cron à 18h00, on attrape les rappels entre 18h00 et 18h14
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, username, beers_tasted, duel_reminder_hour, duel_reminder_minute")
      .eq("duel_reminder_enabled", true)
      .eq("duel_reminder_hour", currentHour)
      .gte("duel_reminder_minute", currentMinute - 7)
      .lte("duel_reminder_minute", currentMinute + 7);

    if (usersError || !users || users.length === 0) {
      return NextResponse.json({ sent: 0, reason: "no users to remind" });
    }

    let sent = 0;

    for (const user of users) {
      // Vérifier que l'user a au moins 2 bières (sinon pas de duels possibles)
      if (user.beers_tasted < 2) continue;

      // Vérifier qu'il n'a pas déjà fait ses 3 duels aujourd'hui
      const todayStart = new Date(franceTime);
      todayStart.setHours(0, 0, 0, 0);

      const { count: duelsToday } = await supabase
        .from("duels")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString());

      if ((duelsToday || 0) >= 3) continue;

      // Vérifier qu'il a des paires de duels disponibles
      const { count: tastedCount } = await supabase
        .from("user_beers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: playedDuels } = await supabase
        .from("duels")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Nombre max de paires possibles = n*(n-1)/2
      const n = tastedCount || 0;
      const maxPairs = (n * (n - 1)) / 2;
      if ((playedDuels || 0) >= maxPairs) continue;

      // Récupérer les subscriptions push
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", user.id);

      if (!subs || subs.length === 0) continue;

      const remaining = 3 - (duelsToday || 0);
      const payload = JSON.stringify({
        title: "⚔️ Tes duels t'attendent !",
        body: `Tu as encore ${remaining} duel${remaining > 1 ? "s" : ""} à jouer aujourd'hui. Lance-toi !`,
        icon: "/icon-192x192.png",
        url: "/duel",
      });

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sent++;
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          }
        }
      }
    }

    return NextResponse.json({ sent, checked: users.length, hour: currentHour, minute: currentMinute });
  } catch (err: any) {
    console.error("Duel reminder error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
