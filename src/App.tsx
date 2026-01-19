import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLockProvider } from "@/components/AppLockProvider";
import { UpdateSheetProvider } from "@/contexts/UpdateSheetContext";
import { PageLoader } from "@/components/PageLoader";

// Lazy load all pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const CalendarPage = lazy(() => import("./pages/Calendar"));
const StatsPage = lazy(() => import("./pages/Stats"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const DebugPage = lazy(() => import("./pages/Debug"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const MedicationsPage = lazy(() => import("./pages/Medications"));
const NotFound = lazy(() => import("./pages/NotFound"));

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

// Wrapper for routes with Suspense
function AppContent() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/debug" element={<DebugPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/medications" element={<MedicationsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="cycle-tracker-theme">
      <AppLockProvider>
        <TooltipProvider>
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
