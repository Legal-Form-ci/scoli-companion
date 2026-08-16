const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-label="Chargement">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-muted-foreground text-sm font-medium">Chargement…</p>
    </div>
  </div>
);

export default PageLoader;
