// ═══════════════════════════════════════════
// GLUPP — TypeScript Types
// ═══════════════════════════════════════════

// ─── Beer ───
export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface Beer {
  id: string;
  name: string;
  brewery: string;
  country: string;       // Emoji flag
  country_code: string;  // ISO
  style: string;
  abv: number | null;
  ibu: number | null;
  elo: number;
  total_votes: number;
  color: string;
  taste_bitter: number;
  taste_sweet: number;
  taste_fruity: number;
  taste_body: number;
  rarity: Rarity;
  description: string | null;
  image_url: string | null;
  barcode: string | null;
  fun_fact: string | null;
  fun_fact_icon: string;
  region: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UserBeer {
  id: string;
  user_id: string;
  beer_id: string;
  tasted_at: string;
  photo_url: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
  bar_name: string | null;
  notes: string | null;
  rating: number | null;
  glupp_count: number;
  // Joined
  beer?: Beer;
}

// ─── Duel ───
export interface Duel {
  id: string;
  user_id: string;
  beer_a_id: string;
  beer_b_id: string;
  winner_id: string;
  beer_a_elo_before: number;
  beer_a_elo_after: number;
  beer_b_elo_before: number;
  beer_b_elo_after: number;
  created_at: string;
  // Joined
  beer_a?: Beer;
  beer_b?: Beer;
}

// ─── User ───
export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  xp: number;
  duels_played: number;
  beers_tasted: number;
  photos_taken: number;
  created_at: string;
}

// ─── Bar ───
export interface Bar {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
  rating: number;
  total_votes: number;
  is_verified: boolean;
}

export interface BarBeer {
  id: string;
  bar_id: string;
  beer_id: string;
  price: number | null;
  votes: number;
  last_confirmed: string;
  // Joined
  beer?: Beer;
  bar?: Bar;
}

// ─── Social ───
export interface Friendship {
  id: string;
  user_a: string;
  user_b: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
  // Joined
  friend?: Profile;
}

export interface Crew {
  id: string;
  name: string;
  created_by: string;
  xp: number;
  level: number;
  streak: number;
  glupps_together: number;
  created_at: string;
  // Joined
  members?: (Profile & { role: "admin" | "member" })[];
}

// ─── Activity ───
export type ActivityType =
  | "glupp"
  | "duel"
  | "trophy"
  | "level_up"
  | "photo"
  | "tag"
  | "crew_glupp";

export interface Activity {
  id: string;
  user_id: string;
  type: ActivityType;
  beer_id: string | null;
  bar_id: string | null;
  crew_id: string | null;
  photo_url: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  // Joined
  user?: Profile;
  beer?: Beer;
  bar?: Bar;
  tags?: Profile[];
}

// ─── Gamification ───
export interface Trophy {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  category: string | null;
  condition_type: string;
  condition_value: Record<string, unknown>;
  token_value: number;
  xp_reward: number;
}

export interface UserTrophy {
  user_id: string;
  trophy_id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  // Joined
  trophy?: Trophy;
}

export interface GluppOfWeek {
  id: string;
  beer_id: string;
  week_start: string;
  week_end: string;
  bonus_xp: number;
  participants: number;
  // Joined
  beer?: Beer;
}

// ─── Passport ───
export interface PassportRegion {
  country_code: string;
  country: string;      // Emoji
  region?: string;
  total: number;
  tasted: number;
}

// ─── Bar Reviews ───
export type BarCriteria = "ambiance" | "beer_selection" | "price" | "service";

export interface BarReview {
  id: string;
  user_id: string;
  bar_id: string;
  ambiance: number;        // 1-5
  beer_selection: number;  // 1-5
  price: number;           // 1-5
  service: number;         // 1-5
  comment: string | null;
  created_at: string;
  // Joined
  user?: Profile;
}

export interface BarWithReviews extends Bar {
  distance?: number;
  glupp_rating: number;
  glupp_total_reviews: number;
  avg_ambiance: number;
  avg_beer_selection: number;
  avg_price: number;
  avg_service: number;
  google_rating?: number;
  google_place_id?: string;
}

// ─── Moment Voting ───
export type Moment = "barbecue" | "hiver" | "apero" | "rdv" | "soiree" | "brunch";

export interface MomentVote {
  id: string;
  user_id: string;
  beer_id: string;
  moment: Moment;
}
