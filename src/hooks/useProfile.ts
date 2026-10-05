import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { demoStore } from "@/lib/demoStore";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;

export const useProfile = () => {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      if (isDemo) return demoStore.getProfile();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: TablesUpdate<"profiles">) => {
      if (!user) throw new Error("Not authenticated");
      if (isDemo) return demoStore.updateProfile(updates as Partial<Profile>);
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });

  const isTrialActive = () => {
    if (!profile?.trial_ends_at) return false;
    return new Date(profile.trial_ends_at) > new Date();
  };

  const trialDaysRemaining = () => {
    if (!profile?.trial_ends_at) return 0;
    const diff = new Date(profile.trial_ends_at).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    isTrialActive,
    trialDaysRemaining,
  };
};
