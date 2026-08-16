export const requireSupabaseAuth = {
  server: async ({ next }: { next: (payload?: unknown) => unknown }) => next(),
};
