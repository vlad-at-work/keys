import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useHighlightStore } from "@/features/trainer/highlightContext";
import { useLayoutStore } from "@/features/trainer/layouts/layoutContext";
import { MAX_TRAINING_TEXT_LEN } from "@/features/trainer/trainingTextStore";
import { useTrainingTextStore } from "@/features/trainer/trainingTextContext";

export function SettingsPage() {
  const { layoutPreset, layoutJsonText, resetLayoutJson, setLayoutJsonText, setLayoutPreset } =
    useLayoutStore();
  const {
    highlightPreset,
    highlightJsonText,
    highlightJsonError,
    resetHighlightJson,
    setHighlightJsonText,
    setHighlightPreset,
  } =
    useHighlightStore();
  const { trainingTextRaw, resetTrainingText, setTrainingTextRaw } =
    useTrainingTextStore();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h2 className="mb-6 text-2xl font-semibold">Settings</h2>

      <Tabs defaultValue="text">
        <TabsList>
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="highlights">Highlights</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        <TabsContent value="layout">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Layout JSON</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={layoutPreset === "statica" ? "secondary" : "outline"}
                  onClick={() => setLayoutPreset("statica")}
                >
                  Statica
                </Button>
                <Button
                  variant={layoutPreset === "graphite" ? "secondary" : "outline"}
                  onClick={() => setLayoutPreset("graphite")}
                >
                  Graphite
                </Button>
                <Button variant="outline" onClick={resetLayoutJson}>
                  Reset current
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Textarea
                value={layoutJsonText}
                onChange={(e) => setLayoutJsonText(e.target.value)}
                spellCheck={false}
                className="min-h-[420px]"
              />
              <div className="text-sm text-muted-foreground">
                Keys are internal ids like{" "}
                <code className="font-mono">"keyA"</code>,{" "}
                <code className="font-mono">"keyBackslash"</code>,{" "}
                <code className="font-mono">"keySpace"</code>. Values must be
                strings.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="highlights">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Highlight JSON</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={highlightPreset === "angle" ? "secondary" : "outline"}
                  onClick={() => setHighlightPreset("angle")}
                >
                  Angle
                </Button>
                <Button
                  variant={highlightPreset === "normal" ? "secondary" : "outline"}
                  onClick={() => setHighlightPreset("normal")}
                >
                  Normal
                </Button>
                <Button variant="outline" onClick={resetHighlightJson}>
                  Reset current
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Textarea
                value={highlightJsonText}
                onChange={(e) => setHighlightJsonText(e.target.value)}
                spellCheck={false}
                className="min-h-[420px]"
              />
              {highlightJsonError ? (
                <div className="text-sm text-destructive">
                  {highlightJsonError}
                </div>
              ) : null}
              <div className="text-sm text-muted-foreground">
                Keys are internal ids like{" "}
                <code className="font-mono">"keyA"</code>,{" "}
                <code className="font-mono">"keyBackslash"</code>,{" "}
                <code className="font-mono">"keySpace"</code>. Values must be
                one of{" "}
                <code className="font-mono">
                  "lp"
                </code>,{" "}
                <code className="font-mono">
                  "lr"
                </code>,{" "}
                <code className="font-mono">
                  "lm"
                </code>,{" "}
                <code className="font-mono">
                  "li"
                </code>,{" "}
                <code className="font-mono">
                  "ri"
                </code>,{" "}
                <code className="font-mono">
                  "rm"
                </code>,{" "}
                <code className="font-mono">
                  "rr"
                </code>,{" "}
                <code className="font-mono">
                  "rp"
                </code>.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Training text</CardTitle>
              <Button variant="outline" onClick={resetTrainingText}>
                Reset to default
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Textarea
                value={trainingTextRaw}
                onChange={(e) =>
                  setTrainingTextRaw(
                    e.target.value.slice(0, MAX_TRAINING_TEXT_LEN),
                  )
                }
                spellCheck={false}
                maxLength={MAX_TRAINING_TEXT_LEN}
                className="min-h-[240px]"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  Any whitespace is treated like a space and shown as{" "}
                  <code className="font-mono">·</code>.
                </div>
                <div className="font-mono tabular-nums">
                  {trainingTextRaw.length}/{MAX_TRAINING_TEXT_LEN}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="other">
          <Card>
            <CardHeader>
              <CardTitle>Coming soon</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              More settings will land here later.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
