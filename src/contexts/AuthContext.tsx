import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_USER_ID, endDemo, isDemoActive, startDemo } from "@/lib/demoStore";
import { loadOnboardingDraft } from "@/lib/onboardingDraft";

export interface AuthResult {
  error: Error | null;
  // True when a new account was created and a session started immediately.
  signedIn?: boolean;
  // True when the email address is already registered.
  alreadyRegistered?: boolean;
  // True when the account was created but needs email confirmation first.
  needsConfirmation?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemo: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  startDemoMode: () => void;
  resendConfirmation: (email: string) => Promise<{ error: Error | null }>;
  sendPasswordReset: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const demoUser = {
  id: DEMO_USER_ID,
  email: "demo@nutrigen.app",
  app_metadata: {},
  user_metadata: { full_name: "Demo User" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as User;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [realUser, setRealUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(isDemoActive());
  const demoRef = useRef(isDemo);

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (demoRef.current) return;
        setSession(nextSession);
        setRealUser(nextSession?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      if (!demoRef.current) {
        setSession(existing);
        setRealUser(existing?.user ?? null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const leaveDemo = () => {
    if (!demoRef.current) return;
    endDemo();
    demoRef.current = false;
    setIsDemo(false);
    queryClient.clear();
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<AuthResult> => {
    leaveDemo();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) return { error };

    // Supabase returns a user with no identities (and no error) when the
    // email is already registered, to avoid leaking which emails exist.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { error: null, alreadyRegistered: true };
    }
    if (data.session) return { error: null, signedIn: true };
    return { error: null, needsConfirmation: true };
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    leaveDemo();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error, signedIn: !error };
  };

  const signOut = async () => {
    if (demoRef.current) {
      leaveDemo();
      return;
    }
    await supabase.auth.signOut({ scope: "local" });
    queryClient.clear();
  };

  const startDemoMode = () => {
    startDemo(loadOnboardingDraft());
    queryClient.clear();
    demoRef.current = true;
    setIsDemo(true);
    setLoading(false);
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error };
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const user = isDemo ? demoUser : realUser;
  const value = useMemo(
    () => ({
      user,
      session,
      loading: isDemo ? false : loading,
      isDemo,
      signUp,
      signIn,
      signOut,
      startDemoMode,
      resendConfirmation,
      sendPasswordReset,
      updatePassword,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, session, loading, isDemo]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
