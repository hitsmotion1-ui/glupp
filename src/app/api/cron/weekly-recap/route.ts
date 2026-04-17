import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  // Vérifier l'auth cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Récupérer tous les users actifs avec push subscriptions
    const { data: users } = await supabase
      .from("profiles")
      .select("id, username")
      .gt("beers_tasted", 0);

    if (!users || users.length === 0) {
      return NextResponse.json({ message: "No users" });
    }

    let sent = 0;

    for (const user of users) {
      // Récupérer le recap de la semaine
      const { data: recap } = await supabase.rpc("get_weekly_recap", {
        p_user_id: user.id,
      });

      if (!recap) continue;

      const glupps = recap.glupps || 0;
      const duels = recap.duels || 0;
      const xp = recap.xp_gained || 0;

      // Construire le message
      let message: string;
      if (glupps === 0 && duels === 0) {
        message = `Semaine tranquille @${user.username} ! Reviens glupper cette semaine 🍺`;
      } else {
        const parts: string[] = [];
        if (glupps > 0) parts.push(`${glupps} glupp${glupps > 1 ? "s" : ""}`);
        if (duels > 0) parts.push(`${duels} duel${duels > 1 ? "s" : ""}`);
        if (xp > 0) parts.push(`+${xp} XP`);
        message = `${parts.join(", ")} cette semaine ! Consulte ton recap 📊`;
      }

      // Insérer la notification (le trigger push se charge de l'envoi)
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "system",
        title: "Ton recap de la semaine 📊",
        message,
        metadata: { type: "weekly_recap", url: "/recap" },
      });

      sent++;
    }

    return NextResponse.json({ success: true, sent });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
