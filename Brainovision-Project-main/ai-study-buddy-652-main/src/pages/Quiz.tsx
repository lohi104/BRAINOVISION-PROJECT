import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Brain, Sparkles, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type Question = {
  question: string;
  options: string[];
  correct: number;
};

const Quiz = () => {
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const generate = async () => {
    if (!topic.trim() || isLoading) return;
    setIsLoading(true);
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [{ role: "user", content: topic }],
          mode: "quiz",
        },
      });
      if (error) throw error;
      setQuestions(data.questions || []);
    } catch {
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0),
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card">
        <Link to="/">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
          <Brain className="w-4 h-4 text-primary-foreground" />
        </div>
        <h1 className="font-heading font-semibold text-foreground">Quiz Generator</h1>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex gap-3">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic (e.g., DBMS, Photosynthesis, React Hooks)"
            className="bg-card border-border rounded-xl"
            onKeyDown={(e) => e.key === "Enter" && generate()}
          />
          <Button
            onClick={generate}
            disabled={!topic.trim() || isLoading}
            className="gradient-accent border-0 text-primary-foreground rounded-xl px-6 shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2" /> Generate</>}
          </Button>
        </div>

        <AnimatePresence>
          {questions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5"
            >
              {questions.map((q, qi) => (
                <motion.div
                  key={qi}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: qi * 0.1 }}
                  className="bg-card rounded-2xl shadow-card p-6"
                >
                  <p className="font-medium text-card-foreground mb-4">
                    <span className="text-primary font-heading font-bold mr-2">Q{qi + 1}.</span>
                    {q.question}
                  </p>
                  <div className="grid gap-2">
                    {q.options.map((opt, oi) => {
                      const selected = answers[qi] === oi;
                      const isCorrect = q.correct === oi;
                      let optionClass = "border-border bg-muted/50 hover:bg-muted text-foreground";
                      if (submitted) {
                        if (isCorrect) optionClass = "border-primary bg-primary/10 text-primary";
                        else if (selected && !isCorrect) optionClass = "border-destructive bg-destructive/10 text-destructive";
                      } else if (selected) {
                        optionClass = "border-primary bg-primary/10 text-primary";
                      }

                      return (
                        <button
                          key={oi}
                          onClick={() => !submitted && setAnswers((p) => ({ ...p, [qi]: oi }))}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${optionClass}`}
                        >
                          <span className="flex items-center gap-2">
                            {submitted && isCorrect && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                            {submitted && selected && !isCorrect && <XCircle className="w-4 h-4 shrink-0" />}
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ))}

              {!submitted ? (
                <Button
                  onClick={() => setSubmitted(true)}
                  disabled={Object.keys(answers).length < questions.length}
                  className="gradient-hero border-0 text-primary-foreground rounded-xl px-8"
                >
                  Submit Quiz
                </Button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card rounded-2xl shadow-card p-6 text-center"
                >
                  <h2 className="font-heading text-3xl font-bold text-foreground mb-1">
                    {score}/{questions.length}
                  </h2>
                  <p className="text-muted-foreground">
                    {score === questions.length ? "Perfect score! 🎉" : score >= questions.length / 2 ? "Good job! Keep practicing 💪" : "Keep studying, you'll get there! 📚"}
                  </p>
                  <Button
                    onClick={() => { setQuestions([]); setAnswers({}); setSubmitted(false); }}
                    variant="outline"
                    className="mt-4 rounded-xl"
                  >
                    Try Another Topic
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Quiz;
