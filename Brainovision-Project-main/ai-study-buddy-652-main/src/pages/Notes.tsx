import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, FileText, Sparkles, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

const Notes = () => {
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const simplify = async () => {
    if (!notes.trim() || isLoading) return;
    setIsLoading(true);
    setResult("");

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [{ role: "user", content: notes }],
          mode: "notes",
        },
      });
      if (error) throw error;
      setResult(data.reply);
    } catch {
      setResult("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card">
        <Link to="/">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="w-8 h-8 rounded-lg gradient-warm flex items-center justify-center">
          <FileText className="w-4 h-4 text-primary-foreground" />
        </div>
        <h1 className="font-heading font-semibold text-foreground">Notes Simplifier</h1>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Paste your notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your lecture notes, textbook content, or any study material here..."
            className="min-h-[200px] bg-card border-border rounded-xl text-sm"
          />
        </div>

        <Button
          onClick={simplify}
          disabled={!notes.trim() || isLoading}
          className="gradient-warm border-0 text-primary-foreground rounded-xl px-6"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Simplifying...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Simplify Notes</>
          )}
        </Button>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-card rounded-2xl shadow-card p-6"
            >
              <h2 className="font-heading font-semibold text-foreground mb-4">Simplified Notes</h2>
              <div className="prose prose-sm max-w-none text-card-foreground">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Notes;
