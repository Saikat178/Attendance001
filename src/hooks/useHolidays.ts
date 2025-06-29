import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Holiday } from '../types';

export const useHolidays = (isAdmin: boolean = false) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHolidays();
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('holidays_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'holidays'
        }, 
        () => {
          loadHolidays();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadHolidays = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      if (data) {
        setHolidays(data.map(transformHoliday));
      }
    } catch (error) {
      console.error('Error loading holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformHoliday = (data: any): Holiday => ({
    id: data.id,
    name: data.name,
    date: data.date,
    type: data.type,
    description: data.description,
    isOptional: data.is_optional,
    createdBy: data.created_by,
    createdAt: data.created_at ? new Date(data.created_at) : undefined
  });

  const saveHoliday = async (holiday: Omit<Holiday, 'id' | 'createdAt'>) => {
    try {
      const { error } = await supabase
        .from('holidays')
        .upsert({
          id: holiday.id,
          name: holiday.name,
          date: holiday.date,
          type: holiday.type,
          description: holiday.description,
          is_optional: holiday.isOptional,
          created_by: holiday.createdBy
        });

      if (error) throw error;

      await loadHolidays();
      return { success: true };
    } catch (error) {
      console.error('Error saving holiday:', error);
      return { success: false, error };
    }
  };

  const deleteHoliday = async (holidayId: string) => {
    try {
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', holidayId);

      if (error) throw error;

      await loadHolidays();
      return { success: true };
    } catch (error) {
      console.error('Error deleting holiday:', error);
      return { success: false, error };
    }
  };

  const getHolidayByDate = (date: string): Holiday | null => {
    return holidays.find(h => h.date === date) || null;
  };

  const getHolidaysByYear = (year: number): Holiday[] => {
    return holidays.filter(h => h.date.startsWith(year.toString()));
  };

  return {
    holidays,
    loading,
    saveHoliday,
    deleteHoliday,
    getHolidayByDate,
    getHolidaysByYear,
    refreshData: loadHolidays
  };
};