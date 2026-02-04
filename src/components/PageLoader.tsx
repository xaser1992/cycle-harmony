// PageLoader - CSS-only for better performance
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <span className="text-sm text-muted-foreground">
          Yükleniyor...
        </span>
      </div>
    </div>
  );
}
