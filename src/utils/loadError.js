// Turns a failed API request into a message explaining why the data is missing.
export function loadErrorMessage(err, what = 'data') {
  if (!err?.response) return `Could not reach the server to load ${what}. Check your connection.`;
  if (err.response.status === 403) return `You don't have permission to view ${what}.`;
  return err.response.data?.message || `Failed to load ${what}. Please try again.`;
}
