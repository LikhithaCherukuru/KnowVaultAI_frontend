// The current backend does not expose /jobs, /search/history, /dashboard/stats,
// /chat/conversations, or /history endpoints. These modules are placeholders
// that make it easy to connect later when those endpoints become available.
// No fake data is returned — calling these functions will produce a clear error.

export const jobsApi = {
  notAvailable: 'The backend does not currently expose a /jobs endpoint.',
};
