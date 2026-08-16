import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getDashboardPathForRoles, isPlatformAdmin } from '@/lib/rbac';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  rolesLoading: boolean;
  roles: string[];
  isAdmin: boolean;
  refreshRoles: () => Promise<void>;
  getDashboardPath: () => string;
  signUp: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const fetchRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching roles:', error);
        // Ne PAS vider les rôles sur erreur transitoire — garde l'état précédent pour éviter le clignotement du menu
        return;
      }

      const nextRoles = (data || []).map((r) => r.role as any);
      // Mise à jour conditionnelle : on évite de remplacer la référence si rien n'a changé
      setRoles((prev) => {
        if (prev.length === nextRoles.length && prev.every((r) => nextRoles.includes(r))) {
          return prev;
        }
        return nextRoles;
      });
      setIsAdmin((prev) => {
        const next = isPlatformAdmin(nextRoles);
        return prev === next ? prev : next;
      });
    } finally {
      setRolesLoading(false);
    }
  };


  const refreshRoles = async () => {
    if (!user?.id) return;
    await fetchRoles(user.id);
  };

  const getDashboardPath = () => {
    return getDashboardPathForRoles(roles);
  };

  useEffect(() => {
    let currentUserId: string | null = null;

    const setupRolesForUser = (userId: string) => {
      if (currentUserId === userId) {
        // Même utilisateur, même canal : ne rien faire (évite la cascade de re-fetch/clignotement)
        return;
      }
      const isNewUser = currentUserId !== userId;
      currentUserId = userId;
      // On ne remet rolesLoading à true que si l'utilisateur change réellement,
      // sinon la barre de navigation clignote à chaque refresh de token.
      if (isNewUser) setRolesLoading(true);

      setTimeout(() => fetchRoles(userId), 0);
    };

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser((prev) => {
        const next = session?.user ?? null;
        // Conserver la même référence si même utilisateur — évite re-renders inutiles
        if (prev?.id === next?.id) return prev;
        return next;
      });
      setLoading(false);

      if (session?.user) {
        setupRolesForUser(session.user.id);
      } else {
        currentUserId = null;
        setRoles([]);
        setIsAdmin(false);
        setRolesLoading(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        setLoading(false);
        setRolesLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();

    };
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/client`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        toast({
          title: "Erreur d'inscription",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Inscription réussie !",
        description: "Bienvenue sur Scoly ! Vous êtes maintenant connecté.",
      });

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erreur de connexion",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Connexion réussie !",
        description: "Bienvenue sur Scoly.",
      });

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté.",
    });
    // Retour vers l'accueil public — évite les boucles de redirection sur /me & /team.
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.location.assign("/");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        rolesLoading,
        roles,
        isAdmin,
        refreshRoles,
        getDashboardPath,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
