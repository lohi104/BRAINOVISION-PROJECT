import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Image, Sparkles, Loader2, X, FileQuestion } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

const DoubtSolver = () => {
  const [question, setQuestion] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const solve = async () => {
    if ((!question.trim() && !imageBase64) || isLoading) return;
    setIsLoading(true);
    setResult("");

    let userContent = question.trim();
    if (imageBase64) {
      userContent = `[An image has been uploaded with this question]\n\n${userContent || "Please solve this question and explain the solution step by step."}`;
    }

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [{ role: "user", content: userContent }],
          mode: "doubt",
          image: imageBase64 || undefined,
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
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
          <FileQuestion className="w-4 h-4 text-primary-foreground" />
        </div>
        <h1 className="font-heading font-semibold text-foreground">Doubt Solver</h1>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Image Upload */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Upload a screenshot of your question (optional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Question preview"
                className="max-h-60 rounded-xl border border-border"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full"
                onClick={removeImage}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <Image className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium">Click to upload image</span>
              <span className="text-xs">PNG, JPG, or screenshot</span>
            </button>
          )}
        </div>

        {/* Text Question */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Type your question
          </label>
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Describe your doubt or type the question here..."
            className="min-h-[120px] bg-card border-border rounded-xl text-sm"
          />
        </div>

        <Button
          onClick={solve}
          disabled={(!question.trim() && !imageBase64) || isLoading}
          className="gradient-hero border-0 text-primary-foreground rounded-xl px-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Solving...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" /> Solve Doubt
            </>
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
              <h2 className="font-heading font-semibold text-foreground mb-4">Solution</h2>
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

export default DoubtSolver;
