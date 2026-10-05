import { useRef, useState } from "react";
import { Camera, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AiUnavailableError, scanPantryPhoto, type DetectedItem } from "@/lib/ai";
import { PANTRY_CATEGORY_OPTIONS, PANTRY_UNIT_OPTIONS } from "@/lib/pantryOptions";
import type { NewPantryItem } from "@/hooks/usePantry";
import CameraScanner from "@/components/CameraScanner";

interface Row extends DetectedItem {
  key: number;
}

interface PantryScanProps {
  onAdd: (items: NewPantryItem[]) => Promise<void>;
  disabled?: boolean;
}

// "Scan with AI": a Lens-style camera view (or a photo from the gallery) of
// groceries, the fridge or a receipt; the detected items come back with category, quantity and expiry
// already filled in, ready to review and add in one tap.
const PantryScan = ({ onAdd, disabled }: PantryScanProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setScanning(true);
    try {
      const detected = await scanPantryPhoto(file);
      if (detected.length === 0) {
        toast({
          title: "No food spotted",
          description: "Try a clearer, closer photo, or add items by hand.",
        });
        return;
      }
      setRows(detected.map((item, i) => ({ ...item, key: i })));
      setCameraOpen(false);
    } catch (err) {
      toast({
        title: err instanceof AiUnavailableError ? "AI scan isn't available right now" : "Couldn't scan that photo",
        description:
          err instanceof AiUnavailableError
            ? "You can still add items by hand. Category and expiry auto-fill keeps working."
            : err instanceof Error
            ? err.message
            : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const update = (key: number, patch: Partial<DetectedItem>) =>
    setRows((current) => current && current.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const remove = (key: number) =>
    setRows((current) => {
      const next = (current ?? []).filter((r) => r.key !== key);
      return next.length ? next : null;
    });

  const confirm = async () => {
    if (!rows) return;
    const valid = rows
      .map((r) => ({ ...r, name: r.name.trim(), quantity: Number(r.quantity) }))
      .filter((r) => r.name && Number.isFinite(r.quantity) && r.quantity > 0);
    if (valid.length === 0) {
      toast({ title: "Nothing to add", description: "Give each item a name and a quantity.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await onAdd(
        valid.map(({ name, category, quantity, unit, expiry_date }) => ({ name, category, quantity, unit, expiry_date }))
      );
      toast({
        title: `${valid.length} ${valid.length === 1 ? "item" : "items"} added`,
        description: "Added to your pantry with expiry dates.",
      });
      setRows(null);
    } catch (err) {
      toast({
        title: "Couldn't add items",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label="Choose a photo to scan"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button
        variant="outline"
        className="rounded-full gap-2 border-primary/40 text-primary"
        onClick={() => setCameraOpen(true)}
        disabled={disabled}
      >
        <Camera className="h-4 w-4" />
        <span className="hidden sm:inline">Scan with AI</span>
        <span className="sm:hidden">Scan</span>
      </Button>
      <CameraScanner
        open={cameraOpen}
        busy={scanning}
        onCapture={handleFile}
        onGallery={() => inputRef.current?.click()}
        onClose={() => setCameraOpen(false)}
      />

      <Dialog open={rows !== null} onOpenChange={(open) => !open && !saving && setRows(null)}>
        <DialogContent className="mx-4 sm:mx-auto rounded-2xl max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Found in your photo
            </DialogTitle>
            <DialogDescription>
              Check the details and fix anything that's off. Categories and expiry dates are estimates.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {rows?.map((row) => (
              <div key={row.key} className="rounded-xl border border-border p-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    aria-label="Item name"
                    spellCheck={false}
                    value={row.name}
                    maxLength={60}
                    onChange={(e) => update(row.key, { name: e.target.value })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${row.name}`}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(row.key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    aria-label="Quantity"
                    type="number"
                    min={0.1}
                    step="any"
                    value={row.quantity}
                    onChange={(e) => update(row.key, { quantity: Number(e.target.value) })}
                  />
                  <Select value={row.unit} onValueChange={(unit) => update(row.key, { unit })}>
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
                  <Select value={row.category} onValueChange={(category) => update(row.key, { category })}>
                    <SelectTrigger aria-label="Category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PANTRY_CATEGORY_OPTIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.emoji} {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor={`scan-exp-${row.key}`} className="text-xs text-muted-foreground shrink-0">
                    Expires
                  </label>
                  <Input
                    id={`scan-exp-${row.key}`}
                    type="date"
                    value={row.expiry_date ?? ""}
                    onChange={(e) => update(row.key, { expiry_date: e.target.value || null })}
                  />
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setRows(null)} disabled={saving}>
              Cancel
            </Button>
            <Button className="gradient-primary" onClick={confirm} disabled={saving}>
              {saving ? "Adding..." : `Add ${rows?.length ?? 0} to pantry`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PantryScan;
