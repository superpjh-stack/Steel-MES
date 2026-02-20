'use client';

import { useEffect, useRef, useState } from 'react';

export interface SSEState<T> {
  data: T | null;
  error: string | null;
  isConnected: boolean;
}

/**
 * Server-Sent Events hook with automatic reconnection.
 *
 * EventSource natively retries on network errors — we must NOT call es.close()
 * in onerror, or the reconnection stops. Instead, we track disconnected state
 * and let the browser handle reconnection.
 */
export function useProductionSSE<T>(url: string): SSEState<T> {
  const [data, setData]               = useState<T | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    es.onmessage = (e) => {
      try {
        setData(JSON.parse(e.data));
      } catch {
        setError('데이터 파싱 오류');
      }
    };

    // Do NOT call es.close() here — EventSource will reconnect automatically
    es.onerror = () => {
      setIsConnected(false);
      setError('연결 오류 — 재연결 중...');
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [url]);

  return { data, error, isConnected };
}
