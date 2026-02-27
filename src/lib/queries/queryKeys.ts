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
    user: (userId: string) => ["profile", "user", userId] as const,
  },

  bars: {
    all: ["bars", "all"] as const,
  },

  gluppOfWeek: {
    current: ["gluppOfWeek", "current"] as const,
  },

  // Sprint 3 — Social
  friends: {
    all: ["friends", "all"] as const,
    requests: ["friends", "requests"] as const,
    search: (query: string) => ["friends", "search", query] as const,
  },

  activities: {
    feed: ["activities", "feed"] as const,
    user: (userId: string) => ["activities", "user", userId] as const,
  },

  trophies: {
    all: ["trophies", "all"] as const,
    user: (userId: string) => ["trophies", "user", userId] as const,
  },

  notifications: {
    all: ["notifications", "all"] as const,
  },

  crews: {
    all: ["crews", "all"] as const,
    detail: (crewId: string) => ["crews", "detail", crewId] as const,
  },

  passport: {
    all: ["passport", "all"] as const,
  },

  barReviews: {
    bar: (barId: string) => ["barReviews", "bar", barId] as const,
    user: (barId: string) => ["barReviews", "user", barId] as const,
  },
} as const;
