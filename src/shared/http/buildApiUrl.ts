export function buildApiUrl(baseUrl: string, endpoint: string) {
  return new URL(`${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`);
}
