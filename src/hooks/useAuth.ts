import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, handleSupabaseError, checkRateLimit } from '../lib/supabase';
import { Employee } from '../types';

export interface AuthState {
  user: User | null;
  employee: Employee | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

// Password validation utility
const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Input sanitization utility
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes to prevent injection
    .substring(0, 255); // Limit length
};

// Email validation utility
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    employee: null,
    session: null,
    loading: true,
    error: null,
  });

  // Session timeout management
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null);
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const setError = useCallback((error: string) => {
    setAuthState(prev => ({ ...prev, error }));
  }, []);

  const resetSessionTimeout = useCallback(() => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }
    
    const timeout = setTimeout(() => {
      signOut();
      setError('Session expired. Please log in again.');
    }, SESSION_TIMEOUT);
    
    setSessionTimeout(timeout);
  }, [sessionTimeout]);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          const handledError = handleSupabaseError(error);
          if (mounted) {
            setAuthState({
              user: null,
              employee: null,
              session: null,
              loading: false,
              error: handledError?.message || 'Failed to get session',
            });
          }
          return;
        }
        
        if (session?.user && mounted) {
          const employee = await fetchEmployeeProfile(session.user.id);
          setAuthState({
            user: session.user,
            employee,
            session,
            loading: false,
            error: null,
          });
          resetSessionTimeout();
        } else if (mounted) {
          setAuthState({
            user: null,
            employee: null,
            session: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (mounted) {
          setAuthState({
            user: null,
            employee: null,
            session: null,
            loading: false,
            error: 'Failed to initialize authentication',
          });
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        try {
          if (session?.user) {
            const employee = await fetchEmployeeProfile(session.user.id);
            setAuthState({
              user: session.user,
              employee,
              session,
              loading: false,
              error: null,
            });
            resetSessionTimeout();
          } else {
            setAuthState({
              user: null,
              employee: null,
              session: null,
              loading: false,
              error: null,
            });
            if (sessionTimeout) {
              clearTimeout(sessionTimeout);
              setSessionTimeout(null);
            }
          }
        } catch (error) {
          setAuthState({
            user: null,
            employee: null,
            session: null,
            loading: false,
            error: 'Authentication state change failed',
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
      }
    };
  }, [resetSessionTimeout, sessionTimeout]);

  const fetchEmployeeProfile = async (userId: string): Promise<Employee | null> => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        const handledError = handleSupabaseError(error);
        console.error('Error fetching employee profile:', handledError);
        return null;
      }

      if (data) {
        return {
          id: data.id,
          name: data.name,
          email: data.email,
          employeeId: data.employee_id,
          password: '', // Never store password in frontend
          role: data.role as 'employee' | 'admin',
          phone: data.phone,
          department: data.department,
          position: data.position,
          dateOfBirth: data.date_of_birth,
          gender: data.gender,
          joiningDate: data.joining_date,
          salary: data.salary,
          isVerified: data.is_verified,
          createdAt: new Date(data.created_at),
          // Address information
          address: data.address_street ? {
            street: data.address_street,
            city: data.address_city,
            state: data.address_state,
            pincode: data.address_pincode,
            country: data.address_country
          } : undefined,
          // Emergency contact
          emergencyContact: data.emergency_contact_name ? {
            name: data.emergency_contact_name,
            relationship: data.emergency_contact_relationship,
            phone: data.emergency_contact_phone
          } : undefined,
          // Bank details
          bankDetails: data.bank_account_number ? {
            accountNumber: data.bank_account_number,
            ifscCode: data.bank_ifsc_code,
            bankName: data.bank_name,
            accountHolderName: data.bank_account_holder_name
          } : undefined,
          // Verification status
          verificationStatus: {
            documents: data.verification_documents_status,
            profile: data.verification_profile_status
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching employee profile:', error);
      return null;
    }
  };

  const findEmployeeByIdentifier = async (identifier: string): Promise<{ email: string; employeeId: string } | null> => {
    try {
      const sanitizedIdentifier = sanitizeInput(identifier);
      
      // Check if identifier is an email
      const isEmail = validateEmail(sanitizedIdentifier);
      
      let query = supabase.from('employees').select('email, employee_id');
      
      if (isEmail) {
        query = query.eq('email', sanitizedIdentifier);
      } else {
        query = query.eq('employee_id', sanitizedIdentifier);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error) {
        const handledError = handleSupabaseError(error);
        console.error('Error finding employee:', handledError);
        return null;
      }
      
      return data ? {
        email: data.email,
        employeeId: data.employee_id
      } : null;
    } catch (error) {
      console.error('Error finding employee:', error);
      return null;
    }
  };

  const signUp = async (email: string, password: string, userData: {
    name: string;
    employeeId: string;
    role?: 'employee' | 'admin';
    phone?: string;
    department?: string;
    position?: string;
  }) => {
    try {
      clearError();
      setAuthState(prev => ({ ...prev, loading: true }));

      // Validate inputs
      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      const sanitizedName = sanitizeInput(userData.name);
      const sanitizedEmployeeId = sanitizeInput(userData.employeeId);

      if (!validateEmail(sanitizedEmail)) {
        throw new Error('Invalid email format');
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join('. '));
      }

      if (sanitizedName.length < 2) {
        throw new Error('Name must be at least 2 characters long');
      }

      if (sanitizedEmployeeId.length < 3) {
        throw new Error('Employee ID must be at least 3 characters long');
      }

      // Check rate limiting
      const rateLimitCheck = await checkRateLimit(sanitizedEmail, 'signup');
      if (!rateLimitCheck.is_allowed) {
        throw new Error('Too many signup attempts. Please try again later.');
      }

      // Check if employee ID already exists
      const { data: existingEmployee } = await supabase
        .from('employees')
        .select('employee_id')
        .eq('employee_id', sanitizedEmployeeId)
        .maybeSingle();

      if (existingEmployee) {
        throw new Error('Employee ID already exists');
      }

      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: {
            name: sanitizedName,
            employee_id: sanitizedEmployeeId
          }
        }
      });

      if (error) {
        const handledError = handleSupabaseError(error);
        throw new Error(handledError?.message || 'Registration failed');
      }

      if (data.user) {
        // Create employee profile in database
        const { error: profileError } = await supabase
          .from('employees')
          .insert({
            id: data.user.id,
            employee_id: sanitizedEmployeeId,
            name: sanitizedName,
            email: sanitizedEmail,
            role: userData.role || 'employee',
            phone: userData.phone ? sanitizeInput(userData.phone) : null,
            department: userData.department ? sanitizeInput(userData.department) : null,
            position: userData.position ? sanitizeInput(userData.position) : null,
          });

        if (profileError) {
          const handledError = handleSupabaseError(profileError);
          console.error('Error creating employee profile:', handledError);
          throw new Error(handledError?.message || 'Failed to create employee profile');
        }
      }

      setAuthState(prev => ({ ...prev, loading: false }));
      return { data, error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Registration failed' 
      }));
      return { data: null, error: { message: error.message } };
    }
  };

  const signIn = async (identifier: string, password: string) => {
    try {
      clearError();
      setAuthState(prev => ({ ...prev, loading: true }));

      const sanitizedIdentifier = sanitizeInput(identifier.toLowerCase());

      if (!sanitizedIdentifier || !password) {
        throw new Error('Email/Employee ID and password are required');
      }

      // Check rate limiting
      const rateLimitCheck = await checkRateLimit(sanitizedIdentifier, 'login');
      if (!rateLimitCheck.is_allowed) {
        throw new Error(`Too many login attempts. Please try again after ${new Date(rateLimitCheck.reset_time).toLocaleTimeString()}.`);
      }

      // Find the employee's email if identifier is employee ID
      const employeeData = await findEmployeeByIdentifier(sanitizedIdentifier);
      
      if (!employeeData) {
        throw new Error('Employee not found. Please check your credentials.');
      }

      // Use the email for authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: employeeData.email,
        password,
      });

      if (error) {
        const handledError = handleSupabaseError(error);
        throw new Error(handledError?.message || 'Login failed');
      }

      setAuthState(prev => ({ ...prev, loading: false }));
      return { data, error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Login failed' 
      }));
      return { data: null, error: { message: error.message } };
    }
  };

  const signOut = async () => {
    try {
      clearError();
      
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
        setSessionTimeout(null);
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        const handledError = handleSupabaseError(error);
        throw new Error(handledError?.message || 'Sign out failed');
      }
      
      setAuthState({
        user: null,
        employee: null,
        session: null,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      setError(error.message || 'Sign out failed');
    }
  };

  const updateProfile = async (updates: Partial<Employee>) => {
    if (!authState.user) return { error: 'No user logged in' };

    try {
      clearError();
      setAuthState(prev => ({ ...prev, loading: true }));

      const updateData: any = {};
      
      // Sanitize and validate inputs
      if (updates.name) {
        const sanitizedName = sanitizeInput(updates.name);
        if (sanitizedName.length < 2) {
          throw new Error('Name must be at least 2 characters long');
        }
        updateData.name = sanitizedName;
      }
      
      if (updates.phone) {
        const sanitizedPhone = sanitizeInput(updates.phone);
        if (!/^\+?[1-9]\d{1,14}$/.test(sanitizedPhone)) {
          throw new Error('Invalid phone number format');
        }
        updateData.phone = sanitizedPhone;
      }
      
      if (updates.department) {
        updateData.department = sanitizeInput(updates.department);
      }
      
      if (updates.position) {
        updateData.position = sanitizeInput(updates.position);
      }
      
      if (updates.dateOfBirth) updateData.date_of_birth = updates.dateOfBirth;
      if (updates.gender) updateData.gender = updates.gender;
      if (updates.joiningDate) updateData.joining_date = updates.joiningDate;
      if (updates.salary && updates.salary > 0) updateData.salary = updates.salary;
      
      // Handle address updates
      if (updates.address) {
        updateData.address_street = sanitizeInput(updates.address.street);
        updateData.address_city = sanitizeInput(updates.address.city);
        updateData.address_state = sanitizeInput(updates.address.state);
        updateData.address_pincode = sanitizeInput(updates.address.pincode);
        updateData.address_country = sanitizeInput(updates.address.country);
      }
      
      // Handle emergency contact updates
      if (updates.emergencyContact) {
        updateData.emergency_contact_name = sanitizeInput(updates.emergencyContact.name);
        updateData.emergency_contact_relationship = sanitizeInput(updates.emergencyContact.relationship);
        updateData.emergency_contact_phone = sanitizeInput(updates.emergencyContact.phone);
      }
      
      // Handle bank details updates
      if (updates.bankDetails) {
        updateData.bank_account_number = sanitizeInput(updates.bankDetails.accountNumber);
        updateData.bank_ifsc_code = sanitizeInput(updates.bankDetails.ifscCode);
        updateData.bank_name = sanitizeInput(updates.bankDetails.bankName);
        updateData.bank_account_holder_name = sanitizeInput(updates.bankDetails.accountHolderName);
      }

      const { error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', authState.user.id);

      if (error) {
        const handledError = handleSupabaseError(error);
        throw new Error(handledError?.message || 'Profile update failed');
      }

      // Refresh employee data
      const updatedEmployee = await fetchEmployeeProfile(authState.user.id);
      setAuthState(prev => ({
        ...prev,
        employee: updatedEmployee,
        loading: false,
      }));

      resetSessionTimeout();
      return { error: null };
    } catch (error: any) {
      console.error('Update profile error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Profile update failed' 
      }));
      return { error: { message: error.message } };
    }
  };

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        const handledError = handleSupabaseError(error);
        throw new Error(handledError?.message || 'Session refresh failed');
      }
      resetSessionTimeout();
      return { data, error: null };
    } catch (error: any) {
      console.error('Session refresh error:', error);
      return { data: null, error: { message: error.message } };
    }
  }, [resetSessionTimeout]);

  // Activity tracking for session management
  useEffect(() => {
    const trackActivity = () => {
      if (authState.user) {
        resetSessionTimeout();
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, trackActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity, true);
      });
    };
  }, [authState.user, resetSessionTimeout]);

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshSession,
    clearError,
  };
};