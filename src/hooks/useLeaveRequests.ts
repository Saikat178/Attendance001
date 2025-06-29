import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LeaveRequest } from '../types';

export const useLeaveRequests = (employeeId: string, isAdmin: boolean = false) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      loadLeaveRequests();
      
      // Subscribe to real-time changes
      const subscription = supabase
        .channel('leave_requests_changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'leave_requests'
          }, 
          () => {
            loadLeaveRequests();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [employeeId, isAdmin]);

  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('leave_requests')
        .select(`
          *,
          employee:employees(name, employee_id)
        `)
        .order('applied_date', { ascending: false });

      if (!isAdmin) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        setLeaveRequests(data.map(transformLeaveRequest));
      }
    } catch (error) {
      console.error('Error loading leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformLeaveRequest = (data: any): LeaveRequest => ({
    id: data.id,
    employeeId: data.employee_id,
    type: data.type,
    startDate: data.start_date,
    endDate: data.end_date,
    reason: data.reason,
    status: data.status,
    appliedDate: new Date(data.applied_date),
    adminComment: data.admin_comment,
    reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
    reviewedBy: data.reviewed_by,
    employeeName: data.employee?.name,
    employeeNumber: data.employee?.employee_id,
  });

  const submitLeaveRequest = async (requestData: {
    type: 'sick' | 'vacation' | 'personal' | 'emergency';
    startDate: string;
    endDate: string;
    reason: string;
  }) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: employeeId,
          type: requestData.type,
          start_date: requestData.startDate,
          end_date: requestData.endDate,
          reason: requestData.reason,
          status: 'pending'
        });

      if (error) throw error;

      // Create notification for admins
      await createNotificationForAdmins(
        'leave_request',
        'New Leave Request',
        `New ${requestData.type} leave request submitted`,
        employeeId
      );

      await loadLeaveRequests();
      return { success: true };
    } catch (error) {
      console.error('Error submitting leave request:', error);
      return { success: false, error };
    }
  };

  const reviewLeaveRequest = async (
    requestId: string, 
    action: 'approved' | 'rejected', 
    comment?: string
  ) => {
    try {
      const { data: request } = await supabase
        .from('leave_requests')
        .select('employee_id')
        .eq('id', requestId)
        .single();

      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: action,
          admin_comment: comment,
          reviewed_by: employeeId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Create notification for employee
      if (request) {
        await createNotification(
          action === 'approved' ? 'leave_approved' : 'leave_rejected',
          `Leave Request ${action.charAt(0).toUpperCase() + action.slice(1)}`,
          `Your leave request has been ${action}${comment ? `. Comment: ${comment}` : ''}`,
          request.employee_id,
          employeeId,
          requestId
        );
      }

      await loadLeaveRequests();
      return { success: true };
    } catch (error) {
      console.error('Error reviewing leave request:', error);
      return { success: false, error };
    }
  };

  const createNotification = async (
    type: string,
    title: string,
    message: string,
    recipientId: string,
    senderId: string,
    relatedId: string
  ) => {
    await supabase
      .from('notifications')
      .insert({
        type,
        title,
        message,
        recipient_id: recipientId,
        sender_id: senderId,
        related_id: relatedId
      });
  };

  const createNotificationForAdmins = async (
    type: string,
    title: string,
    message: string,
    senderId: string
  ) => {
    const { data: admins } = await supabase
      .from('employees')
      .select('id')
      .eq('role', 'admin');

    if (admins) {
      const notifications = admins.map(admin => ({
        type,
        title,
        message,
        recipient_id: admin.id,
        sender_id: senderId,
        related_id: senderId
      }));

      await supabase
        .from('notifications')
        .insert(notifications);
    }
  };

  return {
    leaveRequests,
    loading,
    submitLeaveRequest,
    reviewLeaveRequest,
    refreshData: loadLeaveRequests
  };
};