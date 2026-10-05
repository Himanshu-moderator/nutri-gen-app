import { useEffect, useRef, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { clearOnboardingDraft, loadOnboardingDraft } from "@/lib/onboardingDraft";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Trial from "./pages/Trial";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Meals from "./pages/Meals";
import Pantry from "./pages/Pantry";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Preferences from "./pages/Preferences";
import MealHistory from "./pages/MealHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-primary text-xl font-semibold">Loading...</div>
  </div>
);

// Onboarding answers are collected before an account exists. Once the new
// account's profile is available, write the saved answers into it. Returns
// true while that write is in flight so routes can wait instead of bouncing
// the user back to onboarding.
const useApplyPendingOnboarding = () => {
  const { user, isDemo } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [applying, setApplying] = useState(false);
  const attempted = useRef(false);

  const draft = loadOnboardingDraft();
  const pending = !!user && !isDemo && !!profile && !profile.onboarding_completed && !!draft;

  useEffect(() => {
    if (!pending || attempted.current || !draft) return;
    attempted.current = true;
    setApplying(true);
    updateProfile
      .mutateAsync({ ...draft, onboarding_completed: true })
      .then(() => clearOnboardingDraft())
      .catch(() => {
        // Leave the draft in place; the onboarding screen pre-fills from it.
      })
      .finally(() => setApplying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return pending && !attempted.current ? true : applying;
};

const ProfileLoadError = () => {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-center bg-background">
      <div className="max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">We couldn't load your profile</h1>
        <p className="text-muted-foreground">
          Check your connection and try again. If it keeps happening, sign out and back in.
        </p>
        <div className="flex gap-3 justify-center">
          <Button className="gradient-primary text-primary-foreground" onClick={() => window.location.reload()}>
            Try again
          </Button>
          <Button variant="outline" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
};

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { profile, isLoading: profileLoading, error } = useProfile();
  const applying = useApplyPendingOnboarding();

  if (loading || (user && (profileLoading || applying))) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (error && !profile) return <ProfileLoadError />;

  // Redirect to onboarding if not completed
  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

// Onboarding is open to visitors without an account (their answers are kept
// until sign-up). Signed-in users who already finished it go to the app.
const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const applying = useApplyPendingOnboarding();

  if (loading || (user && (profileLoading || applying))) return <LoadingScreen />;

  if (user && profile?.onboarding_completed) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/trial" element={<Trial />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <Onboarding />
          </OnboardingRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meals"
        element={
          <ProtectedRoute>
            <Meals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pantry"
        element={
          <ProtectedRoute>
            <Pantry />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-profile"
        element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/preferences"
        element={
          <ProtectedRoute>
            <Preferences />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meal-history"
        element={
          <ProtectedRoute>
            <MealHistory />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
