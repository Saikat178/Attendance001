import React, { useState, useEffect, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { Employee } from './types';
import { supabase } from './lib/supabase';

// Lazy load components for better performance
const LandingPage = React.lazy(() => import('./components/LandingPage'));
const LoginPage = React.lazy(() => import('./components/LoginPage'));
const SignupPage = React.lazy(() => import('./components/SignupPage'));
const AdminSignupPage = React.lazy(() => import('./components/AdminSignupPage'));
const EmployeeDashboard = React.lazy(() => import('./components/EmployeeDashboard'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));

type Page = 'landing' | 'login' | 'signup' | 'admin-signup' | 'employee-dashboard' | 'admin-dashboard';

// Generate proper UUID
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Mock data for demo purposes with proper UUIDs
const mockEmployees: Employee[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'John Doe',
    email: 'john@company.com',
    employeeId: 'EMP001',
    password: 'password123',
    role: 'employee',
    department: 'Engineering',
    position: 'Software Developer',
    createdAt: new Date(),
    isVerified: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Admin User',
    email: 'admin@company.com',
    employeeId: 'ADMIN001',
    password: 'admin123',
    role: 'admin',
    department: 'Management',
    position: 'System Administrator',
    createdAt: new Date(),
    isVerified: true
  }
];

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize the app
    const initializeApp = async () => {
      try {
        setLoading(true);
        
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Get employee data from database
          const { data: employee, error } = await supabase
            .from('employees')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (employee && !error) {
            const user: Employee = {
              id: employee.id,
              name: employee.name,
              email: employee.email,
              employeeId: employee.employee_id,
              password: '', // Don't store password in state
              role: employee.role,
              department: employee.department,
              position: employee.position,
              phone: employee.phone,
              createdAt: new Date(employee.created_at),
              isVerified: employee.is_verified
            };
            
            setCurrentUser(user);
            setCurrentPage(user.role === 'admin' ? 'admin-dashboard' : 'employee-dashboard');
          }
        } else {
          // Check localStorage for demo mode
          const savedUser = localStorage.getItem('currentUser');
          if (savedUser) {
            const user = JSON.parse(savedUser);
            setCurrentUser(user);
            setCurrentPage(user.role === 'admin' ? 'admin-dashboard' : 'employee-dashboard');
          }
        }
        
        setIsInitialized(true);
      } catch (err) {
        console.error('App initialization error:', err);
        setError('Failed to initialize app');
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    // Auto-transition from landing page
    if (currentPage === 'landing' && isInitialized && !currentUser) {
      const timer = setTimeout(() => {
        setCurrentPage('login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentPage, isInitialized, currentUser]);

  const clearError = () => {
    setError('');
  };

  const handleLandingTransition = () => {
    setCurrentPage('login');
  };

  const handleLogin = async (identifier: string, password: string, role: 'employee' | 'admin') => {
    try {
      setLoading(true);
      setError('');

      // Try Supabase authentication first
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: identifier,
        password: password,
      });

      if (data.user && !authError) {
        // Get employee data from database
        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();
          
        if (employee && !employeeError && employee.role === role) {
          const user: Employee = {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            employeeId: employee.employee_id,
            password: '', // Don't store password in state
            role: employee.role,
            department: employee.department,
            position: employee.position,
            phone: employee.phone,
            createdAt: new Date(employee.created_at),
            isVerified: employee.is_verified
          };
          
          setCurrentUser(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
          setCurrentPage(user.role === 'admin' ? 'admin-dashboard' : 'employee-dashboard');
          return;
        }
      }

      // Fallback to mock data for demo
      const user = mockEmployees.find(emp => 
        (emp.email === identifier || emp.employeeId === identifier) && 
        emp.password === password &&
        emp.role === role
      );

      if (!user) {
        throw new Error('Invalid credentials or incorrect role selection');
      }

      // Save user session for demo mode
      localStorage.setItem('currentUser', JSON.stringify(user));
      setCurrentUser(user);
      setCurrentPage(user.role === 'admin' ? 'admin-dashboard' : 'employee-dashboard');
      
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    setCurrentPage('signup');
  };

  const handleAdminSignup = () => {
    setCurrentPage('admin-signup');
  };

  const handleSignupComplete = async (userData: {
    name: string;
    email: string;
    employeeId: string;
    password: string;
    role?: 'employee' | 'admin';
    phone?: string;
    department?: string;
    position?: string;
  }) => {
    try {
      setLoading(true);
      setError('');

      // Check if employee ID already exists in Supabase
      const { data: existingEmployee, error: checkError } = await supabase
        .from('employees')
        .select('employee_id')
        .eq('employee_id', userData.employeeId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is what we want
        throw new Error('Failed to check employee ID availability');
      }

      if (existingEmployee) {
        throw new Error('Employee ID is already taken. Please choose a different one.');
      }

      // Check if email already exists in Supabase
      const { data: existingEmail, error: emailCheckError } = await supabase
        .from('employees')
        .select('email')
        .eq('email', userData.email)
        .maybeSingle();

      if (emailCheckError && emailCheckError.code !== 'PGRST116') {
        throw new Error('Failed to check email availability');
      }

      if (existingEmail) {
        throw new Error('Email is already registered. Please use a different email.');
      }

      // Try to create user in Supabase
      const { data, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            role: userData.role || 'employee'
          }
        }
      });

      if (data.user && !authError) {
        // Create employee record
        const { error: employeeError } = await supabase
          .from('employees')
          .insert({
            id: data.user.id,
            name: userData.name,
            email: userData.email,
            employee_id: userData.employeeId,
            role: userData.role || 'employee',
            phone: userData.phone,
            department: userData.department,
            position: userData.position,
            is_verified: true
          });

        if (!employeeError) {
          setCurrentPage('login');
          setError('Registration successful! Please login with your credentials.');
          return;
        } else {
          // If employee creation fails, clean up the auth user
          await supabase.auth.admin.deleteUser(data.user.id);
          throw new Error('Failed to create employee record. Please try again.');
        }
      }

      // Fallback to mock data for demo
      const existingUser = mockEmployees.find(emp => 
        emp.email === userData.email || emp.employeeId === userData.employeeId
      );

      if (existingUser) {
        if (existingUser.employeeId === userData.employeeId) {
          throw new Error('Employee ID is already taken. Please choose a different one.');
        }
        if (existingUser.email === userData.email) {
          throw new Error('Email is already registered. Please use a different email.');
        }
      }

      // Create new user with proper UUID
      const newUser: Employee = {
        id: generateUUID(),
        name: userData.name,
        email: userData.email,
        employeeId: userData.employeeId,
        password: userData.password,
        role: userData.role || 'employee',
        department: userData.department,
        position: userData.position,
        phone: userData.phone,
        createdAt: new Date(),
        isVerified: true
      };

      // Add to mock data
      mockEmployees.push(newUser);
      
      // Save to localStorage for persistence
      localStorage.setItem('mockEmployees', JSON.stringify(mockEmployees));
      
      setCurrentPage('login');
      setError('Registration successful! Please login with your credentials.');
      
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setCurrentPage('login');
  };

  const handleLogout = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear local storage
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setCurrentPage('login');
  };

  // Show loading spinner during initialization
  if (!isInitialized || loading) {
    return (
      <LoadingSpinner 
        size="xl" 
        text="Loading application..." 
        fullScreen 
      />
    );
  }

  const renderCurrentPage = () => {
    const pageProps = {
      onLogin: handleLogin,
      onSignup: handleSignup,
      onAdminSignup: handleAdminSignup,
      onSignupComplete: handleSignupComplete,
      onBackToLogin: handleBackToLogin,
      onLogout: handleLogout,
      onTransition: handleLandingTransition,
    };

    switch (currentPage) {
      case 'landing':
        return (
          <Suspense fallback={<LoadingSpinner size="xl" text="Loading..." fullScreen />}>
            <LandingPage onTransition={pageProps.onTransition} />
          </Suspense>
        );
      case 'login':
        return (
          <Suspense fallback={<LoadingSpinner size="xl" text="Loading..." fullScreen />}>
            <LoginPage 
              onLogin={pageProps.onLogin} 
              onSignup={pageProps.onSignup} 
              onAdminSignup={pageProps.onAdminSignup} 
            />
          </Suspense>
        );
      case 'signup':
        return (
          <Suspense fallback={<LoadingSpinner size="xl" text="Loading..." fullScreen />}>
            <SignupPage 
              onSignupComplete={pageProps.onSignupComplete} 
              onBackToLogin={pageProps.onBackToLogin} 
            />
          </Suspense>
        );
      case 'admin-signup':
        return (
          <Suspense fallback={<LoadingSpinner size="xl" text="Loading..." fullScreen />}>
            <AdminSignupPage 
              onSignupComplete={pageProps.onSignupComplete} 
              onBackToLogin={pageProps.onBackToLogin} 
            />
          </Suspense>
        );
      case 'employee-dashboard':
        return currentUser ? (
          <Suspense fallback={<LoadingSpinner size="xl" text="Loading dashboard..." fullScreen />}>
            <EmployeeDashboard user={currentUser} onLogout={pageProps.onLogout} />
          </Suspense>
        ) : null;
      case 'admin-dashboard':
        return currentUser ? (
          <Suspense fallback={<LoadingSpinner size="xl" text="Loading dashboard..." fullScreen />}>
            <AdminDashboard user={currentUser} onLogout={pageProps.onLogout} />
          </Suspense>
        ) : null;
      default:
        return (
          <Suspense fallback={<LoadingSpinner size="xl" text="Loading..." fullScreen />}>
            <LandingPage onTransition={pageProps.onTransition} />
          </Suspense>
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="App">
        {/* Demo Mode Indicator */}
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 text-sm z-50">
          🚀 Demo Mode - Use: john@company.com / password123 (Employee) or admin@company.com / admin123 (Admin)
        </div>
        
        {error && (
          <div className="fixed top-16 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm">{error}</span>
              <button
                onClick={clearError}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        <div className="pt-12">
          {renderCurrentPage()}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;