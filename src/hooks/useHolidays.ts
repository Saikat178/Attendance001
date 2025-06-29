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
      
      // Try Supabase first
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('date', { ascending: true });

      if (!error && data) {
        setHolidays(data.map(transformHoliday));
      } else {
        // Fallback to localStorage with default holidays
        const localHolidays = localStorage.getItem('holidays');
        if (localHolidays) {
          setHolidays(JSON.parse(localHolidays));
        } else {
          // Create default holidays for current year
          const defaultHolidays = createDefaultHolidays();
          setHolidays(defaultHolidays);
          localStorage.setItem('holidays', JSON.stringify(defaultHolidays));
        }
      }
    } catch (error) {
      console.error('Error loading holidays:', error);
      
      // Fallback to localStorage with default holidays
      const localHolidays = localStorage.getItem('holidays');
      if (localHolidays) {
        setHolidays(JSON.parse(localHolidays));
      } else {
        const defaultHolidays = createDefaultHolidays();
        setHolidays(defaultHolidays);
        localStorage.setItem('holidays', JSON.stringify(defaultHolidays));
      }
    } finally {
      setLoading(false);
    }
  };

  const createDefaultHolidays = (): Holiday[] => {
    const currentYear = new Date().getFullYear();
    return [
      {
        id: 'republic-day',
        name: 'Republic Day',
        date: `${currentYear}-01-26`,
        type: 'national',
        description: 'National holiday celebrating the adoption of the Constitution of India',
        isOptional: false,
        createdAt: new Date()
      },
      {
        id: 'independence-day',
        name: 'Independence Day',
        date: `${currentYear}-08-15`,
        type: 'national',
        description: 'National holiday celebrating India\'s independence from British rule',
        isOptional: false,
        createdAt: new Date()
      },
      {
        id: 'gandhi-jayanti',
        name: 'Gandhi Jayanti',
        date: `${currentYear}-10-02`,
        type: 'national',
        description: 'National holiday celebrating the birth of Mahatma Gandhi',
        isOptional: false,
        createdAt: new Date()
      },
      {
        id: 'holi',
        name: 'Holi',
        date: `${currentYear}-03-13`,
        type: 'national',
        description: 'Festival of colors',
        isOptional: false,
        createdAt: new Date()
      },
      {
        id: 'diwali',
        name: 'Diwali',
        date: `${currentYear}-11-12`,
        type: 'national',
        description: 'Festival of lights',
        isOptional: false,
        createdAt: new Date()
      },
      {
        id: 'christmas',
        name: 'Christmas',
        date: `${currentYear}-12-25`,
        type: 'national',
        description: 'Christian festival celebrating the birth of Jesus Christ',
        isOptional: false,
        createdAt: new Date()
      }
    ];
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

  const saveHoliday = async (holiday: Omit<Holiday, 'createdAt'>) => {
    try {
      // Try Supabase first
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

      if (!error) {
        await loadHolidays();
        return { success: true };
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error saving holiday:', error);
      
      // Fallback to localStorage
      const newHoliday: Holiday = {
        ...holiday,
        createdAt: new Date()
      };
      
      const existingHolidays = [...holidays];
      const existingIndex = existingHolidays.findIndex(h => h.id === holiday.id);
      
      if (existingIndex >= 0) {
        existingHolidays[existingIndex] = newHoliday;
      } else {
        existingHolidays.push(newHoliday);
      }
      
      existingHolidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setHolidays(existingHolidays);
      localStorage.setItem('holidays', JSON.stringify(existingHolidays));
      
      return { success: true };
    }
  };

  const deleteHoliday = async (holidayId: string) => {
    try {
      // Try Supabase first
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', holidayId);

      if (!error) {
        await loadHolidays();
        return { success: true };
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting holiday:', error);
      
      // Fallback to localStorage
      const updatedHolidays = holidays.filter(h => h.id !== holidayId);
      setHolidays(updatedHolidays);
      localStorage.setItem('holidays', JSON.stringify(updatedHolidays));
      
      return { success: true };
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