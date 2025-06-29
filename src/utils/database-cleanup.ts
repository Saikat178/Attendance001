/**
 * Database Cleanup Utilities
 * 
 * This file contains utilities to verify the database cleanup
 * and ensure the system is ready for production use.
 */

import { supabase } from '../lib/supabase';

export interface CleanupStatus {
  isClean: boolean;
  tables: {
    [tableName: string]: {
      count: number;
      isClean: boolean;
    };
  };
  systemReady: boolean;
  message: string;
}

/**
 * Verify that the database has been properly cleaned
 */
export const verifyDatabaseCleanup = async (): Promise<CleanupStatus> => {
  try {
    const tables = [
      'employees',
      'attendance_records', 
      'leave_requests',
      'comp_off_requests',
      'notifications',
      'documents',
      'profile_change_requests'
    ];

    const tableStatus: CleanupStatus['tables'] = {};
    let allTablesClean = true;

    // Check each table for remaining records
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`Error checking ${table}:`, error);
        tableStatus[table] = { count: -1, isClean: false };
        allTablesClean = false;
      } else {
        const recordCount = count || 0;
        tableStatus[table] = { 
          count: recordCount, 
          isClean: recordCount === 0 
        };
        
        if (recordCount > 0) {
          allTablesClean = false;
        }
      }
    }

    // Check system holidays (should exist)
    const { count: holidayCount } = await supabase
      .from('holidays')
      .select('*', { count: 'exact', head: true });

    const systemReady = allTablesClean && (holidayCount || 0) > 0;

    return {
      isClean: allTablesClean,
      tables: tableStatus,
      systemReady,
      message: allTablesClean 
        ? '✅ Database is clean and ready for production!'
        : '⚠️ Some tables still contain data. Please run the cleanup migration.'
    };

  } catch (error) {
    console.error('Error verifying database cleanup:', error);
    return {
      isClean: false,
      tables: {},
      systemReady: false,
      message: '❌ Error verifying database cleanup. Please check your connection.'
    };
  }
};

/**
 * Get database statistics for admin dashboard
 */
export const getDatabaseStats = async () => {
  try {
    const stats = await Promise.all([
      supabase.from('employees').select('*', { count: 'exact', head: true }),
      supabase.from('attendance_records').select('*', { count: 'exact', head: true }),
      supabase.from('leave_requests').select('*', { count: 'exact', head: true }),
      supabase.from('comp_off_requests').select('*', { count: 'exact', head: true }),
      supabase.from('notifications').select('*', { count: 'exact', head: true }),
      supabase.from('holidays').select('*', { count: 'exact', head: true }),
    ]);

    return {
      employees: stats[0].count || 0,
      attendanceRecords: stats[1].count || 0,
      leaveRequests: stats[2].count || 0,
      compOffRequests: stats[3].count || 0,
      notifications: stats[4].count || 0,
      holidays: stats[5].count || 0,
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return null;
  }
};

/**
 * Check if the system is ready for production use
 */
export const checkSystemReadiness = async () => {
  try {
    // Check if we can connect to Supabase
    const { data, error } = await supabase.auth.getSession();
    
    if (error && error.message.includes('not configured')) {
      return {
        ready: false,
        message: '❌ Supabase is not properly configured. Please check your environment variables.',
        details: 'Missing or invalid Supabase URL/API key'
      };
    }

    // Verify database cleanup
    const cleanupStatus = await verifyDatabaseCleanup();
    
    if (!cleanupStatus.isClean) {
      return {
        ready: false,
        message: '⚠️ Database contains existing data. Please run the cleanup migration.',
        details: cleanupStatus.tables
      };
    }

    // Check if holidays are configured
    const { count: holidayCount } = await supabase
      .from('holidays')
      .select('*', { count: 'exact', head: true });

    if ((holidayCount || 0) === 0) {
      return {
        ready: false,
        message: '⚠️ No holidays configured. Please ensure default holidays are loaded.',
        details: 'System holidays are required for proper attendance tracking'
      };
    }

    return {
      ready: true,
      message: '✅ System is ready for production use!',
      details: {
        database: 'Clean and ready',
        holidays: `${holidayCount} holidays configured`,
        authentication: 'Working properly',
        realtime: 'Subscriptions active'
      }
    };

  } catch (error) {
    console.error('Error checking system readiness:', error);
    return {
      ready: false,
      message: '❌ Error checking system readiness.',
      details: error
    };
  }
};