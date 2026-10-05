import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, ImageIcon, Loader2, X, Zap, ZapOff } from "lucide-react";

interface CameraScannerProps {
  open: boolean;
  // True while the captured photo is being read by the AI.
  busy: boolean;
  onCapture: (file: File) => void;
  onGallery: () => void;
  onClose: () => void;
}

// Torch isn't in the standard DOM typings yet.
type TorchCapabilities = { torch?: boolean };

// Full-screen camera viewfinder in the style of Google Lens: live preview,
// corner brackets, a gallery shortcut and a round shutter button. Tapping the
// shutter freezes the frame and sends it to be read. Falls back to the photo
// picker when there is no camera or permission is denied.
const CameraScanner = ({ open, busy, onCapture, onGallery, onClose }: CameraScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [frozen, setFrozen] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);
    setReady(false);
    setTorchOn(false);
    setFrozen(null);

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Your browser can't open the camera here.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        const caps = track?.getCapabilities?.() as TorchCapabilities | undefined;
        setTorchSupported(!!caps?.torch);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setReady(true);
      } catch (err) {
        const denied = err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError");
        setError(
          denied
            ? "Camera access is blocked. Allow it in your browser settings, or choose a photo instead."
            : "No camera found. Choose a photo instead."
        );
      }
    };
    start();

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKey);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Once the AI is done, the frozen frame goes away (the camera or the review sheet takes over).
  useEffect(() => {
    if (!busy) setFrozen(null);
  }, [busy]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] });
      setTorchOn(!torchOn);
    } catch {
      setTorchSupported(false);
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || busy) return;
    const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setFrozen(canvas.toDataURL("image/jpeg", 0.6));
        onCapture(new File([blob], "scan.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.85
    );
  };

  if (!open) return null;

  const corner = "absolute h-9 w-9 border-white";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scan your groceries"
      className="fixed inset-0 z-[90] bg-black text-white flex flex-col"
    >
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden="true"
      />
      {frozen && <img src={frozen} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />

      {/* Top bar */}
      <div className="relative flex items-center justify-between px-4 pt-4">
        <button
          type="button"
          aria-label="Close scanner"
          onClick={onClose}
          disabled={busy}
          className="p-2 rounded-full bg-black/30 disabled:opacity-40"
        >
          <X className="h-6 w-6" />
        </button>
        <p className="text-base font-medium">Scan your groceries</p>
        {torchSupported ? (
          <button
            type="button"
            aria-label={torchOn ? "Turn flash off" : "Turn flash on"}
            onClick={toggleTorch}
            className="p-2 rounded-full bg-black/30"
          >
            {torchOn ? <Zap className="h-6 w-6" /> : <ZapOff className="h-6 w-6" />}
          </button>
        ) : (
          <span className="w-10" />
        )}
      </div>

      {/* Viewfinder */}
      <div className="relative flex-1 flex items-center justify-center px-8">
        {error ? (
          <div className="max-w-xs text-center space-y-4 rounded-2xl bg-black/60 p-5">
            <Camera className="h-10 w-10 mx-auto opacity-80" />
            <p className="text-sm">{error}</p>
            <button
              type="button"
              onClick={onGallery}
              className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium"
            >
              Choose a photo
            </button>
          </div>
        ) : (
          <>
            <div className="relative w-full max-w-sm aspect-[3/4]">
              <span className={`${corner} top-0 left-0 rounded-tl-2xl border-t-[3px] border-l-[3px]`} />
              <span className={`${corner} top-0 right-0 rounded-tr-2xl border-t-[3px] border-r-[3px]`} />
              <span className={`${corner} bottom-0 left-0 rounded-bl-2xl border-b-[3px] border-l-[3px]`} />
              <span className={`${corner} bottom-0 right-0 rounded-br-2xl border-b-[3px] border-r-[3px]`} />
            </div>
            <p className="absolute bottom-3 left-0 right-0 text-center text-sm text-white/90 px-6">
              {busy
                ? "Reading your photo..."
                : ready
                ? "Point at groceries, your fridge or a receipt"
                : "Starting camera..."}
            </p>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="relative flex items-center justify-between px-8 pb-8 pt-4">
        <button
          type="button"
          aria-label="Choose a photo from your gallery"
          onClick={onGallery}
          disabled={busy}
          className="h-12 w-12 rounded-xl border-2 border-white/80 bg-white/15 flex items-center justify-center disabled:opacity-40"
        >
          <ImageIcon className="h-6 w-6" />
        </button>
        <button
          type="button"
          aria-label="Scan"
          onClick={capture}
          disabled={!ready || busy || !!error}
          className="h-[72px] w-[72px] rounded-full border-4 border-white bg-white/20 flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform"
        >
          {busy ? <Loader2 className="h-7 w-7 animate-spin" /> : <Camera className="h-7 w-7" />}
        </button>
        <span className="h-12 w-12" />
      </div>
    </div>,
    document.body
  );
};

export default CameraScanner;
