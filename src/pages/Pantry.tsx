import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Camera, Scan, AlertTriangle, Trash2, Package } from "lucide-react";
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

interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
}

const categories = [
  { value: "fruits", label: "Fruits", emoji: "🍎" },
  { value: "vegetables", label: "Vegetables", emoji: "🥬" },
  { value: "dairy", label: "Dairy", emoji: "🥛" },
  { value: "meat", label: "Meat", emoji: "🥩" },
  { value: "seafood", label: "Seafood", emoji: "🐟" },
  { value: "grains", label: "Grains", emoji: "🌾" },
  { value: "spices", label: "Spices", emoji: "🧂" },
  { value: "beverages", label: "Beverages", emoji: "🥤" },
  { value: "snacks", label: "Snacks", emoji: "🍪" },
  { value: "frozen", label: "Frozen", emoji: "❄️" },
  { value: "canned", label: "Canned", emoji: "🥫" },
  { value: "other", label: "Other", emoji: "📦" },
];

const mockItems: PantryItem[] = [
  { id: "1", name: "Chicken Breast", category: "meat", quantity: 2, unit: "lbs", expiryDate: "2026-02-07", daysUntilExpiry: 2 },
  { id: "2", name: "Avocados", category: "fruits", quantity: 4, unit: "pcs", expiryDate: "2026-02-08", daysUntilExpiry: 3 },
  { id: "3", name: "Greek Yogurt", category: "dairy", quantity: 1, unit: "container", expiryDate: "2026-02-12", daysUntilExpiry: 7 },
  { id: "4", name: "Brown Rice", category: "grains", quantity: 2, unit: "lbs" },
  { id: "5", name: "Salmon Fillet", category: "seafood", quantity: 1, unit: "lb", expiryDate: "2026-02-06", daysUntilExpiry: 1 },
  { id: "6", name: "Spinach", category: "vegetables", quantity: 1, unit: "bag", expiryDate: "2026-02-09", daysUntilExpiry: 4 },
];

const Pantry = () => {
  const [items, setItems] = useState<PantryItem[]>(mockItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    quantity: 1,
    unit: "pcs",
    expiryDate: "",
  });
  const { toast } = useToast();

  const getCategoryEmoji = (category: string) => {
    return categories.find((c) => c.value === category)?.emoji || "📦";
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const expiringItems = items.filter(
    (item) => item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 3
  );

  const handleAddItem = () => {
    if (!newItem.name || !newItem.category) {
      toast({
        title: "Missing info",
        description: "Please fill in name and category",
        variant: "destructive",
      });
      return;
    }

    const item: PantryItem = {
      id: Date.now().toString(),
      ...newItem,
    };
    setItems([item, ...items]);
    setNewItem({ name: "", category: "", quantity: 1, unit: "pcs", expiryDate: "" });
    setIsAddOpen(false);
    toast({
      title: "Item added!",
      description: `${newItem.name} has been added to your pantry`,
    });
  };

  const handleDelete = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
    toast({
      title: "Item removed",
      description: "The item has been removed from your pantry",
    });
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
              {items.length} items in stock
            </p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-full gradient-primary">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 sm:mx-auto rounded-2xl max-w-md">
              <DialogHeader>
                <DialogTitle>Add Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="e.g., Chicken Breast"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newItem.category}
                    onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                  >
                    <SelectTrigger>
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
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select
                      value={newItem.unit}
                      onValueChange={(value) => setNewItem({ ...newItem, unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">Pieces</SelectItem>
                        <SelectItem value="lbs">Pounds</SelectItem>
                        <SelectItem value="kg">Kilograms</SelectItem>
                        <SelectItem value="oz">Ounces</SelectItem>
                        <SelectItem value="container">Container</SelectItem>
                        <SelectItem value="bag">Bag</SelectItem>
                        <SelectItem value="bottle">Bottle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date (optional)</Label>
                  <Input
                    type="date"
                    value={newItem.expiryDate}
                    onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => toast({ title: "Coming soon!", description: "Photo scanning will be available soon" })}
                  >
                    <Camera className="h-4 w-4" />
                    Photo
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => toast({ title: "Coming soon!", description: "AI detection will be available soon" })}
                  >
                    <Scan className="h-4 w-4" />
                    AI Scan
                  </Button>
                </div>
                <Button onClick={handleAddItem} className="w-full gradient-primary">
                  Add to Pantry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search pantry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl"
          />
        </motion.div>

        {/* Expiring Soon Alert */}
        {expiringItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Expiring Soon</p>
                  <p className="text-sm text-muted-foreground">
                    {expiringItems.map((item) => item.name).join(", ")} will expire within 3 days
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
          <AnimatePresence mode="popLayout">
            {filteredItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No items found</p>
              </motion.div>
            ) : (
              filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="text-3xl">{getCategoryEmoji(item.category)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit}
                          {item.daysUntilExpiry !== undefined && (
                            <span
                              className={`ml-2 ${
                                item.daysUntilExpiry <= 1
                                  ? "text-destructive"
                                  : item.daysUntilExpiry <= 3
                                  ? "text-warning"
                                  : "text-muted-foreground"
                              }`}
                            >
                              • {item.daysUntilExpiry === 0
                                ? "Expires today"
                                : item.daysUntilExpiry === 1
                                ? "Expires tomorrow"
                                : `${item.daysUntilExpiry} days left`}
                            </span>
                          )}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Pantry;
