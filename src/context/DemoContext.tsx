"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createSeedState, STATE_VERSION } from "@/data/seed";
import type { Actor } from "@/lib/mock-service";
import type { DemoState, DemoUser, MockSession, ServiceResult } from "@/types";

const STATE_KEY = "agri-demo-state";
const SESSION_KEY = "agri-demo-session";

type DemoContextValue = {
  state: DemoState;
  /** false until localStorage has been read on the client — avoid redirect decisions before this. */
  ready: boolean;
  session: MockSession | null;
  user: DemoUser | null;
  actor: Actor;
  /** Apply a pure service function to the latest state. Returns its result. */
  run: <R>(fn: (s: DemoState) => ServiceResult<R>) => ServiceResult<R>;
  loginAs: (userId: string) => void;
  loginWithEmail: (email: string) => DemoUser | null;
  logout: () => void;
  resetDemo: () => void;
};

const Ctx = createContext<DemoContextValue | null>(null);

const safeGet = (k: string): string | null => {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
};
const safeSet = (k: string, v: string | null) => {
  try {
    if (v === null) window.localStorage.removeItem(k);
    else window.localStorage.setItem(k, v);
  } catch {
    /* storage unavailable: UI must still work */
  }
};

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => createSeedState());
  const stateRef = useRef(state);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage once on the client (external system → state, so it must run after mount
  // to keep server and first client render identical).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const raw = safeGet(STATE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as DemoState;
        if (parsed.version === STATE_VERSION) {
          stateRef.current = parsed;
          setState(parsed);
        }
      } catch {
        /* ignore corrupt data; seed state remains */
      }
    }
    setSessionUserId(safeGet(SESSION_KEY));
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (ready) safeSet(STATE_KEY, JSON.stringify(state));
  }, [state, ready]);

  const run = useCallback(<R,>(fn: (s: DemoState) => ServiceResult<R>): ServiceResult<R> => {
    const out = fn(stateRef.current);
    if (out.ok) {
      stateRef.current = out.state;
      setState(out.state);
    }
    return out;
  }, []);

  const loginAs = useCallback((userId: string) => {
    setSessionUserId(userId);
    safeSet(SESSION_KEY, userId);
  }, []);

  const loginWithEmail = useCallback((email: string) => {
    const u = stateRef.current.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase()) ?? null;
    if (u) {
      setSessionUserId(u.id);
      safeSet(SESSION_KEY, u.id);
    }
    return u;
  }, []);

  const logout = useCallback(() => {
    setSessionUserId(null);
    safeSet(SESSION_KEY, null);
  }, []);

  const resetDemo = useCallback(() => {
    const seed = createSeedState();
    stateRef.current = seed;
    setState(seed);
  }, []);

  const user = useMemo(() => state.users.find((u) => u.id === sessionUserId) ?? null, [state.users, sessionUserId]);
  const session = useMemo<MockSession | null>(
    () => (user ? { userId: user.id, name: user.name, email: user.email, role: user.role, isDemo: true } : null),
    [user],
  );
  const actor = useMemo<Actor>(() => (user ? { id: user.id, name: user.name, role: user.role } : { name: "Anonymous", role: "system" }), [user]);

  const value = useMemo<DemoContextValue>(
    () => ({ state, ready, session, user, actor, run, loginAs, loginWithEmail, logout, resetDemo }),
    [state, ready, session, user, actor, run, loginAs, loginWithEmail, logout, resetDemo],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemo(): DemoContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDemo must be used inside <DemoProvider>");
  return v;
}
