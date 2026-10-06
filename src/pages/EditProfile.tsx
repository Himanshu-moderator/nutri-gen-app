import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Mail, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, isDemo } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [emailChanging, setEmailChanging] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setGender(profile.gender || "");
      setDateOfBirth(profile.date_of_birth || "");
      setHeightCm(profile.height_cm?.toString() || "");
      setWeightKg(profile.weight_kg?.toString() || "");
      setActivityLevel(profile.activity_level || "");
    }
    if (user) {
      setNewEmail(user.email || "");
    }
  }, [profile, user]);

  const handleSave = async () => {
    const invalid = (description: string) =>
      toast({ title: "Check your details", description, variant: "destructive" });

    if (!fullName.trim()) return invalid("Please enter your name.");
    if (heightCm && (Number(heightCm) < 50 || Number(heightCm) > 260)) {
      return invalid("Height should be between 50 and 260 cm.");
    }
    if (weightKg && (Number(weightKg) < 20 || Number(weightKg) > 400)) {
      return invalid("Weight should be between 20 and 400 kg.");
    }
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();
      if (Number.isNaN(dob.getTime()) || dob > now || age > 110) {
        return invalid("Please enter a valid date of birth.");
      }
    }
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        full_name: fullName.trim(),
        gender: gender || null,
        date_of_birth: dateOfBirth || null,
        height_cm: heightCm ? Math.round(Number(heightCm)) : null,
        weight_kg: weightKg ? Number(weightKg) : null,
        activity_level: activityLevel || null,
      });
      toast({ title: "Profile updated!", description: "Your changes have been saved." });
      navigate("/profile");
    } catch (error) {
      toast({ title: "Error", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || newEmail === user?.email) return;
    if (isDemo) {
      toast({ title: "Not available in demo", description: "Create an account to change your email." });
      return;
    }
    setEmailChanging(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast({
        title: "Verification sent!",
        description: "Check both your old and new email to confirm the change.",
      });
    } catch (error) {
      toast({ title: "Error", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setEmailChanging(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-8 space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Edit Profile</h1>
        </motion.div>

        {/* Avatar Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                {fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </motion.div>

        {/* Personal Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Personal Information</h3>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10" placeholder="Your name" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input id="height" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="170" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input id="weight" type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="70" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Activity Level</Label>
                <Select value={activityLevel} onValueChange={setActivityLevel}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary</SelectItem>
                    <SelectItem value="lightly_active">Lightly Active</SelectItem>
                    <SelectItem value="moderately_active">Moderately Active</SelectItem>
                    <SelectItem value="very_active">Very Active</SelectItem>
                    <SelectItem value="extremely_active">Extremely Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Contact Information</h3>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="pl-10" disabled={isDemo} />
                  </div>
                  {newEmail !== user?.email && (
                    <Button onClick={handleEmailChange} disabled={emailChanging} size="sm" variant="outline" className="shrink-0">
                      {emailChanging ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isDemo
                    ? "Email can't be changed in demo mode."
                    : "Changing email requires verification via both old and new email."}
                </p>
              </div>

            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground h-14 text-base font-semibold rounded-2xl">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Save Changes
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default EditProfile;
