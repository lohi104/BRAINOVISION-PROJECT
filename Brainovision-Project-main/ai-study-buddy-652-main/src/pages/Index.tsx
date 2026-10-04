import { motion } from "framer-motion";
import { MessageCircle, FileText, Brain, ArrowRight, Sparkles, Calendar, FileQuestion } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: MessageCircle,
    title: "AI Chat Tutor",
    description: "Ask any question and get clear, step-by-step explanations instantly.",
    path: "/chat",
    gradient: "gradient-hero",
  },
  {
    icon: FileText,
    title: "Notes Simplifier",
    description: "Paste your notes and get concise summaries with key concepts highlighted.",
    path: "/notes",
    gradient: "gradient-warm",
  },
  {
    icon: Brain,
    title: "Quiz Generator",
    description: "Enter any topic and get instant MCQs to test your understanding.",
    path: "/quiz",
    gradient: "gradient-accent",
  },
  {
    icon: Calendar,
    title: "Study Planner",
    description: "Generate a personalized timetable and study plan for your subjects.",
    path: "/timetable",
    gradient: "gradient-hero",
  },
  {
    icon: FileQuestion,
    title: "Doubt Solver",
    description: "Upload a question image or type your doubt — AI solves it step-by-step.",
    path: "/doubt",
    gradient: "gradient-warm",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold text-foreground">StudyAI</span>
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Learning
          </div>
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
            Learn Smarter,<br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>
              Not Harder
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Your AI study companion that explains concepts, simplifies notes, and quizzes you — all in seconds.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
            >
              <Link
                to={feature.path}
                className="group block bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 text-left"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.gradient} flex items-center justify-center mb-5`}>
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-card-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>
                <span className="inline-flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
                  Try it <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
