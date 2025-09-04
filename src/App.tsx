import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
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
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/inscriptions/new" element={
              <ProtectedRoute>
                <NewInscription />
              </ProtectedRoute>
            } />
            <Route path="/new-inscription" element={
              <ProtectedRoute>
                <NewInscription />
              </ProtectedRoute>
            } />
            <Route path="/inscriptions" element={
              <ProtectedRoute>
                <Inscriptions />
              </ProtectedRoute>
            } />
            <Route path="/inscriptions/:id" element={
              <ProtectedRoute>
                <InscriptionDetail />
              </ProtectedRoute>
            } />
            <Route path="/inscriptions/:id/edit" element={
              <ProtectedRoute>
                <EditInscription />
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
