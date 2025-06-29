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
      
      // Get today's attendance using the new database function
      const { data: todayData, error: todayError } = await supabase
        .rpc('get_today_attendance', { p_employee_id: employeeId });

      if (!todayError && todayData && todayData.success) {
        if (todayData.exists) {
          setTodayAttendance(transformAttendanceRecord(todayData.data));
        } else {
          setTodayAttendance(null);
        }
      } else {
        // Fallback to direct query
        const today = new Date().toISOString().split('T')[0];
        const { data: directData, error: directError } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('employee_id', employeeId)
          .eq('date', today)
          .maybeSingle();

        if (!directError && directData) {
          setTodayAttendance(transformAttendanceRecord(directData));
        } else {
          // Fallback to localStorage
          const localAttendance = localStorage.getItem(`attendance_${employeeId}_${today}`);
          if (localAttendance) {
            setTodayAttendance(JSON.parse(localAttendance));
          } else {
            setTodayAttendance(null);
          }
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

  const checkIn = async () => {
    try {
      // Use the dedicated database function for check-in
      const { data, error } = await supabase
        .rpc('record_check_in', { p_employee_id: employeeId });

      if (error) throw error;

      if (data && data.success) {
        // Reload data to get the latest state
        await loadAttendanceData();
        return { success: true };
      } else {
        throw new Error(data?.message || 'Check-in failed');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      
      // Fallback to localStorage
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const attendanceRecord: AttendanceRecord = {
        id: `attendance_${employeeId}_${today}`,
        employeeId,
        date: today,
        checkIn: now,
        hoursWorked: 0,
        totalBreakTime: 0,
        isOnBreak: false,
        hasUsedBreak: false,
      };

      localStorage.setItem(`attendance_${employeeId}_${today}`, JSON.stringify(attendanceRecord));
      
      // Update history
      const historyKey = `attendance_history_${employeeId}`;
      const existingHistory = localStorage.getItem(historyKey);
      let history = existingHistory ? JSON.parse(existingHistory) : [];
      
      history = history.filter((h: AttendanceRecord) => h.date !== today);
      history.unshift(attendanceRecord);
      history = history.slice(0, 30);
      localStorage.setItem(historyKey, JSON.stringify(history));
      
      setTodayAttendance(attendanceRecord);
      setAttendanceHistory(history);
      
      return { success: true };
    }
  };

  const checkOut = async () => {
    try {
      // Use the dedicated database function for check-out
      const { data, error } = await supabase
        .rpc('record_check_out', { p_employee_id: employeeId });

      if (error) throw error;

      if (data && data.success) {
        // Reload data to get the latest state
        await loadAttendanceData();
        return { success: true };
      } else {
        throw new Error(data?.message || 'Check-out failed');
      }
    } catch (error) {
      console.error('Check-out error:', error);
      
      // Fallback to localStorage
      if (!todayAttendance?.checkIn) {
        return { success: false, error: 'No check-in record found' };
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      let totalBreakTime = todayAttendance.totalBreakTime;
      
      // If currently on break, end the break
      if (todayAttendance.isOnBreak && todayAttendance.breakStart) {
        const breakDuration = (now.getTime() - todayAttendance.breakStart.getTime()) / (1000 * 60);
        totalBreakTime += breakDuration;
      }
      
      const hoursWorked = (now.getTime() - todayAttendance.checkIn.getTime()) / (1000 * 60 * 60) - (totalBreakTime / 60);
      
      const updatedRecord = {
        ...todayAttendance,
        checkOut: now,
        hoursWorked: Math.max(0, hoursWorked),
        totalBreakTime,
        isOnBreak: false,
        breakEnd: todayAttendance.isOnBreak ? now : todayAttendance.breakEnd
      };
      
      localStorage.setItem(`attendance_${employeeId}_${today}`, JSON.stringify(updatedRecord));
      
      // Update history
      const historyKey = `attendance_history_${employeeId}`;
      const existingHistory = localStorage.getItem(historyKey);
      let history = existingHistory ? JSON.parse(existingHistory) : [];
      
      history = history.filter((h: AttendanceRecord) => h.date !== today);
      history.unshift(updatedRecord);
      localStorage.setItem(historyKey, JSON.stringify(history));
      
      setTodayAttendance(updatedRecord);
      setAttendanceHistory(history);
      
      return { success: true };
    }
  };

  const startBreak = async () => {
    try {
      // Use the dedicated database function for starting break
      const { data, error } = await supabase
        .rpc('record_break_start', { p_employee_id: employeeId });

      if (error) throw error;

      if (data && data.success) {
        // Reload data to get the latest state
        await loadAttendanceData();
        return { success: true };
      } else {
        throw new Error(data?.message || 'Failed to start break');
      }
    } catch (error) {
      console.error('Start break error:', error);
      
      // Fallback to localStorage
      if (!todayAttendance?.checkIn || todayAttendance.checkOut || todayAttendance.hasUsedBreak) {
        return { success: false, error: 'Cannot start break' };
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const updatedRecord = {
        ...todayAttendance,
        breakStart: now,
        isOnBreak: true,
        hasUsedBreak: true
      };
      
      localStorage.setItem(`attendance_${employeeId}_${today}`, JSON.stringify(updatedRecord));
      
      // Update history
      const historyKey = `attendance_history_${employeeId}`;
      const existingHistory = localStorage.getItem(historyKey);
      let history = existingHistory ? JSON.parse(existingHistory) : [];
      
      history = history.filter((h: AttendanceRecord) => h.date !== today);
      history.unshift(updatedRecord);
      localStorage.setItem(historyKey, JSON.stringify(history));
      
      setTodayAttendance(updatedRecord);
      setAttendanceHistory(history);
      
      return { success: true };
    }
  };

  const endBreak = async () => {
    try {
      // Use the dedicated database function for ending break
      const { data, error } = await supabase
        .rpc('record_break_end', { p_employee_id: employeeId });

      if (error) throw error;

      if (data && data.success) {
        // Reload data to get the latest state
        await loadAttendanceData();
        return { success: true };
      } else {
        throw new Error(data?.message || 'Failed to end break');
      }
    } catch (error) {
      console.error('End break error:', error);
      
      // Fallback to localStorage
      if (!todayAttendance?.breakStart || !todayAttendance.isOnBreak) {
        return { success: false, error: 'No active break found' };
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const breakDuration = (now.getTime() - todayAttendance.breakStart.getTime()) / (1000 * 60);
      const totalBreakTime = todayAttendance.totalBreakTime + breakDuration;

      const updatedRecord = {
        ...todayAttendance,
        breakEnd: now,
        totalBreakTime,
        isOnBreak: false,
        breakStart: undefined
      };
      
      localStorage.setItem(`attendance_${employeeId}_${today}`, JSON.stringify(updatedRecord));
      
      // Update history
      const historyKey = `attendance_history_${employeeId}`;
      const existingHistory = localStorage.getItem(historyKey);
      let history = existingHistory ? JSON.parse(existingHistory) : [];
      
      history = history.filter((h: AttendanceRecord) => h.date !== today);
      history.unshift(updatedRecord);
      localStorage.setItem(historyKey, JSON.stringify(history));
      
      setTodayAttendance(updatedRecord);
      setAttendanceHistory(history);
      
      return { success: true };
    }
  };

  return {
    todayAttendance,
    attendanceHistory,
    loading,
    checkIn,
    checkOut,
    startBreak,
    endBreak,
    refreshData: loadAttendanceData
  };
};