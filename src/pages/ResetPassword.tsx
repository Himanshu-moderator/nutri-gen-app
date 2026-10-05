import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const MIN_PASSWORD = 8;

// Landing page for the link in the "reset your password" email. Supabase turns
// the link into a temporary session, which lets the user choose a new password.
const ResetPassword = () => {
  const { user, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [waited, setWaited] = useState(false);

  // Give Supabase a moment to read the recovery token from the URL.
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await updatePassword(password);
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't update password", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Password updated", description: "You're all set." });
    navigate("/dashboard");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        {loading || !waited ? (
          <p className="text-muted-foreground animate-pulse">Verifying your link...</p>
        ) : (
          <div className="space-y-4 max-w-sm">
            <h1 className="text-2xl font-bold">This link has expired</h1>
            <p className="text-muted-foreground">
              Reset links work once and expire quickly. Request a new one from the sign-in page.
            </p>
            <Button className="gradient-primary text-primary-foreground" onClick={() => navigate("/auth")}>
              Back to sign in
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold mb-2">Choose a new password</h1>
          <p className="text-muted-foreground">Pick something you haven't used before.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">At least {MIN_PASSWORD} characters.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button type="submit" disabled={saving} className="w-full gradient-primary text-primary-foreground h-12">
          {saving ? "Saving..." : "Update password"}
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;
