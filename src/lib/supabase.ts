import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced environment validation
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url' && 
  supabaseAnonKey !== 'your_supabase_anon_key';

let supabase: any;

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase is not configured. Using mock client for development.');
  
  // Mock client for development
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
        error: null
      }),
      maybeSingle: () => Promise.resolve({ 
        data: null, 
        error: null
      }),
      then: (resolve: any) => resolve({ 
        data: [], 
        error: null
      }),
      catch: (reject: any) => reject(new Error('Mock client'))
    };
    return mockBuilder;
  };

  const mockClient = {
    auth: {
      signUp: () => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: { message: 'Mock mode - please configure Supabase', code: 'MOCK_MODE' }
      }),
      signInWithPassword: () => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: { message: 'Mock mode - please configure Supabase', code: 'MOCK_MODE' }
      }),
      signOut: () => Promise.resolve({ 
        error: null
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
        error: null
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
  // Create real Supabase client
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
}

// Error handling utility
export const handleSupabaseError = (error: any) => {
  if (!error) return null;
  
  const errorMap: { [key: string]: string } = {
    'MOCK_MODE': 'Running in mock mode. Please configure Supabase credentials.',
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
    if (!isSupabaseConfigured) {
      return { 
        connected: true, // Allow mock mode to proceed
        error: null,
        mode: 'mock'
      };
    }

    // Simple connection test
    const { data, error } = await supabase
      .from('employees')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    if (error) {
      console.warn('Supabase connection test failed:', error);
      return { 
        connected: true, // Still allow app to load
        error: handleSupabaseError(error),
        mode: 'degraded'
      };
    }
    
    return { 
      connected: true, 
      error: null,
      mode: 'connected'
    };
  } catch (error) {
    console.warn('Connection check failed:', error);
    return { 
      connected: true, // Allow app to proceed anyway
      error: { message: 'Connection check failed, but app will continue' },
      mode: 'offline'
    };
  }
};

// Rate limiting helper
export const checkRateLimit = async (identifier: string, action: string) => {
  try {
    if (!isSupabaseConfigured) {
      return { is_allowed: true, attempts_remaining: 5, reset_time: null };
    }

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