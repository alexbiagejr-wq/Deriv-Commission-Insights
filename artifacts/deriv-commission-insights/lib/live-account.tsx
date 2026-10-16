import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '@/lib/auth';

export type LiveStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface LiveTransaction {
  id: string;
  description: string;
  amount: number;
  currency: string;
  timestamp: number;
}

interface LiveAccountValue {
  status: LiveStatus;
  error: string | null;
  balance: { amount: number; currency: string } | null;
  transactions: LiveTransaction[];
  reconnect: () => void;
}

const LiveAccountContext = createContext<LiveAccountValue | null>(null);

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

export function LiveAccountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = useAuth();
  const [status, setStatus] = useState<LiveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<{
    amount: number;
    currency: string;
  } | null>(null);
  const [transactions, setTransactions] = useState<LiveTransaction[]>([]);
  const [attempt, setAttempt] = useState(0);

  const reconnect = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    setTransactions([]);
    setBalance(null);
    setError(null);
    if (!session) {
      setStatus('idle');
      return;
    }

    let intentionallyClosed = false;
    let authorized = false;
    setStatus('connecting');
    const url = `wss://ws.derivws.com/websockets/v3?app_id=${encodeURIComponent(session.appId)}`;
    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch {
      setStatus('error');
      setError('Could not start the Deriv WebSocket connection.');
      return;
    }

    const connectionTimeout = setTimeout(() => {
      if (!authorized) {
        setStatus('error');
        setError('Deriv did not respond. Check the App ID and your connection.');
        socket.close();
      }
    }, 12000);

    socket.onopen = () => {
      socket.send(JSON.stringify({ authorize: session.token, req_id: 1 }));
    };

    socket.onmessage = (event) => {
      let message: Record<string, unknown> | null = null;
      try {
        message = asRecord(JSON.parse(String(event.data)));
      } catch {
        return;
      }
      if (!message) return;

      const apiError = asRecord(message.error);
      if (apiError) {
        clearTimeout(connectionTimeout);
        setStatus('error');
        setError(
          typeof apiError.message === 'string'
            ? apiError.message
            : 'Deriv rejected the live account connection.',
        );
        socket.close();
        return;
      }

      const messageType = message.msg_type;
      if (messageType === 'authorize' || asRecord(message.authorize)) {
        authorized = true;
        clearTimeout(connectionTimeout);
        setStatus('connected');
        setError(null);
        socket.send(JSON.stringify({ balance: 1, subscribe: 1, req_id: 2 }));
        socket.send(JSON.stringify({ transaction: 1, subscribe: 1, req_id: 3 }));
        return;
      }

      if (messageType === 'balance') {
        const data = asRecord(message.balance);
        const amount = data?.balance;
        const currency = data?.currency;
        if (typeof amount === 'number') {
          setBalance({
            amount,
            currency: typeof currency === 'string' ? currency : 'USD',
          });
        }
        return;
      }

      if (messageType === 'transaction') {
        const data = asRecord(message.transaction);
        if (!data) return;
        const id =
          String(data.transaction_id ?? data.contract_id ?? Date.now());
        const amount = Number(data.amount ?? 0);
        const description =
          String(
            data.longcode ??
              data.action ??
              data.transaction_type ??
              data.type ??
              'Account transaction',
          );
        const timestamp = Number(data.transaction_time ?? Date.now() / 1000);
        const currency =
          typeof data.currency === 'string' ? data.currency : 'USD';
        setTransactions((current) =>
          [
            {
              id,
              description,
              amount: Number.isFinite(amount) ? amount : 0,
              currency,
              timestamp,
            },
            ...current.filter((item) => item.id !== id),
          ].slice(0, 12),
        );
      }
    };

    socket.onerror = () => {
      clearTimeout(connectionTimeout);
      setStatus('error');
      setError('Unable to connect to Deriv right now.');
    };

    socket.onclose = () => {
      clearTimeout(connectionTimeout);
      if (!intentionallyClosed && authorized) {
        setStatus('error');
        setError('The live Deriv connection closed. Tap reconnect to try again.');
      }
    };

    return () => {
      intentionallyClosed = true;
      clearTimeout(connectionTimeout);
      socket.close();
    };
  }, [attempt, session]);

  const value = useMemo(
    () => ({ status, error, balance, transactions, reconnect }),
    [balance, error, reconnect, status, transactions],
  );

  return (
    <LiveAccountContext.Provider value={value}>
      {children}
    </LiveAccountContext.Provider>
  );
}

export function useLiveAccount(): LiveAccountValue {
  const value = useContext(LiveAccountContext);
  if (!value) {
    throw new Error('useLiveAccount must be used inside LiveAccountProvider.');
  }
  return value;
}
