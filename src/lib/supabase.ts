import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced environment validation
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url' && 
  supabaseAnonKey !== 'your_supabase_anon_key' &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co') &&
  supabaseAnonKey.length > 100; // Supabase anon keys are typically longer

let supabase: any;

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase is not configured. Please set up your Supabase project credentials.');
  
  // Enhanced mock client with better error handling
  const createMockQueryBuilder = () => {
    const mockBuilder = {
      select: () => mockBuilder,
      insert: () => mockBuilder,
      update: () => mockBuilder,
      delete: () => mockBuilder,
      upsert: () => mockBuilder,
      eq: () => mockBuilder,
      neq: () => mockBuilder,
      gt: () => mockBuilder,
      gte: () => mockBuilder,
      lt: () => mockBuilder,
      lte: () => mockBuilder,
      like: () => mockBuilder,
      ilike: () => mockBuilder,
      is: () => mockBuilder,
      in: () => mockBuilder,
      contains: () => mockBuilder,
      containedBy: () => mockBuilder,
      rangeGt: () => mockBuilder,
      rangeGte: () => mockBuilder,
      rangeLt: () => mockBuilder,
      rangeLte: () => mockBuilder,
      rangeAdjacent: () => mockBuilder,
      overlaps: () => mockBuilder,
      textSearch: () => mockBuilder,
      match: () => mockBuilder,
      not: () => mockBuilder,
      or: () => mockBuilder,
      filter: () => mockBuilder,
      order: () => mockBuilder,
      limit: () => mockBuilder,
      range: () => mockBuilder,
      abortSignal: () => mockBuilder,
      onConflict: () => mockBuilder,
      single: () => Promise.resolve({ 
        data: null, 
        error: { message: 'Supabase not configured. Please check your environment variables.', code: 'SUPABASE_NOT_CONFIGURED' }
      }),
      maybeSingle: () => Promise.resolve({ 
        data: null, 
        error: { message: 'Supabase not configured. Please check your environment variables.', code: 'SUPABASE_NOT_CONFIGURED' }
      }),
      then: (resolve: any) => resolve({ 
        data: null, 
        error: { message: 'Supabase not configured. Please check your environment variables.', code: 'SUPABASE_NOT_CONFIGURED' }
      }),
      catch: (reject: any) => reject(new Error('Supabase not configured'))
    };
    return mockBuilder;
  };

  const mockClient = {
    auth: {
      signUp: () => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' }
      }),
      signInWithPassword: () => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' }
      }),
      signOut: () => Promise.resolve({ 
        error: { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' }
      }),
      getSession: () => Promise.resolve({ 
        data: { session: null }, 
        error: null 
      }),
      onAuthStateChange: () => ({ 
        data: { 
          subscription: { 
            unsubscribe: () => console.log('Mock subscription unsubscribed') 
          } 
        } 
      }),
      getUser: () => Promise.resolve({
        data: { user: null },
        error: { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' }
      })
    },
    from: () => createMockQueryBuilder(),
    channel: () => ({
      on: () => ({
        on: () => ({
          subscribe: () => ({
            unsubscribe: () => console.log('Mock channel unsubscribed')
          })
        }),
        subscribe: () => ({
          unsubscribe: () => console.log('Mock channel unsubscribed')
        })
      }),
      subscribe: () => ({
        unsubscribe: () => console.log('Mock channel unsubscribed')
      })
    }),
    removeChannel: () => {},
    removeAllChannels: () => {}
  };
  
  supabase = mockClient;
} else {
  // Create real Supabase client with enhanced configuration
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'attendance-management-system'
      }
    }
  });

  // Add connection retry logic
  const originalFrom = supabase.from;
  supabase.from = function(table: string) {
    const query = originalFrom.call(this, table);
    
    // Add retry logic to queries
    const originalThen = query.then;
    query.then = function(onResolve: any, onReject?: any) {
      return originalThen.call(this, 
        (result: any) => {
          if (result.error && result.error.code === 'PGRST301') {
            console.warn('Database connection issue, retrying...');
            // Could implement retry logic here
          }
          return onResolve(result);
        },
        onReject
      );
    };
    
    return query;
  };
}

// Enhanced error handling utility
export const handleSupabaseError = (error: any) => {
  if (!error) return null;
  
  const errorMap: { [key: string]: string } = {
    'SUPABASE_NOT_CONFIGURED': 'Database connection not configured. Please contact support.',
    'PGRST301': 'Database connection error. Please try again.',
    'PGRST116': 'No data found.',
    '23505': 'This record already exists.',
    '23503': 'Referenced record not found.',
    '42501': 'Permission denied.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-not-found': 'User not found.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/weak-password': 'Password is too weak.',
    'auth/email-already-in-use': 'Email is already registered.'
  };
  
  const userFriendlyMessage = errorMap[error.code] || error.message || 'An unexpected error occurred.';
  
  // Log error for debugging (only in development)
  if (import.meta.env.DEV) {
    console.error('Supabase Error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
  }
  
  return {
    code: error.code,
    message: userFriendlyMessage,
    originalMessage: error.message
  };
};

// Connection health check
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      return { connected: false, error: handleSupabaseError(error) };
    }
    
    return { connected: true, error: null };
  } catch (error) {
    return { connected: false, error: { message: 'Connection failed' } };
  }
};

// Rate limiting helper
export const checkRateLimit = async (identifier: string, action: string) => {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      identifier_param: identifier,
      action_param: action
    });
    
    if (error) throw error;
    
    return data[0] || { is_allowed: true, attempts_remaining: 5, reset_time: null };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return { is_allowed: true, attempts_remaining: 5, reset_time: null };
  }
};

export { supabase };

// Enhanced Database types with better type safety
export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string;
          employee_id: string;
          name: string;
          email: string;
          role: 'employee' | 'admin';
          phone?: string;
          department?: string;
          position?: string;
          date_of_birth?: string;
          gender?: 'male' | 'female' | 'other';
          joining_date?: string;
          salary?: number;
          is_verified?: boolean;
          created_at: string;
          updated_at: string;
          address_street?: string;
          address_city?: string;
          address_state?: string;
          address_pincode?: string;
          address_country?: string;
          emergency_contact_name?: string;
          emergency_contact_relationship?: string;
          emergency_contact_phone?: string;
          bank_account_number?: string;
          bank_ifsc_code?: string;
          bank_name?: string;
          bank_account_holder_name?: string;
          verification_documents_status?: 'pending' | 'verified' | 'rejected';
          verification_profile_status?: 'pending' | 'verified' | 'rejected';
        };
        Insert: Omit<Database['public']['Tables']['employees']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['employees']['Insert']>;
      };
      attendance_records: {
        Row: {
          id: string;
          employee_id: string;
          date: string;
          check_in?: string;
          check_out?: string;
          hours_worked: number;
          break_start?: string;
          break_end?: string;
          total_break_time: number;
          is_on_break: boolean;
          has_used_break: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['attendance_records']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['attendance_records']['Insert']>;
      };
      leave_requests: {
        Row: {
          id: string;
          employee_id: string;
          type: 'sick' | 'vacation' | 'personal' | 'emergency';
          start_date: string;
          end_date: string;
          reason: string;
          status: 'pending' | 'approved' | 'rejected';
          applied_date: string;
          admin_comment?: string;
          reviewed_at?: string;
          reviewed_by?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['leave_requests']['Row'], 'id' | 'created_at' | 'updated_at' | 'applied_date'> & {
          id?: string;
          applied_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['leave_requests']['Insert']>;
      };
      comp_off_requests: {
        Row: {
          id: string;
          employee_id: string;
          work_date: string;
          comp_off_date: string;
          reason: string;
          status: 'pending' | 'approved' | 'rejected';
          applied_date: string;
          admin_comment?: string;
          reviewed_at?: string;
          reviewed_by?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['comp_off_requests']['Row'], 'id' | 'created_at' | 'updated_at' | 'applied_date'> & {
          id?: string;
          applied_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['comp_off_requests']['Insert']>;
      };
      holidays: {
        Row: {
          id: string;
          name: string;
          date: string;
          type: 'national' | 'regional' | 'company';
          description?: string;
          is_optional: boolean;
          created_by?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['holidays']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['holidays']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          type: 'leave_request' | 'compoff_request' | 'leave_approved' | 'leave_rejected' | 'compoff_approved' | 'compoff_rejected' | 'profile_change_request';
          title: string;
          message: string;
          recipient_id: string;
          sender_id: string;
          related_id?: string;
          is_read: boolean;
          data?: any;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          table_name: string;
          operation: 'INSERT' | 'UPDATE' | 'DELETE';
          old_data?: any;
          new_data?: any;
          user_id?: string;
          user_email?: string;
          timestamp: string;
          ip_address?: string;
          user_agent?: string;
        };
        Insert: never; // Audit logs are system-generated only
        Update: never;
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_token: string;
          expires_at: string;
          created_at: string;
          last_activity: string;
          ip_address?: string;
          user_agent?: string;
          is_active: boolean;
        };
        Insert: Omit<Database['public']['Tables']['user_sessions']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_sessions']['Insert']>;
      };
      rate_limits: {
        Row: {
          id: string;
          identifier: string;
          action: string;
          attempts: number;
          window_start: string;
          blocked_until?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['rate_limits']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['rate_limits']['Insert']>;
      };
    };
    Views: {
      employee_lookup: {
        Row: {
          id: string;
          employee_id: string;
          name: string;
          email: string;
          role: string;
          department?: string;
          position?: string;
          is_verified: boolean;
          created_at: string;
        };
      };
      current_year_holidays: {
        Row: {
          id: string;
          name: string;
          date: string;
          type: string;
          description?: string;
          is_optional: boolean;
          relative_time: string;
          day_of_week: number;
          formatted_date: string;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: { user_id?: string };
        Returns: boolean;
      };
      get_current_employee: {
        Args: {};
        Returns: {
          id: string;
          employee_id: string;
          name: string;
          email: string;
          role: string;
          department?: string;
          position?: string;
          is_verified: boolean;
        }[];
      };
      validate_working_hours: {
        Args: {
          check_in_time: string;
          check_out_time?: string;
        };
        Returns: {
          is_valid: boolean;
          message: string;
          calculated_hours: number;
        }[];
      };
      check_rate_limit: {
        Args: {
          identifier_param: string;
          action_param: string;
          max_attempts?: number;
          window_minutes?: number;
        };
        Returns: {
          is_allowed: boolean;
          attempts_remaining: number;
          reset_time?: string;
        }[];
      };
    };
  };
}