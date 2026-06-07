import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useFinanceStore } from './store/useFinanceStore';
import AppLayout from './components/layout/AppLayout';
import AddExpenseModal from './components/forms/AddExpenseModal';
import CookieConsent from './components/ui/CookieConsent';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// Lazy load page modules to optimize initial bundle size & load times
const AuthPage = lazy(() => import('./pages/AuthPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const CardsPage = lazy(() => import('./pages/CardsPage'));
const GoalsPage = lazy(() => import('./pages/GoalsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const PageLoader: React.FC = () => (
  <div className="h-[50vh] flex flex-col items-center justify-center text-brand-on-surface gap-3">
    <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
    <span className="font-mono text-[10px] uppercase font-bold text-brand-outline">Loading component...</span>
  </div>
);

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-surface text-brand-on-surface gap-3">
        <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center animate-pulse-slow border-2 border-brand-on-surface neo-shadow-sm">
          <span className="font-extrabold text-brand-surface-lowest text-lg">L</span>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

export const App: React.FC = () => {
  const { checkAuth, isAuthenticated } = useAuthStore();
  const { syncOfflineData } = useFinanceStore();
  
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    
    // Sync offline mutations when system detects internet recovery
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => syncOfflineData());
    }
  }, []);

  const handleOpenAddExpense = () => {
    setEditExpenseId(null);
    setIsAddExpenseOpen(true);
  };

  const handleOpenEditExpense = (id: string) => {
    setEditExpenseId(id);
    setIsAddExpenseOpen(true);
  };

  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Auth page */}
          <Route 
            path="/auth" 
            element={
              <Suspense fallback={<PageLoader />}>
                {isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />}
              </Suspense>
            } 
          />

          {/* Private Routes with Layout */}
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <AppLayout onOpenAddExpense={handleOpenAddExpense}>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard onOpenAddExpense={handleOpenAddExpense} />} />
                      <Route 
                        path="/expenses" 
                        element={
                          <ExpensesPage 
                            onOpenAddExpense={handleOpenAddExpense} 
                            onEditExpense={handleOpenEditExpense} 
                          />
                        } 
                      />
                      <Route path="/cards" element={<CardsPage />} />
                      <Route path="/goals" element={<GoalsPage />} />
                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route path="/ai-assistant" element={<AIAssistantPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      
                      {/* Custom 404 Route */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </AppLayout>
              </PrivateRoute>
            }
          />
        </Routes>

        {/* Global Add/Edit Expense modal */}
        <AddExpenseModal
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
          editId={editExpenseId}
        />

        {/* Cookie Consent Banner */}
        <CookieConsent />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;

