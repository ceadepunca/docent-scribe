import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProtectedLayout from "@/components/ProtectedLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import NewInscription from "./pages/NewInscription";
import Inscriptions from "./pages/Inscriptions";
import InscriptionDetail from "./pages/InscriptionDetail";
import EditInscription from "./pages/EditInscription";
import Evaluations from "./pages/Evaluations";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Profile />
                </ProtectedLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <AdminPanel />
                </ProtectedLayout>
              </ProtectedRoute>
            } />
            <Route path="/inscriptions/new" element={
              <ProtectedRoute requiredRole="docente">
                <ProtectedLayout>
                  <NewInscription />
                </ProtectedLayout>
              </ProtectedRoute>
            } />
            <Route path="/new-inscription" element={
              <ProtectedRoute requiredRole="docente">
                <ProtectedLayout>
                  <NewInscription />
                </ProtectedLayout>
              </ProtectedRoute>
            } />
            <Route path="/inscriptions" element={
              <ProtectedRoute allowedRoles={['docente', 'super_admin', 'evaluator']}>
                <ProtectedLayout>
                  <Inscriptions />
                </ProtectedLayout>
              </ProtectedRoute>
            } />
            <Route path="/evaluations" element={
              <ProtectedRoute allowedRoles={['evaluator', 'super_admin']}>
                <ProtectedLayout>
                  <Evaluations />
                </ProtectedLayout>
              </ProtectedRoute>
            } />
            <Route path="/inscriptions/:id" element={
              <ProtectedRoute allowedRoles={['docente', 'super_admin', 'evaluator']}>
                <ProtectedLayout>
                  <InscriptionDetail />
                </ProtectedLayout>
              </ProtectedRoute>
            } />
            <Route path="/inscriptions/:id/edit" element={
              <ProtectedRoute requiredRole="docente">
                <ProtectedLayout>
                  <EditInscription />
                </ProtectedLayout>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
