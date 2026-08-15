export const ROUTES = {
  home: "/dawahcast",
  trending: "/dawahcast/trending",
  new: "/dawahcast/new",
  ramadan: "/dawahcast/ramadan",
  lecturers: "/dawahcast/lecturers",
  recitations: "/dawahcast/recitations",
  videos: "/dawahcast/videos",
  playlists: "/dawahcast/playlists",
  categories: "/dawahcast/categories",

  album: (id: string | number) => `/dawahcast/a/${id}`,
  lecture: (id: string | number) => `/dawahcast/l/${id}`,
  resourcePerson: (id: string | number) => `/dawahcast/rp/${id}`,
  playlist: (id: string | number) => `/dawahcast/pl/${id}`,
  video: (id: string | number) => `/dawahcast/videos/${id}`,
  category: (id: string | number) => `/dawahcast/categories/${id}`,
  ramadanYear: (id: string | number) => `/dawahcast/ramadan/year/${id}`,

  more: "/dawahcast/more",
  moreRecent: "/dawahcast/more/recent",
  moreRecentlyViewed: "/dawahcast/more/recently-viewed",
  moreTrending: "/dawahcast/more/trending",
  moreRecommended: "/dawahcast/more/recommended",

  charts: "/dawahcast/charts",
  search: "/dawahcast/search",
  privacy: "/dawahcast/privacy",
  terms: "/dawahcast/terms",
  download: "/dawahcast/download",
  recommend1: "/dawahcast/recommend1",
  recommend2: "/dawahcast/recommend2",
  leaderboard: "/dawahcast/ramadan/leaderboard",
  ramadanDetail: (id: string | number) => `/dawahcast/ramadan/${id}`,

  // Genres are an alias of categories in the CRA.
  genres: "/dawahcast/genres",
  genre: (id: string | number) => `/dawahcast/genres/${id}`,

  // Auth-gated
  favourite: "/dawahcast/favourite",
  library: "/dawahcast/library",
  account: "/dawahcast/account",
  myplaylist: "/dawahcast/myplaylist",
} as const;
