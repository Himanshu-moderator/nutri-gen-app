import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Settings,
  Bell,
  Moon,
  LogOut,
  ChevronRight,
  Crown,
  Target,
  Scale,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { profile, trialDaysRemaining, isTrialActive } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const trialDays = trialDaysRemaining();
  const trialProgress = ((20 - trialDays) / 20) * 100;

  const healthGoalLabels: Record<string, string> = {
    lose_weight: "Lose Weight",
    maintain_weight: "Maintain Weight",
    gain_weight: "Gain Weight",
    build_muscle: "Build Muscle",
    improve_health: "Improve Health",
  };

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-4 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Avatar className="h-20 w-20 border-4 border-primary/20">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">{profile?.full_name || "User"}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {isTrialActive() && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-1">
                <Crown className="h-3 w-3" />
                Trial Active
              </span>
            )}
          </div>
        </motion.div>

        {/* Trial Status */}
        {isTrialActive() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Free Trial</span>
                  <span className="text-sm text-muted-foreground">
                    {trialDays} days left
                  </span>
                </div>
                <Progress value={trialProgress} className="h-2" />
                <Button
                  variant="link"
                  className="text-primary p-0 h-auto mt-2 text-sm"
                  onClick={() => toast({ title: "Coming soon!", description: "Subscription options will be available soon" })}
                >
                  Upgrade to Premium →
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-3"
        >
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-xs text-muted-foreground">Goal</p>
              <p className="text-sm font-medium truncate">
                {healthGoalLabels[profile?.health_goal || ""] || "Not set"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Scale className="h-6 w-6 mx-auto text-secondary mb-2" />
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="text-sm font-medium">
                {profile?.daily_calorie_target || 2000} cal
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="h-6 w-6 mx-auto text-accent mb-2" />
              <p className="text-xs text-muted-foreground">Streak</p>
              <p className="text-sm font-medium">7 days 🔥</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold">Settings</h2>

          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                onClick={() => navigate("/onboarding")}
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span>Edit Profile</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span>Notifications</span>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-muted-foreground" />
                  <span>Dark Mode</span>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={(checked) => {
                    setDarkMode(checked);
                    document.documentElement.classList.toggle("dark", checked);
                  }}
                />
              </div>

              <button
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                onClick={() => toast({ title: "Coming soon!", description: "Settings page will be available soon" })}
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <span>Preferences</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Profile;
