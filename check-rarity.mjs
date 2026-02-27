import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://yuymwggxnaaoxlshwwyn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1eW13Z2d4bmFhb3hsc2h3d3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODc5NjcsImV4cCI6MjA4NjU2Mzk2N30.sbJJGoNpp5tzvGGtXM4gnTtBGErixlPfMs15nSGnobM"
);

let all = [];
let page = 0;
while (true) {
  const { data } = await supabase
    .from("beers")
    .select("rarity, name, brewery, style")
    .range(page * 1000, (page + 1) * 1000 - 1);
  all = all.concat(data);
  if (data.length < 1000) break;
  page++;
}

const dist = { common: 0, rare: 0, epic: 0, legendary: 0 };
all.forEach(b => dist[b.rarity]++);

console.log(`\n📊 Distribution finale (${all.length} bières) :`);
Object.entries(dist).forEach(([r, c]) =>
  console.log(`   ${r.padEnd(12)} ${c} (${(c / all.length * 100).toFixed(1)}%)`)
);

// Exemples de legendary
const legendaries = all.filter(b => b.rarity === "legendary");
if (legendaries.length > 0) {
  console.log("\n🏆 Bières légendaires :");
  legendaries.forEach(b => console.log(`   ${b.name} — ${b.brewery} [${b.style}]`));
}
