import { useState } from "react";
import { Mail, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NewsletterSignup = ({ variant = "default" }: { variant?: "default" | "footer" }) => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("subscribe-newsletter", {
      body: { email, first_name: firstName, source: variant, website },
    });
    setLoading(false);
    if (error || data?.error) return toast.error(data?.error || "Erreur, réessayez");
    setDone(true);
    toast.success(data?.already ? "Vous êtes déjà abonné ✓" : "📧 Vérifiez votre email pour confirmer");
    setEmail(""); setFirstName("");
    setTimeout(() => setDone(false), 5000);
  };

  if (variant === "footer") {
    return (
      <form onSubmit={submit} className="flex flex-col gap-2">
        <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)}
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} aria-hidden />
        <Input type="text" placeholder="Votre nom complet" value={firstName} onChange={e => setFirstName(e.target.value)}
          className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60" />
        <div className="flex flex-col sm:flex-row gap-2">
          <Input type="email" required placeholder="Votre email" value={email} onChange={e => setEmail(e.target.value)}
            className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60" />
          <Button type="submit" disabled={loading || done} variant="hero" className="shrink-0">
            {done ? <CheckCircle size={16} /> : <Send size={16} />}
            {done ? "Vérifiez email" : "S'abonner"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-gradient-hero text-primary-foreground rounded-2xl p-6 sm:p-10">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 max-w-4xl mx-auto">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase mb-3">
            <Mail size={12} /> Newsletter Scoly
          </div>
          <h3 className="font-display text-2xl sm:text-3xl font-bold mb-2">Restez informés des meilleures offres</h3>
          <p className="text-primary-foreground/80 text-sm sm:text-base">Promos exclusives, nouveautés et conseils rentrée — directement dans votre boîte mail.</p>
        </div>
        <form onSubmit={submit} className="w-full md:w-auto flex flex-col sm:flex-row gap-2 md:min-w-[400px]">
          <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)}
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} aria-hidden />
          <Input type="text" placeholder="Prénom" value={firstName} onChange={e => setFirstName(e.target.value)}
            className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60" />
          <Input type="email" required placeholder="Votre email" value={email} onChange={e => setEmail(e.target.value)}
            className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60" />
          <Button type="submit" disabled={loading || done} variant="hero" className="shrink-0">
            {done ? <><CheckCircle size={16} /> Vérifiez email</> : <>S'abonner <Send size={16} /></>}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default NewsletterSignup;
