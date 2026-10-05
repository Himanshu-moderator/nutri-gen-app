import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, AlertTriangle, Trash2, Package, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePantry } from "@/hooks/usePantry";
import { daysUntilExpiry } from "@/lib/pantry";
import { COMMON_PANTRY_ITEMS } from "@/lib/demoStore";
import PantryScan from "@/components/PantryScan";
import { AUTOFILL_PANTRY_KEY, useLocalPreference } from "@/hooks/useLocalPreference";
import { autofillItems } from "@/lib/ai";
import { suggestPantryDetails } from "@/lib/shelfLife";
import { PANTRY_CATEGORY_OPTIONS as categories, PANTRY_UNIT_OPTIONS } from "@/lib/pantryOptions";

const emptyForm = { name: "", category: "", quantity: "1", unit: "pcs", expiryDate: "" };

const expiryLabel = (days: number) => {
  if (days < 0) return `Expired ${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} ago`;
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `${days} days left`;
};

const Pantry = () => {
  const { isDemo } = useAuth();
  const { items, isLoading, error, addItems, deleteItem, loadSamples } = usePantry();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [autofill] = useLocalPreference(AUTOFILL_PANTRY_KEY, true);
  const [filling, setFilling] = useState(false);
  const [filled, setFilled] = useState(false);
  // Fields the user chose themselves; auto-fill never overwrites those.
  const touched = useRef<Set<string>>(new Set());
  const lastFilledName = useRef("");
  const { toast } = useToast();

  const getCategoryEmoji = (category: string | null) =>
    categories.find((c) => c.value === category)?.emoji || "📦";

  // Items closest to expiring come first; items with no date go last.
  const sorted = useMemo(
    () =>
      items
        .map((item) => ({ item, days: daysUntilExpiry(item.expiry_date) }))
        .sort((a, b) => {
          if (a.days === null && b.days === null) return 0;
          if (a.days === null) return 1;
          if (b.days === null) return -1;
          return a.days - b.days;
        }),
    [items]
  );

  const filtered = sorted.filter(({ item }) =>
    item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const expiring = sorted.filter(({ days }) => days !== null && days <= 3);

  const showError = (title: string, err: unknown) =>
    toast({
      title,
      description: err instanceof Error ? err.message : "Please try again.",
      variant: "destructive",
    });

  const resetForm = () => {
    setForm(emptyForm);
    setFilled(false);
    touched.current = new Set();
    lastFilledName.current = "";
  };

  const setField = (field: keyof typeof emptyForm, value: string) => {
    if (field !== "name" && field !== "quantity") touched.current.add(field);
    setForm((f) => ({ ...f, [field]: value }));
  };

  // Fills category, unit and expiry for the typed name (AI when available,
  // built-in food knowledge otherwise) without touching fields the user set.
  const runAutofill = async (rawName: string) => {
    const name = rawName.trim();
    if (!autofill || !name || name.toLowerCase() === lastFilledName.current) return;
    lastFilledName.current = name.toLowerCase();
    setFilling(true);
    try {
      const [hit] = await autofillItems([name]);
      if (!hit) return;
      setForm((f) => ({
        ...f,
        category: touched.current.has("category") ? f.category : hit.category,
        unit: touched.current.has("unit") ? f.unit : hit.unit,
        expiryDate: touched.current.has("expiryDate") ? f.expiryDate : hit.expiry_date ?? "",
      }));
      setFilled(true);
    } finally {
      setFilling(false);
    }
  };

  const handleAddItem = async () => {
    const name = form.name.trim();
    const quantity = Number(form.quantity);
    let category = form.category;
    let expiryDate = form.expiryDate;
    if (name && !category && autofill) {
      const [hit] = await autofillItems([name]);
      if (hit) {
        category = hit.category;
        if (!touched.current.has("expiryDate")) expiryDate = hit.expiry_date ?? "";
      }
    }
    if (!name || !category) {
      toast({
        title: "Missing info",
        description: "Please fill in name and category",
        variant: "destructive",
      });
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 9999) {
      toast({
        title: "Check the quantity",
        description: "Enter a quantity greater than 0.",
        variant: "destructive",
      });
      return;
    }
    try {
      await addItems.mutateAsync([
        {
          name,
          category,
          quantity,
          unit: form.unit,
          expiry_date: expiryDate || null,
        },
      ]);
      resetForm();
      setIsAddOpen(false);
      toast({ title: "Item added!", description: `${name} has been added to your pantry` });
    } catch (err) {
      showError("Couldn't add item", err);
    }
  };

  const handleQuickAdd = async (item: (typeof COMMON_PANTRY_ITEMS)[number]) => {
    try {
      const expiry_date = autofill ? suggestPantryDetails(item.name).expiry_date : null;
      await addItems.mutateAsync([{ ...item, expiry_date }]);
      toast({ title: "Item added!", description: `${item.name} has been added to your pantry` });
    } catch (err) {
      showError("Couldn't add item", err);
    }
  };

  const handleLoadSamples = async () => {
    try {
      await loadSamples();
      toast({ title: "Sample pantry loaded", description: "Try the search, expiry alerts and meal matching." });
    } catch (err) {
      showError("Couldn't load samples", err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteItem.mutateAsync(id);
      toast({ title: "Item removed", description: `${name} has been removed from your pantry` });
    } catch (err) {
      showError("Couldn't remove item", err);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4 space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold">My Pantry</h1>
            <p className="text-muted-foreground text-sm">
              {items.length} {items.length === 1 ? "item" : "items"} in stock
            </p>
          </div>
          <div className="flex items-center gap-2">
          <PantryScan onAdd={(newItems) => addItems.mutateAsync(newItems)} disabled={addItems.isPending} />
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="icon" aria-label="Add item" className="rounded-full gradient-primary">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 sm:mx-auto rounded-2xl max-w-md">
              <DialogHeader>
                <DialogTitle>Add Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="pantry-name">Name</Label>
                  <Input
                    id="pantry-name"
                    placeholder="e.g., Chicken Breast"
                    maxLength={60}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    onBlur={(e) => runAutofill(e.target.value)}
                  />
                  {autofill && (filling || filled) && (
                    <p className="flex items-center gap-1 text-xs text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      {filling ? "Filling in category and expiry..." : "Category and expiry filled in. Change them if needed."}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(value) => setField("category", value)}>
                    <SelectTrigger aria-label="Category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.emoji} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pantry-qty">Quantity</Label>
                    <Input
                      id="pantry-qty"
                      type="number"
                      min={0.1}
                      step="any"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select value={form.unit} onValueChange={(value) => setField("unit", value)}>
                      <SelectTrigger aria-label="Unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PANTRY_UNIT_OPTIONS.map((u) => (
                          <SelectItem key={u.value} value={u.value}>
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pantry-expiry">Expiry Date{autofill ? "" : " (optional)"}</Label>
                  <Input
                    id="pantry-expiry"
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setField("expiryDate", e.target.value)}
                  />
                </div>
                <Button onClick={handleAddItem} disabled={addItems.isPending} className="w-full gradient-primary">
                  {addItems.isPending ? "Adding..." : filling ? "Filling in..." : "Add to Pantry"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </motion.div>

        {/* Search */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search pantry..."
              aria-label="Search pantry"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl"
            />
          </motion.div>
        )}

        {/* Expiring Soon Alert */}
        {expiring.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Use these first</p>
                  <p className="text-sm text-muted-foreground">
                    {expiring.map(({ item }) => item.name).join(", ")}{" "}
                    {expiring.length === 1 ? "is" : "are"} expired or expiring within 3 days
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Items List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading your pantry...</p>}
          {error && !isLoading && (
            <p className="text-sm text-destructive text-center py-8">
              We couldn't load your pantry. Check your connection and refresh.
            </p>
          )}

          {!isLoading && !error && items.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center space-y-4">
                <Package className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium">Your pantry is empty</p>
                  <p className="text-sm text-muted-foreground">
                    Add what you have and NutriGen will suggest meals that use it.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {COMMON_PANTRY_ITEMS.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleQuickAdd(item)}
                      disabled={addItems.isPending}
                      className="px-3 py-1.5 rounded-full border border-border bg-muted/40 text-sm hover:bg-primary/10 hover:border-primary/40 transition-colors disabled:opacity-50"
                    >
                      + {item.name}
                    </button>
                  ))}
                </div>
                {!isDemo && (
                  <Button variant="outline" size="sm" onClick={handleLoadSamples} disabled={addItems.isPending}>
                    Load a sample pantry to explore
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <AnimatePresence mode="popLayout">
            {items.length > 0 && filtered.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No items match "{searchQuery}"</p>
              </motion.div>
            )}
            {filtered.map(({ item, days }, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: Math.min(index, 8) * 0.03 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="text-3xl">{getCategoryEmoji(item.category)}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit}
                        {days !== null && (
                          <span
                            className={`ml-2 ${
                              days <= 1 ? "text-destructive" : days <= 3 ? "text-warning" : "text-muted-foreground"
                            }`}
                          >
                            • {expiryLabel(days)}
                          </span>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${item.name}`}
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(item.id, item.name)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Pantry;
