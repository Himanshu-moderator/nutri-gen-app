import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subDays, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { demoStore, sampleMealRows, type MealLog } from "@/lib/demoStore";
import { toDbMealType } from "@/lib/nutrition";

export interface NewMeal {
  meal_name: string;
  meal_type: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  logged_at?: string;
}

// How far back we load logs. Covers the history screen's browsing, the 7 day
// average and streaks of up to two months.
const HISTORY_DAYS = 60;

export const useMealLogs = () => {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["meal_logs", user?.id];

  const { data: logs = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async (): Promise<MealLog[]> => {
      if (!user) return [];
      if (isDemo) return demoStore.getMeals();
      const since = startOfDay(subDays(new Date(), HISTORY_DAYS)).toISOString();
      const { data, error } = await supabase
        .from("meal_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_at", since)
        .order("logged_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const addMeal = useMutation({
    mutationFn: async (meal: NewMeal) => {
      if (!user) throw new Error("Not authenticated");
      const row = {
        meal_name: meal.meal_name,
        meal_type: toDbMealType(meal.meal_type),
        calories: Math.round(meal.calories),
        protein_g: meal.protein_g,
        carbs_g: meal.carbs_g,
        fats_g: meal.fats_g,
        ...(meal.logged_at ? { logged_at: meal.logged_at } : {}),
      };
      if (isDemo) return demoStore.addMeal({ ...row, logged_at: meal.logged_at });
      const { data, error } = await supabase
        .from("meal_logs")
        .insert({ ...row, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const deleteMeal = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      if (isDemo) {
        demoStore.deleteMeal(id);
        return;
      }
      const { error } = await supabase
        .from("meal_logs")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // Loads a week of example meals so a new account can see the dashboard,
  // history and streak populated. Only offered from empty states.
  const loadSamples = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const rows = sampleMealRows();
      if (isDemo) {
        rows.forEach((r) => demoStore.addMeal({ ...r }));
        return;
      }
      const { error } = await supabase
        .from("meal_logs")
        .insert(rows.map((r) => ({ ...r, user_id: user.id })));
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { logs, isLoading, error, addMeal, deleteMeal, loadSamples };
};
