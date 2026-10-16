import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  AuthMethod,
  DerivSession,
  fetchPartnerOverview,
  getDateRange,
} from '@/lib/deriv';
import {
  DEFAULT_DERIV_APP_ID,
  DEFAULT_OAUTH_CLIENT_ID,
  DEFAULT_OAUTH_REDIRECT_URI,
} from '@/lib/config';

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = 'deriv.access-token';
const METHOD_KEY = 'deriv.auth-method';
const SETTINGS_KEY = 'deriv.connection-settings';

export interface DerivSettings {
  appId: string;
  oauthClientId: string;
  redirectUri: string;
}

interface AuthContextValue {
  isReady: boolean;
  session: DerivSession | null;
  settings: DerivSettings;
  connectWithToken: (token: string) => Promise<void>;
  connectWithOAuth: () => Promise<void>;
  saveSettings: (settings: DerivSettings) => Promise<void>;
  disconnect: () => Promise<void>;
}

const defaultSettings: DerivSettings = {
  appId: DEFAULT_DERIV_APP_ID,
  oauthClientId: DEFAULT_OAUTH_CLIENT_ID,
  redirectUri: DEFAULT_OAUTH_REDIRECT_URI,
};

const AuthContext = createContext<AuthContextValue | null>(null);

function encodeBase64Url(bytes: Uint8Array): string {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let encoded = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const value = (first << 16) | (second << 8) | third;
    encoded += alphabet[(value >> 18) & 63];
    encoded += alphabet[(value >> 12) & 63];
    encoded += index + 1 < bytes.length ? alphabet[(value >> 6) & 63] : '=';
    encoded += index + 2 < bytes.length ? alphabet[value & 63] : '=';
  }
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function nextSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseErrorMessage(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) return null;
  const object = value as Record<string, unknown>;
  if (typeof object.error_description === 'string') {
    return object.error_description;
  }
  if (typeof object.message === 'string') return object.message;
  if (typeof object.error === 'string') return object.error;
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [method, setMethod] = useState<AuthMethod | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [settings, setSettings] = useState<DerivSettings>(defaultSettings);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [savedToken, savedMethod, savedSettings] = await Promise.all([
          Platform.OS === 'web'
            ? Promise.resolve(null)
            : SecureStore.getItemAsync(TOKEN_KEY),
          AsyncStorage.getItem(METHOD_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ]);
        if (!mounted) return;
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings) as Partial<DerivSettings>;
          setSettings({ ...defaultSettings, ...parsed });
        }
        if (savedToken && (savedMethod === 'pat' || savedMethod === 'oauth')) {
          setToken(savedToken);
          setMethod(savedMethod);
          setSessionId(nextSessionId());
        }
      } finally {
        if (mounted) setIsReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const session = useMemo<DerivSession | null>(() => {
    if (!token || !method || !sessionId) return null;
    return { token, method, appId: settings.appId, id: sessionId };
  }, [method, sessionId, settings.appId, token]);

  const saveSettings = useCallback(async (next: DerivSettings) => {
    const normalized = {
      appId: next.appId.trim(),
      oauthClientId: next.oauthClientId.trim(),
      redirectUri: next.redirectUri.trim(),
    };
    if (!normalized.appId) throw new Error('Enter a Deriv App ID.');
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
    setSettings(normalized);
  }, []);

  const finishConnection = useCallback(
    async (accessToken: string, authMethod: AuthMethod) => {
      if (!settings.appId.trim()) throw new Error('Enter a Deriv App ID in Settings.');
      await fetchPartnerOverview(
        {
          token: accessToken,
          method: authMethod,
          appId: settings.appId,
          id: 'validation',
        },
        getDateRange('7d'),
      );
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
      }
      await AsyncStorage.setItem(METHOD_KEY, authMethod);
      setToken(accessToken);
      setMethod(authMethod);
      setSessionId(nextSessionId());
      await queryClient.invalidateQueries();
    },
    [queryClient, settings.appId],
  );

  const connectWithToken = useCallback(
    async (value: string) => {
      const accessToken = value.trim();
      if (!accessToken) throw new Error('Paste your Deriv personal access token.');
      await finishConnection(accessToken, 'pat');
    },
    [finishConnection],
  );

  const connectWithOAuth = useCallback(async () => {
    const clientId = settings.oauthClientId.trim();
    const redirectUri = settings.redirectUri.trim();
    if (!clientId) {
      throw new Error('Add your registered OAuth Client ID in Settings first.');
    }
    if (!redirectUri) {
      throw new Error('Add the redirect URL registered with Deriv in Settings.');
    }

    const verifier = encodeBase64Url(await Crypto.getRandomBytesAsync(64));
    const state = encodeBase64Url(await Crypto.getRandomBytesAsync(16));
    const challengeBase64 = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      verifier,
      { encoding: Crypto.CryptoEncoding.BASE64 },
    );
    const challenge = challengeBase64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const authUrl = new URL('https://auth.deriv.com/oauth2/auth');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'application_read trade');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', challenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    const authResult = await WebBrowser.openAuthSessionAsync(
      authUrl.toString(),
      redirectUri,
    );
    if (authResult.type !== 'success' || !authResult.url) {
      throw new Error('Deriv sign-in was cancelled or did not return to the app.');
    }

    const callback = new URL(authResult.url);
    const oauthError = callback.searchParams.get('error');
    if (oauthError) {
      throw new Error(
        callback.searchParams.get('error_description') ?? oauthError,
      );
    }
    if (callback.searchParams.get('state') !== state) {
      throw new Error('The Deriv sign-in response could not be verified.');
    }
    const code = callback.searchParams.get('code');
    if (!code) throw new Error('Deriv did not return an authorization code.');

    const body = [
      ['grant_type', 'authorization_code'],
      ['client_id', clientId],
      ['code', code],
      ['redirect_uri', redirectUri],
      ['code_verifier', verifier],
    ]
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    const response = await fetch('https://auth.deriv.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(
        parseErrorMessage(payload) ?? `Deriv sign-in failed (${response.status}).`,
      );
    }
    const accessToken =
      typeof payload === 'object' && payload !== null
        ? (payload as Record<string, unknown>).access_token
        : null;
    if (typeof accessToken !== 'string' || !accessToken) {
      throw new Error('Deriv did not return an access token.');
    }
    await finishConnection(accessToken, 'oauth');
  }, [finishConnection, settings.oauthClientId, settings.redirectUri]);

  const disconnect = useCallback(async () => {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
    await AsyncStorage.removeItem(METHOD_KEY);
    setToken(null);
    setMethod(null);
    setSessionId(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({
      isReady,
      session,
      settings,
      connectWithToken,
      connectWithOAuth,
      saveSettings,
      disconnect,
    }),
    [
      connectWithOAuth,
      connectWithToken,
      disconnect,
      isReady,
      saveSettings,
      session,
      settings,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
