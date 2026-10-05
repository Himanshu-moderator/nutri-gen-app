import { useMemo, useState } from "react";
import { Check, Flame, Loader2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { usePantry } from "@/hooks/usePantry";
import { useMealLogs } from "@/hooks/useMealLogs";
import { AiUnavailableError, suggestMeals, type AiSuggestion } from "@/lib/ai";
import { daysUntilExpiry } from "@/lib/pantry";
import { dayKey } from "@/lib/nutrition";
import type { RecipeDetail } from "@/components/RecipeDetailSheet";

interface AiMealIdeasProps {
  slot: "breakfast" | "lunch" | "dinner" | "snack";
  onOpen: (recipe: RecipeDetail) => void;
  onAdd: (recipe: RecipeDetail) => void;
  adding?: boolean;
}

// Personalised meal ideas from the AI, built from the user's diet, pantry (with
// expiring items first) and the calories they have left today. It's opt-in per
// tap, and the rule-based suggestions on the page keep working if it's offline.
// Mount it with key={slot} so ideas reset when the meal tab changes.
const AiMealIdeas = ({ slot, onOpen, onAdd, adding }: AiMealIdeasProps) => {
  const { profile } = useProfile();
  const { items } = usePantry();
  const { logs } = useMealLogs();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<AiSuggestion[]>([]);
  const [unavailable, setUnavailable] = useState(false);

  const caloriesLeft = useMemo(() => {
    const today = dayKey(new Date());
    const eaten = logs
      .filter((l) => dayKey(new Date(l.logged_at)) === today)
      .reduce((sum, l) => sum + (l.calories ?? 0), 0);
    return Math.max((profile?.daily_calorie_target || 2000) - eaten, 0);
  }, [logs, profile?.daily_calorie_target]);

  const generate = async () => {
    setLoading(true);
    setUnavailable(false);
    try {
      const expiring = items
        .filter((i) => {
          const d = daysUntilExpiry(i.expiry_date);
          return d !== null && d <= 4;
        })
        .map((i) => i.name);
      const result = await suggestMeals({
        slot,
        diets: profile?.dietary_preferences ?? [],
        goal: profile?.health_goal ?? null,
        caloriesLeft,
        pantry: items.map((i) => i.name),
        expiring,
      });
      setIdeas(result);
    } catch (err) {
      if (err instanceof AiUnavailableError) {
        setUnavailable(true);
      } else {
        toast({
          title: "Couldn't get AI ideas",
          description: err instanceof Error ? err.message : "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-xl shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm sm:text-base">AI meal ideas</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Made for your diet, your pantry and the {caloriesLeft} cal you have left today.
              </p>
            </div>
          </div>
          <Button size="sm" className="gradient-primary shrink-0" onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : ideas.length ? "New ideas" : "Suggest"}
          </Button>
        </div>

        {unavailable && (
          <p className="text-sm text-muted-foreground rounded-lg bg-muted/50 p-3">
            AI ideas aren't available right now. The suggestions below still match your diet and pantry.
          </p>
        )}

        {ideas.map(({ recipe, reason, usesFromPantry }) => (
          <div key={recipe.name} className="rounded-xl border border-border p-3 space-y-2">
            <button type="button" className="w-full text-left" onClick={() => onOpen(recipe)}>
              <div className="flex items-start gap-3">
                <span className="text-3xl shrink-0">{recipe.emoji}</span>
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">{recipe.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Flame className="h-3.5 w-3.5 text-primary" />
                    {recipe.calories} cal · {recipe.macros.protein}g protein · {recipe.prepTime} min
                  </p>
                  {reason && <p className="text-xs text-muted-foreground mt-1">{reason}</p>}
                  {usesFromPantry.length > 0 && (
                    <p className="flex items-center gap-1 text-xs text-secondary mt-1">
                      <Check className="h-3.5 w-3.5" />
                      Uses {usesFromPantry.slice(0, 3).join(", ")}
                      {usesFromPantry.length > 3 ? ` +${usesFromPantry.length - 3} more` : ""}
                    </p>
                  )}
                </div>
              </div>
            </button>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onOpen(recipe)}>
                View recipe
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onAdd(recipe)} disabled={adding}>
                <Plus className="h-4 w-4 mr-1" /> Add to today
              </Button>
            </div>
          </div>
        ))}
        {ideas.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            AI-generated: calories and nutrients are estimates, so check ingredients if you have allergies.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AiMealIdeas;
