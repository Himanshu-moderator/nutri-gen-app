import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { demoStore, samplePantryRows, type PantryItem } from "@/lib/demoStore";

export interface NewPantryItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiry_date: string | null;
}

export const usePantry = () => {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["pantry_items", user?.id];

  const { data: items = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async (): Promise<PantryItem[]> => {
      if (!user) return [];
      if (isDemo) return demoStore.getPantry();
      const { data, error } = await supabase
        .from("pantry_items")
        .select("*")
        .eq("user_id", user.id)
        .order("added_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const addItems = useMutation({
    mutationFn: async (newItems: NewPantryItem[]) => {
      if (!user) throw new Error("Not authenticated");
      if (isDemo) {
        newItems.forEach((i) => demoStore.addPantryItem(i));
        return;
      }
      const { error } = await supabase
        .from("pantry_items")
        .insert(newItems.map((i) => ({ ...i, user_id: user.id })));
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      if (isDemo) {
        demoStore.deletePantryItem(id);
        return;
      }
      const { error } = await supabase
        .from("pantry_items")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const loadSamples = () => addItems.mutateAsync(samplePantryRows());

  return { items, isLoading, error, addItems, deleteItem, loadSamples };
};
