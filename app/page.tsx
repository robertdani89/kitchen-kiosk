"use client";

import { useEffect, useRef, useState } from "react";

const address = "ws://192.168.0.139:8080/api";
const topic = "zigbee2mqtt";

export default function Home() {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs((s) => [new Date().toLocaleTimeString() + " — " + msg, ...s]);

  const connect = async () => {
    addLog(`Connecting to ${address}`);

    try {
      if (clientRef.current) {
        try { clientRef.current.end(); } catch (e) { }
        clientRef.current = null;
      }
    } catch (e) { }
    try {
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) { }
        wsRef.current = null;
      }
    } catch (e) { }

    try {
      const ws = new WebSocket(address);
      wsRef.current = ws;

      ws.addEventListener('open', () => {
        setConnected(true);
        addLog('WebSocket open');
      });

      ws.addEventListener('message', (ev) => {
        const data = typeof ev.data === 'string' ? ev.data : '[binary]';
        addLog(`WS message: ${data}`);
      });

      ws.addEventListener('close', () => {
        setConnected(false);
        addLog('WebSocket closed');
      });

      ws.addEventListener('error', (err) => {
        console.error('WebSocket error:', err);
        addLog('WebSocket error');
      });
    } catch (e) {
      addLog('WebSocket connect error: ' + String(e));
    }
    return;
  };

  useEffect(() => {
    connect();

    return () => {
      try { if (clientRef.current) clientRef.current.end(); } catch (e) { }
      try { if (wsRef.current) wsRef.current.close(); } catch (e) { }
    };
  }, []);

  return (
    <></>

    // <div className="w-full">
    //   <div className="text-sm mb-2">Status: {connected ? "Connected" : "Disconnected"}</div>
    //   <div className="max-h-56 overflow-auto border p-2 bg-gray-50">
    //     {logs.map((l, i) => (
    //       <div key={i} className="text-xs">{l}</div>
    //     ))}
    //   </div>
    // </div>
  );
}
