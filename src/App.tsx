import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLockProvider } from "@/components/AppLockProvider";
import { UpdateSheetProvider } from "@/contexts/UpdateSheetContext";
import { OfflineIndicator } from "@/components/OfflineIndicator";

// 🚀 Eager load primary tabs for instant navigation (no loading delay)
import Index from "./pages/Index";
import CalendarPage from "./pages/Calendar";
import StatsPage from "./pages/Stats";
import MedicationsPage from "./pages/Medications";

// Lazy load secondary pages (less frequently accessed)
const Onboarding = lazy(() => import("./pages/Onboarding"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const DebugPage = lazy(() => import("./pages/Debug"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Minimal inline loader for lazy pages only
const MinimalLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Wrapper for routes - primary tabs are eager loaded, secondary pages use Suspense
function AppContent() {
  return (
    <Routes>
      {/* Primary tabs - eager loaded for instant navigation */}
      <Route path="/" element={<Index />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/medications" element={<MedicationsPage />} />
      
      {/* Secondary pages - lazy loaded with minimal loader */}
      <Route path="/onboarding" element={
        <Suspense fallback={<MinimalLoader />}><Onboarding /></Suspense>
      } />
      <Route path="/settings" element={
        <Suspense fallback={<MinimalLoader />}><SettingsPage /></Suspense>
      } />
      <Route path="/debug" element={
        <Suspense fallback={<MinimalLoader />}><DebugPage /></Suspense>
      } />
      <Route path="/profile" element={
        <Suspense fallback={<MinimalLoader />}><ProfilePage /></Suspense>
      } />
      <Route path="*" element={
        <Suspense fallback={<MinimalLoader />}><NotFound /></Suspense>
      } />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="cycle-tracker-theme">
      <AppLockProvider>
        <TooltipProvider>
          <OfflineIndicator />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <UpdateSheetProvider>
              <AppContent />
            </UpdateSheetProvider>
          </BrowserRouter>
        </TooltipProvider>
      </AppLockProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
