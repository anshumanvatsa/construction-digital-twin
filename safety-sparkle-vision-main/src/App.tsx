import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SimulationProvider } from "@/contexts/SimulationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { RealtimeProvider } from "@/contexts/RealtimeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const MapPage = lazy(() => import("@/pages/MapPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const SimulationPage = lazy(() => import("@/pages/SimulationPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const WorkersPage = lazy(() => import("@/pages/WorkersPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

function AppLoadingFallback() {
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<AppLoadingFallback />}>
          <AuthProvider>
            <RealtimeProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route
                    element={(
                      <SimulationProvider>
                        <AppLayout />
                      </SimulationProvider>
                    )}
                  >
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/map" element={<MapPage />} />
                    <Route path="/workers" element={<WorkersPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/simulation" element={<SimulationPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </RealtimeProvider>
          </AuthProvider>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
