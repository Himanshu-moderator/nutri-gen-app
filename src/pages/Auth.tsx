import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { loadOnboardingDraft } from "@/lib/onboardingDraft";

type AuthMode = "login" | "signup";
type Panel = "form" | "confirm" | "forgot";

const MIN_PASSWORD = 8;

// Turns Supabase's raw error text into something a person can act on.
const friendlyError = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Incorrect email or password.";
  if (m.includes("email not confirmed")) return "Please confirm your email first. Check your inbox for the link.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "An account with this email already exists. Try signing in instead.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("failed to fetch") || m.includes("network"))
    return "Couldn't reach the server. Check your connection and try again.";
  if (m.includes("password should be")) return `Password must be at least ${MIN_PASSWORD} characters.`;
  return message || "Something went wrong. Please try again.";
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(searchParams.get("mode") === "signup" ? "signup" : "login");
  const [panel, setPanel] = useState<Panel>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const {
    user,
    loading: authLoading,
    signIn,
    signUp,
    startDemoMode,
    resendConfirmation,
    sendPasswordReset,
  } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Already signed in: nothing to do here.
  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard", { replace: true });
  }, [user, authLoading, navigate]);

  const fail = (message: string) =>
    toast({ title: "Something went wrong", description: friendlyError(message), variant: "destructive" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanEmail = email.trim();

    try {
      if (mode === "login") {
        const { error } = await signIn(cleanEmail, password);
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) setNeedsConfirmation(true);
          throw error;
        }
        navigate("/dashboard");
        return;
      }

      const result = await signUp(cleanEmail, password, fullName.trim());
      if (result.error) throw result.error;

      if (result.alreadyRegistered) {
        setMode("login");
        toast({
          title: "You already have an account",
          description: "Sign in with this email to continue.",
        });
      } else if (result.signedIn) {
        navigate("/dashboard");
      } else {
        setPanel("confirm");
      }
    } catch (error) {
      fail(error instanceof Error ? error.message : "");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const { error } = await resendConfirmation(email.trim());
    if (error) {
      fail(error.message);
    } else {
      toast({ title: "Email sent", description: `We sent a new link to ${email.trim()}.` });
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await sendPasswordReset(email.trim());
    setLoading(false);
    if (error) {
      fail(error.message);
    } else {
      toast({
        title: "Check your email",
        description: "If an account exists for that address, a reset link is on its way.",
      });
      setPanel("form");
    }
  };

  const handleDemo = () => {
    startDemoMode();
    navigate("/dashboard");
  };

  const goBack = () => navigate(mode === "signup" && loadOnboardingDraft() ? "/trial" : "/");

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setNeedsConfirmation(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4">
        <Button variant="ghost" size="icon" aria-label="Back" onClick={goBack} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-12">
        <motion.div
          key={panel}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-sm mx-auto w-full"
        >
          {panel === "confirm" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
                <MailCheck className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">Check your email</h1>
              <p className="text-muted-foreground">
                We sent a confirmation link to <span className="font-medium text-foreground">{email.trim()}</span>.
                Open it to activate your account, then sign in.
                {loadOnboardingDraft() && " Your preferences are saved and will be applied automatically."}
              </p>
              <div className="space-y-2 pt-2">
                <Button
                  className="w-full gradient-primary text-primary-foreground h-12"
                  onClick={() => {
                    setMode("login");
                    setPanel("form");
                  }}
                >
                  Go to sign in
                </Button>
                <Button variant="ghost" className="w-full" onClick={handleResend}>
                  Resend email
                </Button>
              </div>
            </div>
          )}

          {panel === "forgot" && (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold mb-2">Reset your password</h1>
                <p className="text-muted-foreground">Enter your email and we'll send you a reset link.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground h-12 text-base font-semibold"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send reset link"}
              </Button>
              <button
                type="button"
                onClick={() => setPanel("form")}
                className="w-full text-center text-sm text-primary hover:underline font-medium"
              >
                Back to sign in
              </button>
            </form>
          )}

          {panel === "form" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold gradient-text mb-2">
                  {mode === "login" ? "Welcome Back" : "Create your account"}
                </h1>
                <p className="text-muted-foreground">
                  {mode === "login"
                    ? "Sign in to continue your journey"
                    : "Save your plan and start your 20-day free trial"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        autoComplete="name"
                        placeholder="Your name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setPanel("forgot")}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      minLength={mode === "signup" ? MIN_PASSWORD : undefined}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {mode === "signup" && (
                    <p className="text-xs text-muted-foreground">At least {MIN_PASSWORD} characters.</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary text-primary-foreground h-12 text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
                </Button>

                {needsConfirmation && (
                  <Button type="button" variant="outline" className="w-full" onClick={handleResend}>
                    Resend confirmation email
                  </Button>
                )}
              </form>

              <div className="mt-6 text-center space-y-3">
                <button onClick={switchMode} className="text-primary hover:underline text-sm font-medium">
                  {mode === "login"
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  or
                  <div className="h-px flex-1 bg-border" />
                </div>
                <Button variant="outline" className="w-full h-11" onClick={handleDemo}>
                  Try the demo — no account needed
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
