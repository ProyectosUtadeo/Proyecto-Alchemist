export const AUTH_CHANGED_EVENT = "auth-token-changed";

function notifyAuthChange() {
  try {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  } catch {
    
  }
}

export function getToken() {
  return localStorage.getItem("jwt") || "";
}
export function setToken(t: string) {
  localStorage.setItem("jwt", t);
  notifyAuthChange();
}
export function clearToken() {
  localStorage.removeItem("jwt");
  notifyAuthChange();
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
