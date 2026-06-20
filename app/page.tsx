"use client";

import { useEffect, useRef, useState } from "react";

const topic = "zigbee2mqtt";

export default function Home() {
  const [address, setAddress] = useState("ws://192.168.0.139:8080/api");
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [useWs, setUseWs] = useState<boolean>(() => address.startsWith("ws://") || address.startsWith("wss://"));

  const addLog = (msg: string) => setLogs((s) => [new Date().toLocaleTimeString() + " — " + msg, ...s]);

  const connect = async () => {
    addLog(`Connecting to ${address} (${useWs ? 'raw WebSocket' : 'mqtt'})`);

    // Close existing connections
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

    if (useWs) {
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
    }

    // MQTT mode
    try {
      const mqttModule = await import("mqtt");
      const mqtt = mqttModule.default ?? mqttModule;
      const client = mqtt.connect(address, { connectTimeout: 5000, reconnectPeriod: 2000 });
      clientRef.current = client;

      client.on("connect", () => {
        setConnected(true);
        addLog("Connected");
        try {
          client.subscribe(topic, (err: any) => {
            if (!err) addLog(`Subscribed to ${topic}`);
          });
        } catch (e) { }
      });

      client.on("reconnect", () => addLog("Reconnecting..."));
      client.on("close", () => {
        setConnected(false);
        addLog("Connection closed");
      });
      client.on("error", (err: any) => {
        console.error("MQTT error:", err);
        addLog("Error: " + String(err?.message ?? err));
      });
      client.on("message", (topic: string, payload: Uint8Array) => addLog(`Message ${topic}: ${payload.toString()}`));
    } catch (e) {
      addLog('MQTT init error: ' + String(e));
    }
  };

  const startDiscover = () => {
    if (!connected) return addLog("Not connected");
    if (useWs) {
      setDiscovering(true);
      addLog('Raw WebSocket mode: listening to all incoming WS messages');
      return;
    }
    if (!clientRef.current) return addLog("Not connected (mqtt)");
    try {
      clientRef.current.subscribe('#', (err: any) => {
        if (!err) {
          setDiscovering(true);
          addLog('Subscribed to # (discovering topics)');
        } else addLog('Subscribe error: ' + String(err));
      });
    } catch (e) {
      addLog('Subscribe exception: ' + String(e));
    }
  };

  const stopDiscover = () => {
    if (useWs) {
      setDiscovering(false);
      addLog('Stopped listening (raw WebSocket)');
      return;
    }
    if (!clientRef.current) return;
    try {
      clientRef.current.unsubscribe('#', (err: any) => {
        if (!err) {
          setDiscovering(false);
          addLog('Unsubscribed from #');
        } else addLog('Unsubscribe error: ' + String(err));
      });
    } catch (e) {
      addLog('Unsubscribe exception: ' + String(e));
    }
  };

  const publishTest = () => {
    if (useWs) {
      if (!wsRef.current || !connected) return addLog('Not connected');
      try {
        // send a simple text message over raw WS
        wsRef.current.send('hello from client');
        addLog('Sent raw WS message');
      } catch (e) {
        addLog('WS send error: ' + String(e));
      }
      return;
    }
    if (clientRef.current && connected) {
      clientRef.current.publish(topic, "hello from client");
      addLog(`Published to ${topic}`);
    } else {
      addLog("Not connected");
    }
  };

  useEffect(() => {
    return () => {
      try { if (clientRef.current) clientRef.current.end(); } catch (e) { }
      try { if (wsRef.current) wsRef.current.close(); } catch (e) { }
    };
  }, []);

  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans dark:bg-black cursor-default p-8">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-12 px-8 bg-white dark:bg-black sm:items-start rounded-md shadow">
        <h1 className="text-2xl font-semibold mb-4">MQTT Client</h1>

        <div className="w-full mb-4">
          <label className="block text-sm">Address</label>
          <input className="border p-2 w-full" value={address} onChange={(e) => setAddress(e.target.value)} />
          <label className="inline-flex items-center gap-2 mt-2 text-sm">
            <input type="checkbox" checked={useWs} onChange={(e) => setUseWs(e.target.checked)} />
            <span>Use raw WebSocket</span>
          </label>
        </div>

        <div className="flex gap-2 mb-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={connect}>
            Connect
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={publishTest}>
            Publish Test
          </button>
          {!discovering ? (
            <button className="px-4 py-2 bg-yellow-600 text-white rounded" onClick={startDiscover}>
              Discover Topics
            </button>
          ) : (
            <button className="px-4 py-2 bg-gray-600 text-white rounded" onClick={stopDiscover}>
              Stop Discover
            </button>
          )}
        </div>

        <div className="w-full">
          <div className="text-sm mb-2">Status: {connected ? "Connected" : "Disconnected"}</div>
          <div className="max-h-56 overflow-auto border p-2 bg-gray-50">
            {logs.map((l, i) => (
              <div key={i} className="text-xs">{l}</div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
