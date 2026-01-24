import { useEffect, useMemo, useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ConfettiRef } from "@/components/ui/confetti";
import { Confetti } from "@/components/ui/confetti";
import { Separator } from "@/components/ui/separator";
import { type HighlightPresetId } from "@/features/trainer/highlightStore";
import {
  LayoutProvider,
  useLayoutStore,
} from "@/features/trainer/layouts/layoutContext";
import { HighlightProvider, useHighlightStore } from "@/features/trainer/highlightContext";
import { TypingModeProvider, useTypingMode } from "@/features/trainer/modeContext";
import { TrainingTextProvider } from "@/features/trainer/trainingTextContext";
import { SettingsPage } from "@/pages/SettingsPage";
import { TrainerPage } from "@/pages/TrainerPage";
import { VIBECODE_VERSION } from "@/version";
import { Keyboard, Settings } from "lucide-react";

type Route = "main" | "settings";

function getRouteFromHash(): Route {
  const hash = window.location.hash || "#/";
  if (hash.startsWith("#/settings")) return "settings";
  return "main";
}

export default function App() {
  return (
    <LayoutProvider>
      <TrainingTextProvider>
        <HighlightProvider>
          <TypingModeProvider>
            <AppWithLayout />
          </TypingModeProvider>
        </HighlightProvider>
      </TrainingTextProvider>
    </LayoutProvider>
  );
}

function AppWithLayout() {
  const [route, setRoute] = useState<Route>(() =>
    typeof window === "undefined" ? "main" : getRouteFromHash(),
  );

  useEffect(() => {
    const handler = () => setRoute(getRouteFromHash());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  return <AppShell route={route} />;
}

function AppShell({ route }: { route: Route }) {
  const { layoutJsonError, layoutPreset, setLayoutPreset } = useLayoutStore();
  const { highlightPreset, setHighlightPreset } = useHighlightStore();
  const { mode, setMode } = useTypingMode();
  const showError = useMemo(
    () => layoutJsonError && layoutJsonError.length > 0,
    [layoutJsonError],
  );
  const confettiRef = useRef<ConfettiRef>(null);

  const activeLayoutPreset = layoutPreset;
  const activeHighlightPreset: HighlightPresetId = highlightPreset;

  useEffect(() => {
    const handler = (_event: Event) => {
      confettiRef.current?.fire({
        particleCount: 240,
        spread: 110,
        startVelocity: 55,
        scalar: 1.05,
        ticks: 320,
        origin: { x: 0.5, y: 1 },
      });
    };

    window.addEventListener("keyshape:perfect-block", handler as EventListener);
    return () =>
      window.removeEventListener(
        "keyshape:perfect-block",
        handler as EventListener,
      );
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Confetti
        ref={confettiRef}
        manualstart
        className="pointer-events-none fixed inset-0 z-[10000] h-full w-full"
        aria-hidden="true"
      />
      <div className="fixed left-6 top-6 z-50 flex flex-wrap items-center gap-1 rounded-lg border border-border/50 bg-background/70 p-1 backdrop-blur">
        <Button
          asChild
          variant={route === "main" ? "secondary" : "ghost"}
          size="sm"
        >
          <a href="#/" aria-label="Main">
            <Keyboard className="size-4" />
            <span className="hidden sm:inline">Main</span>
          </a>
        </Button>
        <Button
          asChild
          variant={route === "settings" ? "secondary" : "ghost"}
          size="sm"
        >
          <a href="#/settings" aria-label="Settings">
            <Settings className="size-4" />
            <span className="hidden sm:inline">Settings</span>
          </a>
        </Button>
      </div>

      {route === "main" ? (
        <div className="fixed right-6 top-6 z-50 grid gap-2 rounded-lg border border-border/50 bg-background/70 p-2 backdrop-blur">
          <div className="grid gap-1">
            <div className="text-xs text-muted-foreground">Layout</div>
            <div className="flex items-center gap-1">
              <Button
                variant={activeLayoutPreset === "statica" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setLayoutPreset("statica")}
                title="Switch layout to Statica"
              >
                Statica
              </Button>
              <Button
                variant={
                  activeLayoutPreset === "graphite" ? "secondary" : "ghost"
                }
                size="sm"
                onClick={() => setLayoutPreset("graphite")}
                title="Switch layout to Graphite"
              >
                Graphite
              </Button>
            </div>
          </div>

          <Separator className="bg-border/60" />

          <div className="grid gap-1">
            <div className="text-xs text-muted-foreground">Highlights</div>
            <div className="flex items-center gap-1">
              <Button
                variant={
                  activeHighlightPreset === "angle" ? "secondary" : "ghost"
                }
                size="sm"
                onClick={() => setHighlightPreset("angle")}
                title="Switch highlights to Angle"
              >
                Angle
              </Button>
              <Button
                variant={
                  activeHighlightPreset === "normal" ? "secondary" : "ghost"
                }
                size="sm"
                onClick={() => setHighlightPreset("normal")}
                title="Switch highlights to Normal"
              >
                Normal
              </Button>
            </div>
          </div>

          <Separator className="bg-border/60" />

          <div className="grid gap-1">
            <div className="text-xs text-muted-foreground">Mode</div>
            <div className="flex items-center gap-1">
              <Button
                variant={mode === "practice" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setMode("practice")}
                title="Practice mode: repeat preset text"
              >
                Practice
              </Button>
              <Button
                variant={mode === "free" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setMode("free")}
                title="Free mode: type anything (no checks)"
              >
                Free
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showError ? (
        <div className="fixed inset-x-0 top-0 z-[9999] px-4 pt-4">
          <Alert variant="destructive">
            <AlertTitle>Invalid layout JSON</AlertTitle>
            <AlertDescription>{layoutJsonError}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {route === "settings" ? <SettingsPage /> : <TrainerPage />}

      <div className="pb-8 pt-6 text-center text-sm text-muted-foreground">
        v<small>(ibecode)</small> {VIBECODE_VERSION}
      </div>
    </div>
  );
}
