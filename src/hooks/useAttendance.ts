import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AttendanceRecord } from '../types';

export const useAttendance = (employeeId: string) => {
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      loadAttendanceData();
      
      // Subscribe to real-time changes
      const subscription = supabase
        .channel('attendance_changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'attendance_records',
            filter: `employee_id=eq.${employeeId}`
          }, 
          () => {
            loadAttendanceData();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [employeeId]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      
      // Try Supabase first
      const { data: todayData, error: todayError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .maybeSingle();

      if (!todayError && todayData) {
        setTodayAttendance(transformAttendanceRecord(todayData));
      } else {
        // Fallback to localStorage
        const localAttendance = localStorage.getItem(`attendance_${employeeId}_${today}`);
        if (localAttendance) {
          setTodayAttendance(JSON.parse(localAttendance));
        } else {
          setTodayAttendance(null);
        }
      }

      // Get attendance history
      const { data: historyData, error: historyError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employeeId)
        .order('date', { ascending: false })
        .limit(30);

      if (!historyError && historyData) {
        setAttendanceHistory(historyData.map(transformAttendanceRecord));
      } else {
        // Fallback to localStorage
        const localHistory = localStorage.getItem(`attendance_history_${employeeId}`);
        if (localHistory) {
          setAttendanceHistory(JSON.parse(localHistory));
        } else {
          setAttendanceHistory([]);
        }
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
      
      // Always fallback to localStorage
      const today = new Date().toISOString().split('T')[0];
      const localAttendance = localStorage.getItem(`attendance_${employeeId}_${today}`);
      const localHistory = localStorage.getItem(`attendance_history_${employeeId}`);
      
      if (localAttendance) {
        setTodayAttendance(JSON.parse(localAttendance));
      }
      if (localHistory) {
        setAttendanceHistory(JSON.parse(localHistory));
      }
    } finally {
      setLoading(false);
    }
  };

  const transformAttendanceRecord = (data: any): AttendanceRecord => ({
    id: data.id,
    employeeId: data.employee_id,
    date: data.date,
    checkIn: data.check_in ? new Date(data.check_in) : undefined,
    checkOut: data.check_out ? new Date(data.check_out) : undefined,
    hoursWorked: data.hours_worked || 0,
    breakStart: data.break_start ? new Date(data.break_start) : undefined,
    breakEnd: data.break_end ? new Date(data.break_end) : undefined,
    totalBreakTime: data.total_break_time || 0,
    isOnBreak: data.is_on_break || false,
    hasUsedBreak: data.has_used_break || false,
  });

  const saveAttendance = async (record: Partial<AttendanceRecord>) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const attendanceData = {
        employee_id: employeeId,
        date: record.date || today,
        check_in: record.checkIn?.toISOString(),
        check_out: record.checkOut?.toISOString(),
        hours_worked: record.hoursWorked || 0,
        break_start: record.breakStart?.toISOString(),
        break_end: record.breakEnd?.toISOString(),
        total_break_time: record.totalBreakTime || 0,
        is_on_break: record.isOnBreak || false,
        has_used_break: record.hasUsedBreak || false,
      };

      // Try Supabase first
      const { error } = await supabase
        .from('attendance_records')
        .upsert(attendanceData, {
          onConflict: 'employee_id,date'
        });

      if (!error) {
        // Reload data to get the latest state
        await loadAttendanceData();
        return { success: true };
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Supabase save failed, using localStorage:', error);
      
      // Fallback to localStorage
      const today = new Date().toISOString().split('T')[0];
      const attendanceRecord: AttendanceRecord = {
        id: `attendance_${employeeId}_${today}`,
        employeeId,
        date: record.date || today,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        hoursWorked: record.hoursWorked || 0,
        breakStart: record.breakStart,
        breakEnd: record.breakEnd,
        totalBreakTime: record.totalBreakTime || 0,
        isOnBreak: record.isOnBreak || false,
        hasUsedBreak: record.hasUsedBreak || false,
      };

      // Save to localStorage
      localStorage.setItem(`attendance_${employeeId}_${today}`, JSON.stringify(attendanceRecord));
      
      // Update history
      const historyKey = `attendance_history_${employeeId}`;
      const existingHistory = localStorage.getItem(historyKey);
      let history = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Remove existing record for today and add new one
      history = history.filter((h: AttendanceRecord) => h.date !== today);
      history.unshift(attendanceRecord);
      
      // Keep only last 30 records
      history = history.slice(0, 30);
      localStorage.setItem(historyKey, JSON.stringify(history));
      
      // Update state
      setTodayAttendance(attendanceRecord);
      setAttendanceHistory(history);
      
      return { success: true };
    }
  };

  const checkIn = async () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    return await saveAttendance({
      date: today,
      checkIn: now,
      hoursWorked: 0,
      totalBreakTime: 0,
      isOnBreak: false,
      hasUsedBreak: false
    });
  };

  const checkOut = async () => {
    if (!todayAttendance?.checkIn) {
      return { success: false, error: 'No check-in record found' };
    }

    const now = new Date();
    let totalBreakTime = todayAttendance.totalBreakTime;
    
    // If currently on break, end the break
    if (todayAttendance.isOnBreak && todayAttendance.breakStart) {
      const breakDuration = (now.getTime() - todayAttendance.breakStart.getTime()) / (1000 * 60);
      totalBreakTime += breakDuration;
    }
    
    const hoursWorked = (now.getTime() - todayAttendance.checkIn.getTime()) / (1000 * 60 * 60) - (totalBreakTime / 60);
    
    return await saveAttendance({
      ...todayAttendance,
      checkOut: now,
      hoursWorked: Math.max(0, hoursWorked),
      totalBreakTime,
      isOnBreak: false,
      breakEnd: now
    });
  };

  const startBreak = async () => {
    if (!todayAttendance?.checkIn || todayAttendance.checkOut || todayAttendance.hasUsedBreak) {
      return { success: false, error: 'Cannot start break' };
    }

    const now = new Date();
    return await saveAttendance({
      ...todayAttendance,
      breakStart: now,
      isOnBreak: true,
      hasUsedBreak: true
    });
  };

  const endBreak = async () => {
    if (!todayAttendance?.breakStart || !todayAttendance.isOnBreak) {
      return { success: false, error: 'No active break found' };
    }

    const now = new Date();
    const breakDuration = (now.getTime() - todayAttendance.breakStart.getTime()) / (1000 * 60);
    const totalBreakTime = todayAttendance.totalBreakTime + breakDuration;

    return await saveAttendance({
      ...todayAttendance,
      breakEnd: now,
      totalBreakTime,
      isOnBreak: false,
      breakStart: undefined
    });
  };

  return {
    todayAttendance,
    attendanceHistory,
    loading,
    checkIn,
    checkOut,
    startBreak,
    endBreak,
    saveAttendance,
    refreshData: loadAttendanceData
  };
};