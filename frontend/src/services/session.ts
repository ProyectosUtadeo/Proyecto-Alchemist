export function getToken() {
  return localStorage.getItem("jwt") || "";
}
export function setToken(t: string) {
  localStorage.setItem("jwt", t);
}
export function clearToken() {
  localStorage.removeItem("jwt");
}
export function decodeRole(): "ALCHEMIST" | "SUPERVISOR" | null {
  const t = getToken();
  if (!t) return null;
  try {
    const [, payload] = t.split(".");
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return json.role || null;
  } catch {
    return null;
  }
}
