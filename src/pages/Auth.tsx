import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, AtSign, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import MathCaptcha from "@/components/MathCaptcha";
import { z } from "zod";
import { toast } from "sonner";
import { useRateLimit } from "@/hooks/useRateLimit";
import { getDashboardPathForRoles, isPlatformAdmin, isReferent, isTeamMember } from "@/lib/rbac";


const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState(""); // email or username
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; checks: boolean[] }>({ score: 0, checks: [] });
  const [captchaValid, setCaptchaValid] = useState(false);
  // Captcha activé sur les portails internes (/me, /team) uniquement
  const { pathname: routePath } = useLocation();
  const requiresCaptcha = routePath === "/me" || routePath === "/team";

  const { signIn, signUp, user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  
  // Rate limiting for login/signup
  const loginRateLimit = useRateLimit('auth_login', { maxAttempts: 5, windowSeconds: 300, blockSeconds: 900 });
  const signupRateLimit = useRateLimit('auth_signup', { maxAttempts: 3, windowSeconds: 600, blockSeconds: 1800 });
  const resetRateLimit = useRateLimit('auth_reset', { maxAttempts: 3, windowSeconds: 600, blockSeconds: 1800 });

  const redirectToDashboard = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', u.id);

    const roleList = (roles || []).map((r) => r.role);
    const isAdmin = isPlatformAdmin(roleList);
    const isTeam = isTeamMember(roleList);
    const isPartner = isReferent(roleList);

    // Séparation stricte par portail : chaque portail n'accepte que ses rôles.
    if (pathname === '/team') {
      if (isAdmin) navigate('/admin', { replace: true });
      else if (isTeam) navigate('/team', { replace: true });
      else { toast.error("Ce compte n'a pas accès à l'espace équipe."); await supabase.auth.signOut(); }
    } else if (pathname === '/me' || pathname === '/client') {
      if (pathname === '/me') {
        if (isPartner) navigate('/me', { replace: true });
        else { toast.error("Ce compte n'a pas accès à l'espace référent."); navigate(getDashboardPathForRoles(roleList), { replace: true }); }
      } else if (isAdmin || isTeam || isPartner) {
        navigate(getDashboardPathForRoles(roleList), { replace: true });
      } else navigate('/client', { replace: true });
    } else {
      if (isAdmin) navigate('/admin', { replace: true });
      else if (isTeam) navigate('/team', { replace: true });
      else if (isPartner) navigate('/me', { replace: true });
      else navigate('/client', { replace: true });
    }
  };

  useEffect(() => {
    if (user) {
      redirectToDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Enhanced password validation rules
  const passwordRules = {
    minLength: 8,
    hasUppercase: /[A-Z]/,
    hasLowercase: /[a-z]/,
    hasNumber: /[0-9]/,
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/,
  };

  const passwordMessages = {
    fr: {
      minLength: "Au moins 8 caractères",
      hasUppercase: "Au moins une majuscule",
      hasLowercase: "Au moins une minuscule", 
      hasNumber: "Au moins un chiffre",
      hasSpecial: "Au moins un caractère spécial (!@#$%...)",
      leaked: "Ce mot de passe a été compromis. Choisissez-en un autre.",
      weak: "Mot de passe trop faible",
      medium: "Mot de passe moyen",
      strong: "Mot de passe fort",
      mismatch: "Les mots de passe ne correspondent pas",
    },
    en: {
      minLength: "At least 8 characters",
      hasUppercase: "At least one uppercase letter",
      hasLowercase: "At least one lowercase letter",
      hasNumber: "At least one number",
      hasSpecial: "At least one special character (!@#$%...)",
      leaked: "This password has been compromised. Please choose another.",
      weak: "Weak password",
      medium: "Medium password",
      strong: "Strong password",
      mismatch: "Passwords do not match",
    },
    de: {
      minLength: "Mindestens 8 Zeichen",
      hasUppercase: "Mindestens ein Großbuchstabe",
      hasLowercase: "Mindestens ein Kleinbuchstabe",
      hasNumber: "Mindestens eine Zahl",
      hasSpecial: "Mindestens ein Sonderzeichen (!@#$%...)",
      leaked: "Dieses Passwort wurde kompromittiert. Wählen Sie ein anderes.",
      weak: "Schwaches Passwort",
      medium: "Mittleres Passwort",
      strong: "Starkes Passwort",
      mismatch: "Passwörter stimmen nicht überein",
    },
    es: {
      minLength: "Al menos 8 caracteres",
      hasUppercase: "Al menos una mayúscula",
      hasLowercase: "Al menos una minúscula",
      hasNumber: "Al menos un número",
      hasSpecial: "Al menos un carácter especial (!@#$%...)",
      leaked: "Esta contraseña ha sido comprometida. Elija otra.",
      weak: "Contraseña débil",
      medium: "Contraseña media",
      strong: "Contraseña fuerte",
      mismatch: "Las contraseñas no coinciden",
    },
  };

  const pwdMsg = passwordMessages[language] || passwordMessages.fr;

  // Check password strength in real-time
  useEffect(() => {
    if (!isLogin && password) {
      const checks = [
        password.length >= passwordRules.minLength,
        passwordRules.hasUppercase.test(password),
        passwordRules.hasLowercase.test(password),
        passwordRules.hasNumber.test(password),
        passwordRules.hasSpecial.test(password),
      ];
      const score = checks.filter(Boolean).length;
      setPasswordStrength({ score, checks });
    }
  }, [password, isLogin]);

  const getPasswordStrengthLabel = () => {
    if (passwordStrength.score <= 2) return { label: pwdMsg.weak, color: "text-destructive" };
    if (passwordStrength.score <= 3) return { label: pwdMsg.medium, color: "text-yellow-600" };
    return { label: pwdMsg.strong, color: "text-green-600" };
  };

  const loginSchema = z.object({
    identifier: z.string().min(1, t.common.required),
    password: z.string().min(1, t.common.required),
  });

  const signupSchema = z.object({
    email: z.string().email(t.common.error).max(255),
    password: z.string()
      .min(8, pwdMsg.minLength)
      .refine((val) => passwordRules.hasUppercase.test(val), pwdMsg.hasUppercase)
      .refine((val) => passwordRules.hasLowercase.test(val), pwdMsg.hasLowercase)
      .refine((val) => passwordRules.hasNumber.test(val), pwdMsg.hasNumber)
      .refine((val) => passwordRules.hasSpecial.test(val), pwdMsg.hasSpecial),
    confirmPassword: z.string(),
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    username: z.string().min(3).max(50).optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: pwdMsg.mismatch,
    path: ["confirmPassword"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (requiresCaptcha && !captchaValid) {
        toast.error("Veuillez résoudre le calcul de sécurité.");
        setLoading(false);
        return;
      }



      // Check rate limit first
      const rateLimit = isLogin ? loginRateLimit : signupRateLimit;
      const rateLimitResult = await rateLimit.checkRateLimit();
      
      if (!rateLimitResult.allowed) {
        const blockedMessage = rateLimitResult.blockedUntil 
          ? `Trop de tentatives. Réessayez dans ${rateLimit.formatBlockedTime(rateLimitResult.blockedUntil)}.`
          : "Trop de tentatives. Veuillez réessayer plus tard.";
        toast.error(blockedMessage);
        setLoading(false);
        return;
      }

      if (isLogin) {
        const result = loginSchema.safeParse({ identifier, password });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0].toString()] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        // Check if identifier is email or username
        let loginEmail = identifier;
        
        // If not an email, try to find the user by username in profiles
        if (!identifier.includes('@')) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('username', identifier)
            .maybeSingle();
          
          if (profile?.email) {
            loginEmail = profile.email;
          } else if (profile?.id) {
            // User has username but no email stored - can't login by username yet
            setErrors({ identifier: "Connectez-vous avec votre email. Le nom d'utilisateur sera disponible après votre première connexion." });
            setLoading(false);
            return;
          } else {
            setErrors({ identifier: "Utilisateur non trouvé" });
            setLoading(false);
            return;
          }
        }

         const { error } = await signIn(loginEmail, password);
         if (!error) {
           // Update profile with email on successful login
           const { data: { user: loggedUser } } = await supabase.auth.getUser();
           if (loggedUser?.email) {
             await supabase
               .from('profiles')
               .update({ email: loggedUser.email })
               .eq('id', loggedUser.id);
           }
           await redirectToDashboard();
         }
      } else {
        const result = signupSchema.safeParse({
          email,
          password,
          confirmPassword,
          firstName,
          lastName,
          username,
        });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0].toString()] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

         const { error } = await signUp(email, password, firstName, lastName);
         if (!error) {
           // Update username if provided
           if (username) {
             const { data: { user: newUser } } = await supabase.auth.getUser();
             if (newUser) {
               await supabase
                 .from('profiles')
                 .update({ username })
                 .eq('id', newUser.id);
             }
           }
           await redirectToDashboard();
         }
      }
    } finally {
      setLoading(false);
    }
  };

  // OAuth Google/Apple supprimé - Authentification email/password uniquement

  // Portal identity — chaque chemin a sa propre couleur, ses propres textes.
  const isTeamPortal = routePath === "/team";
  const isPartnerPortal = routePath === "/me";
  const isClientPortal = !isTeamPortal && !isPartnerPortal;

  // Sur les portails internes/partenaires, pas d'auto-inscription publique.
  const allowSignup = isClientPortal;
  useEffect(() => {
    if (!allowSignup && !isLogin) setIsLogin(true);
  }, [allowSignup, isLogin]);

  const portal = isTeamPortal
    ? {
        label: "Portail Équipe Scoly",
        tagline: "Opérations · Modération · Commercial · Comptabilité",
        subtitle: "Espace strictement réservé aux équipes internes Scoly.",
        loginTitle: "Connexion Équipe",
        loginCta: "Accéder à mon espace équipe",
        identifierPlaceholder: "prenom.nom@scoly.ci",
        passwordHint: "Identifiants fournis par votre responsable Scoly.",
        bg: "bg-gradient-to-br from-slate-900 via-primary to-slate-900",
        accent: "text-accent",
      }
    : isPartnerPortal
    ? {
        label: "Portail Référent",
        tagline: "Écoles · Associations · Référents partenaires validés",
        subtitle: "Réservé aux référents et partenaires officiellement validés par Scoly.",
        loginTitle: "Connexion Référent",
        loginCta: "Accéder à mon espace référent",
        identifierPlaceholder: "referent@monetablissement.ci",
        passwordHint: "Pas encore référent ? Contactez Scoly pour être validé.",
        bg: "bg-gradient-to-br from-primary via-primary/90 to-accent/40",
        accent: "text-accent-foreground",
      }
    : {
        label: "Espace Client",
        tagline: "Achats · Suivi de commandes · Historique · Fidélité",
        subtitle: isLogin
          ? "Connectez-vous pour retrouver vos commandes et vos favoris."
          : "Créez votre compte client Scoly en quelques secondes.",
        loginTitle: isLogin ? "Connexion Client" : "Créer un compte client",
        loginCta: isLogin ? "Se connecter" : "Créer mon compte",
        identifierPlaceholder: "email@example.ci ou votre nom d'utilisateur",
        passwordHint: "",
        bg: "bg-primary",
        accent: "text-primary-foreground",
      };

  return (
    <div className={`min-h-screen ${portal.bg} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        <div className={`mb-4 text-center ${portal.accent}`}>
          <span className="inline-block px-3 py-1 rounded-full bg-background/10 backdrop-blur border border-background/20 text-xs font-semibold uppercase tracking-wider">
            {portal.label}
          </span>
          <p className="mt-2 text-xs sm:text-sm opacity-90">{portal.tagline}</p>
        </div>
        <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>

          <h1 className="text-2xl font-display font-bold text-center text-foreground mb-2">
            {portal.loginTitle}
          </h1>
          <p className="text-center text-muted-foreground mb-6 text-sm">
            {portal.subtitle}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">{t.auth.firstName}</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-10"
                        placeholder="Innocent"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-sm text-destructive mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">{t.auth.lastName}</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="pl-10"
                        placeholder="KOFFI"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="text-sm text-destructive mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <div className="relative mt-1">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      placeholder="innocent_koffi"
                    />
                  </div>
                  {errors.username && (
                    <p className="text-sm text-destructive mt-1">{errors.username}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">{t.auth.email}</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder="innocent.koffi@email.ci"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email}</p>
                  )}
                </div>
              </>
            )}

            {isLogin && (
              <div>
                <Label htmlFor="identifier">
                  {isClientPortal ? "Email ou nom d'utilisateur" : "Email professionnel"}
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="pl-10"
                    placeholder={portal.identifierPlaceholder}
                    required
                    autoComplete="username"
                  />
                </div>
                {portal.passwordHint && !isClientPortal && (
                  <p className="text-[11px] text-muted-foreground mt-1">{portal.passwordHint}</p>
                )}
                {errors.identifier && (
                  <p className="text-sm text-destructive mt-1">{errors.identifier}</p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="password">{t.auth.password}</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password}</p>
              )}
              
              {/* Password Strength Indicator */}
              {!isLogin && password && (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= passwordStrength.score
                            ? passwordStrength.score <= 2
                              ? "bg-destructive"
                              : passwordStrength.score <= 3
                              ? "bg-yellow-500"
                              : "bg-green-500"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${getPasswordStrengthLabel().color}`}>
                    {getPasswordStrengthLabel().label}
                  </p>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    {[
                      { check: passwordStrength.checks[0], label: pwdMsg.minLength },
                      { check: passwordStrength.checks[1], label: pwdMsg.hasUppercase },
                      { check: passwordStrength.checks[2], label: pwdMsg.hasLowercase },
                      { check: passwordStrength.checks[3], label: pwdMsg.hasNumber },
                      { check: passwordStrength.checks[4], label: pwdMsg.hasSpecial },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        {item.check ? (
                          <CheckCircle size={12} className="text-green-500" />
                        ) : (
                          <AlertTriangle size={12} className="text-muted-foreground" />
                        )}
                        <span className={item.check ? "text-green-600" : "text-muted-foreground"}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    placeholder="••••••••"
                    required
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  aria-label="Mot de passe oublié"
                  className="text-sm text-primary hover:underline"
                  onClick={async () => {
                    const resetEmail = identifier.includes('@') ? identifier : '';
                    if (!resetEmail) {
                      toast.error(language === 'fr' ? "Veuillez entrer votre adresse email." : "Please enter your email address.");
                      return;
                    }
                    // Rate limit password reset requests
                    const rlResult = await resetRateLimit.checkRateLimit();
                    if (!rlResult.allowed) {
                      toast.error(`Trop de demandes. Réessayez dans ${resetRateLimit.formatBlockedTime(rlResult.blockedUntil!)}.`);
                      return;
                    }
                    try {
                      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                        redirectTo: `${window.location.origin}/auth/reset-password`,
                      });
                      if (error) throw error;
                      toast.success(language === 'fr' 
                        ? "Un lien de réinitialisation a été envoyé à votre email." 
                        : "A reset link has been sent to your email.");
                    } catch (err: any) {
                      toast.error(err.message || "Erreur lors de l'envoi du lien.");
                    }
                  }}
                >
                  {t.auth.forgotPassword}
                </button>
              </div>
            )}

            {requiresCaptcha && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <MathCaptcha onValidChange={setCaptchaValid} />
                <p className="text-[11px] text-muted-foreground mt-2">
                  Portail interne : la vérification anti-robot est requise.
                </p>
              </div>
            )}

            <Button type="submit" variant="hero" className="w-full" disabled={loading || (requiresCaptcha && !captchaValid)}>
              {loading ? t.common.loading : portal.loginCta}
            </Button>
          </form>

          {/* Toggle inscription — Clients uniquement */}
          {allowSignup ? (
            <p className="text-center text-muted-foreground mt-6 text-sm">
              {isLogin ? t.auth.noAccount : t.auth.hasAccount}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? "Créer un compte client" : "Se connecter"}
              </button>
            </p>
          ) : (
            <p className="text-center text-muted-foreground mt-6 text-xs">
              {isTeamPortal
                ? "Vous n'avez pas encore d'accès équipe ? Contactez votre responsable Scoly."
                : "Vous souhaitez devenir référent partenaire ? "}
              {isPartnerPortal && (
                <Link to="/contact" className="text-primary font-medium hover:underline">
                  Contactez-nous
                </Link>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;