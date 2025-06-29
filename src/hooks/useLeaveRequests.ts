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
          employee:employees!leave_requests_employee_id_fkey(name, employee_id)
        `)
        .order('applied_date', { ascending: false });

      if (!isAdmin) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;

      if (!error && data) {
        setLeaveRequests(data.map(transformLeaveRequest));
      } else {
        // Fallback to localStorage
        const storageKey = isAdmin ? 'all_leave_requests' : `leave_requests_${employeeId}`;
        const localData = localStorage.getItem(storageKey);
        if (localData) {
          setLeaveRequests(JSON.parse(localData));
        } else {
          setLeaveRequests([]);
        }
      }
    } catch (error) {
      console.error('Error loading leave requests:', error);
      
      // Fallback to localStorage
      const storageKey = isAdmin ? 'all_leave_requests' : `leave_requests_${employeeId}`;
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        setLeaveRequests(JSON.parse(localData));
      } else {
        setLeaveRequests([]);
      }
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
      const newRequest = {
        id: `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        employee_id: employeeId,
        type: requestData.type,
        start_date: requestData.startDate,
        end_date: requestData.endDate,
        reason: requestData.reason,
        status: 'pending',
        applied_date: new Date().toISOString()
      };

      // Try Supabase first
      const { error } = await supabase
        .from('leave_requests')
        .insert(newRequest);

      if (!error) {
        // Create notification for admins
        await createNotificationForAdmins(
          'leave_request',
          'New Leave Request',
          `New ${requestData.type} leave request submitted`,
          employeeId
        );

        await loadLeaveRequests();
        return { success: true };
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Supabase save failed, using localStorage:', error);
      
      // Fallback to localStorage
      const newRequest: LeaveRequest = {
        id: `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        employeeId,
        type: requestData.type,
        startDate: requestData.startDate,
        endDate: requestData.endDate,
        reason: requestData.reason,
        status: 'pending',
        appliedDate: new Date(),
        employeeName: 'Current User',
        employeeNumber: 'EMP001'
      };

      // Save to localStorage
      const storageKey = `leave_requests_${employeeId}`;
      const existingRequests = localStorage.getItem(storageKey);
      let requests = existingRequests ? JSON.parse(existingRequests) : [];
      requests.unshift(newRequest);
      localStorage.setItem(storageKey, JSON.stringify(requests));

      // Also save to admin view
      const adminRequests = localStorage.getItem('all_leave_requests');
      let allRequests = adminRequests ? JSON.parse(adminRequests) : [];
      allRequests.unshift(newRequest);
      localStorage.setItem('all_leave_requests', JSON.stringify(allRequests));

      setLeaveRequests(requests);
      return { success: true };
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

      if (!error) {
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
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error reviewing leave request:', error);
      
      // Fallback to localStorage
      const allRequests = localStorage.getItem('all_leave_requests');
      if (allRequests) {
        let requests = JSON.parse(allRequests);
        requests = requests.map((req: LeaveRequest) => 
          req.id === requestId 
            ? { 
                ...req, 
                status: action, 
                adminComment: comment,
                reviewedBy: employeeId,
                reviewedAt: new Date()
              }
            : req
        );
        localStorage.setItem('all_leave_requests', JSON.stringify(requests));
        setLeaveRequests(requests);
      }
      
      return { success: true };
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
    try {
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
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  };

  const createNotificationForAdmins = async (
    type: string,
    title: string,
    message: string,
    senderId: string
  ) => {
    try {
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
    } catch (error) {
      console.error('Failed to create admin notifications:', error);
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