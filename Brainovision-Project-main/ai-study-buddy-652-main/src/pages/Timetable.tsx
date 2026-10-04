import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, Sparkles, Loader2, Plus, X, BookOpen, Coffee, RotateCcw, PenLine, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface TimetableRow {
  time: string;
  activity: string;
  type: "study" | "break" | "revision" | "practice" | "other";
}

interface TimetableData {
  title: string;
  rows: TimetableRow[];
  tips: string[];
}

const typeStyles: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
  study: {
    bg: "bg-primary/10",
    border: "border-primary/30",
    icon: <BookOpen className="w-4 h-4 text-primary" />,
  },
  break: {
    bg: "bg-secondary/10",
    border: "border-secondary/30",
    icon: <Coffee className="w-4 h-4 text-secondary" />,
  },
  revision: {
    bg: "bg-accent/10",
    border: "border-accent/30",
    icon: <RotateCcw className="w-4 h-4 text-accent" />,
  },
  practice: {
    bg: "bg-[hsl(270,60%,55%)]/10",
    border: "border-[hsl(270,60%,55%)]/30",
    icon: <PenLine className="w-4 h-4 text-[hsl(270,60%,55%)]" />,
  },
  other: {
    bg: "bg-muted",
    border: "border-border",
    icon: <Clock className="w-4 h-4 text-muted-foreground" />,
  },
};

const typeLabels: Record<string, { label: string; color: string }> = {
  study: { label: "Study", color: "bg-primary" },
  break: { label: "Break", color: "bg-secondary" },
  revision: { label: "Revision", color: "bg-accent" },
  practice: { label: "Practice", color: "bg-[hsl(270,60%,55%)]" },
  other: { label: "Other", color: "bg-muted-foreground" },
};

const Timetable = () => {
  const [subjects, setSubjects] = useState<string[]>([""]);
  const [hoursPerDay, setHoursPerDay] = useState("4");
  const [days, setDays] = useState("7");
  const [result, setResult] = useState<TimetableData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addSubject = () => setSubjects((prev) => [...prev, ""]);
  const removeSubject = (index: number) =>
    setSubjects((prev) => prev.filter((_, i) => i !== index));
  const updateSubject = (index: number, value: string) =>
    setSubjects((prev) => prev.map((s, i) => (i === index ? value : s)));

  const generate = async () => {
    const validSubjects = subjects.filter((s) => s.trim());
    if (validSubjects.length === 0 || isLoading) return;
    setIsLoading(true);
    setResult(null);

    const prompt = `Create a full-day study timetable for these subjects: ${validSubjects.join(", ")}.
Study hours per day: ${hoursPerDay}. Duration: ${days} days.
Include wake-up routine, study blocks, breaks, meals, revision, practice, and sleep.
Make it realistic with specific times from morning to night.`;

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [{ role: "user", content: prompt }],
          mode: "timetable",
        },
      });
      if (error) throw error;
      setResult(data.timetable);
    } catch {
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Group rows into chunks of 5 for grid rows
  const chunkedRows = result ? chunkArray(result.rows, 5) : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <Calendar className="w-4 h-4 text-accent-foreground" />
        </div>
        <h1 className="font-heading font-semibold text-foreground">Study Planner</h1>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Subjects */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Subjects / Topics
          </label>
          <div className="space-y-2">
            {subjects.map((subject, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={subject}
                  onChange={(e) => updateSubject(i, e.target.value)}
                  placeholder={`Subject ${i + 1} (e.g., Mathematics, Physics)`}
                  className="bg-card border-border rounded-xl text-sm"
                />
                {subjects.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeSubject(i)} className="shrink-0">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addSubject} className="mt-2 rounded-xl text-xs">
            <Plus className="w-3 h-3 mr-1" /> Add Subject
          </Button>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Hours per day</label>
            <Input
              type="number" min="1" max="16"
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(e.target.value)}
              className="bg-card border-border rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Number of days</label>
            <Input
              type="number" min="1" max="90"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="bg-card border-border rounded-xl text-sm"
            />
          </div>
        </div>

        <Button
          onClick={generate}
          disabled={!subjects.some((s) => s.trim()) || isLoading}
          className="bg-accent text-accent-foreground hover:bg-accent/90 border-0 rounded-xl px-6"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Generate Study Plan</>
          )}
        </Button>

        {/* Visual Timetable */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Title Banner */}
              <div className="bg-accent rounded-2xl py-4 px-6 text-center shadow-card">
                <h2 className="font-heading font-bold text-xl text-accent-foreground tracking-wide uppercase">
                  {result.title}
                </h2>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 justify-center">
                {Object.entries(typeLabels).map(([key, { label, color }]) => (
                  <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`w-3 h-3 rounded-full ${color}`} />
                    {label}
                  </div>
                ))}
              </div>

              {/* Card Grid */}
              <div className="space-y-3">
                {chunkedRows.map((row, rowIdx) => (
                  <div key={rowIdx} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {row.map((item, colIdx) => {
                      const style = typeStyles[item.type] || typeStyles.other;
                      return (
                        <motion.div
                          key={colIdx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (rowIdx * 5 + colIdx) * 0.03 }}
                          className={`rounded-xl border-2 ${style.border} ${style.bg} p-4 flex flex-col items-center text-center gap-2 shadow-sm hover:shadow-md transition-shadow`}
                        >
                          <div className="flex items-center gap-1.5">
                            {style.icon}
                            <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                              {item.time}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80 leading-snug">
                            {item.activity}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Tips */}
              {result.tips && result.tips.length > 0 && (
                <div className="bg-card rounded-2xl shadow-card p-6">
                  <h3 className="font-heading font-semibold text-foreground mb-3">💡 Study Tips</h3>
                  <ul className="space-y-2">
                    {result.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export default Timetable;
