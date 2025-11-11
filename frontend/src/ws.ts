// src/ws.ts
export type WSMessage<T = any> = { type: string; data: T };

export function openWS(onMessage: (msg: WSMessage) => void): WebSocket {
  // Asume backend en http://localhost:8000
  const url = (location.protocol === "https:" ? "wss://" : "ws://") + "localhost:8000/ws";
  const ws = new WebSocket(url);

  ws.onmessage = (ev) => {
    try {
      const parsed = JSON.parse(ev.data);
      onMessage(parsed);
    } catch {
      // ignorar
    }
  };

  // reconexión básica si se cae
  ws.onclose = () => {
    setTimeout(() => openWS(onMessage), 1500);
  };

  return ws;
}
