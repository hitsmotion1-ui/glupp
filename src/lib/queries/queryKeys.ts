// Centralized query key factory for React Query
// Ensures consistent keys across the app for cache invalidation

export const queryKeys = {
  auth: {
    user: ["auth", "user"] as const,
  },

  beers: {
    all: ["beers", "all"] as const,
    detail: (id: string) => ["beers", "detail", id] as const,
  },

  collection: {
    all: ["collection", "all"] as const,
  },

  duel: {
    tastedBeers: ["duel", "tastedBeers"] as const,
  },

  ranking: {
    all: ["ranking", "all"] as const,
  },

  profile: {
    me: ["profile", "me"] as const,
  },

  bars: {
    all: ["bars", "all"] as const,
  },

  gluppOfWeek: {
    current: ["gluppOfWeek", "current"] as const,
  },

  trophies: {
    all: ["trophies", "all"] as const,
  },

  passport: {
    all: ["passport", "all"] as const,
  },
} as const;
