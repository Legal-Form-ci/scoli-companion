import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  User,
  LogOut,
  Search,
  Truck,
  Heart,
  Phone,
  ChevronDown,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationBell from "./NotificationBell";
import GlobalSearch from "./GlobalSearch";
import SideCart from "./SideCart";
import { useWishlist } from "@/hooks/useWishlist";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDashboard = /^\/(admin|vendor|delivery|moderator|team|me|account|compte|wishlist)(\/|$)/.test(pathname);

  const categories = [
    { label: "Maternelle", href: "/shop?category=scoly-maternelle" },
    { label: "Primaire", href: "/shop?category=scoly-primaire" },
    { label: "Secondaire", href: "/shop?category=scoly-secondaire" },
    { label: "Universitaire", href: "/shop?category=scoly-universite" },
    { label: "Bureautique", href: "/shop?category=scoly-bureautique" },
    { label: "Librairie", href: "/shop?category=scoly-librairie" },
  ];

  const navItems = [
    { label: "Boutique", href: "/shop" },
    { label: "Kit Scolaire", href: "/kits-scolaires?type=public" },
    { label: "Kit École", href: "/kits-scolaires?type=ecole" },
    { label: "Actualités", href: "/actualites" },
    { label: t.nav.contact, href: "/contact" },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 shadow-sm">
      {/* Utility top bar - Jumia-style */}
      <div className="hidden md:block bg-primary-dark text-primary-foreground text-xs">
        <div className="container mx-auto px-4 flex items-center justify-between h-8">
          <div className="flex items-center gap-4">
            <a href="tel:+2250702584457" className="flex items-center gap-1.5 hover:text-accent transition-colors">
              <Phone size={12} /> +225 07 02 58 44 57
            </a>
            <span className="opacity-40">|</span>
            <span className="flex items-center gap-1.5">
              <Truck size={12} className="text-accent" /> Livraison gratuite en Côte d'Ivoire
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/faq" className="hover:text-accent transition-colors">Aide</Link>
            <Link to="/me" className="hover:text-accent transition-colors">Référent</Link>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center gap-3 sm:gap-6 h-14 sm:h-16">
            {/* Mobile menu */}
            <button
              type="button"
              aria-label="Ouvrir le menu"
              className="lg:hidden p-2 -ml-2 text-foreground"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center shrink-0">
              <Logo showSlogan={false} />
            </Link>

            {/* Search - main, prominent like Jumia */}
            <div className="hidden md:flex flex-1 max-w-2xl">
              <GlobalSearch />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
              <button
                type="button"
                aria-label="Rechercher"
                className="md:hidden p-2 text-foreground"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search size={20} />
              </button>

              {/* Mobile-only login icon */}
              {!user && (
                <Link
                  to="/auth"
                  aria-label="Connexion"
                  className="sm:hidden p-2 text-foreground"
                >
                  <User size={20} />
                </Link>
              )}

              {user && (
                <Link to="/wishlist" className="relative hidden sm:inline-flex">
                  <Button variant="ghost" size="icon" aria-label="Liste de souhaits">
                    <Heart size={20} />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </Button>
                </Link>
              )}

              {user && <NotificationBell />}

              {/* Account dropdown trigger */}
              {user ? (
                <div className="hidden sm:block group relative">
                  <button className="flex items-center gap-1.5 px-2.5 py-2 rounded-md hover:bg-muted transition-colors text-sm">
                    <User size={18} />
                    <span className="font-medium hidden md:inline">Compte</span>
                    <ChevronDown size={14} className="opacity-60" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-56 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="py-2">
                      <Link to="/client" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted">
                        <User size={16} /> Mon compte
                      </Link>
                      <Link to="/wishlist" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted">
                        <Heart size={16} /> Favoris
                      </Link>
                      <div className="my-1 border-t border-border" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted text-left"
                      >
                        <LogOut size={16} /> Déconnexion
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link to="/auth" className="hidden sm:inline-flex">
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <User size={18} />
                    <span className="font-medium">Connexion</span>
                  </Button>
                </Link>
              )}

              {/* Cart - prominent */}
              <SideCart />
            </div>
          </div>

          {/* Mobile search */}
          {showSearch && (
            <div className="md:hidden pb-3">
              <GlobalSearch />
            </div>
          )}
        </div>

        {/* Categories bar - Jumia style */}
        {!isDashboard && (
        <div className="hidden lg:block border-t border-border bg-muted/40">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-1 h-11 overflow-x-auto">
              <Link
                to="/shop"
                className="px-3 py-1.5 rounded-md text-sm font-semibold text-primary hover:bg-primary/10 transition-colors whitespace-nowrap flex items-center gap-1.5"
              >
                <Menu size={14} /> Toutes catégories
              </Link>
              <span className="w-px h-5 bg-border mx-1" />
              {categories.map((c) => (
                <Link
                  key={c.href}
                  to={c.href}
                  className="px-3 py-1.5 rounded-md text-sm text-foreground/80 hover:text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
                >
                  {c.label}
                </Link>
              ))}
              <span className="w-px h-5 bg-border mx-1" />
              {navItems.slice(1).map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="px-3 py-1.5 rounded-md text-sm text-foreground/70 hover:text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ))}
              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                <Headphones size={14} /> Service client 7j/7
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Mobile slide-over menu */}
      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-foreground/40 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-background z-50 shadow-2xl flex flex-col animate-slide-in-left">
            {user && (
              <div className="bg-primary text-primary-foreground p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm opacity-80">Bonjour 👋</p>
                    <p className="font-semibold truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            <nav className="flex-1 overflow-y-auto py-2">
              {!isDashboard && (
                <>
                  <p className="px-5 pt-3 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Catégories
                  </p>
                  {categories.map((c) => (
                    <Link
                      key={c.href}
                      to={c.href}
                      onClick={() => setIsOpen(false)}
                      className="block px-5 py-3 text-foreground hover:bg-muted text-sm"
                    >
                      {c.label}
                    </Link>
                  ))}

                  <p className="px-5 pt-4 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Explorer
                  </p>
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className="block px-5 py-3 text-foreground hover:bg-muted text-sm"
                    >
                      {item.label}
                    </Link>
                  ))}
                </>
              )}

              {user && (
                <>
                  <p className="px-5 pt-4 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Mon espace
                  </p>
                  <Link to="/account" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-muted">
                    <User size={16} /> Mon compte
                  </Link>
                  <Link to="/wishlist" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-muted">
                    <Heart size={16} /> Favoris {wishlistCount > 0 && <span className="ml-auto text-xs bg-secondary text-secondary-foreground px-1.5 rounded-full">{wishlistCount}</span>}
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setIsOpen(false); }}
                    className="w-full text-left flex items-center gap-3 px-5 py-3 text-sm hover:bg-muted text-destructive"
                  >
                    <LogOut size={16} /> Déconnexion
                  </button>
                </>
              )}
            </nav>

            <div className="p-4 border-t border-border bg-muted/40 text-xs text-muted-foreground space-y-1">
              <a href="tel:+2250702584457" className="flex items-center gap-2"><Phone size={12} /> +225 07 02 58 44 57</a>
              <span className="flex items-center gap-2"><Truck size={12} /> Livraison gratuite</span>
            </div>
          </aside>
        </>
      )}
    </header>
  );
};

export default Navbar;
