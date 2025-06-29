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
      // Use the dedicated database function for submitting leave request
      const { data, error } = await supabase
        .rpc('submit_leave_request', {
          p_employee_id: employeeId,
          p_type: requestData.type,
          p_start_date: requestData.startDate,
          p_end_date: requestData.endDate,
          p_reason: requestData.reason
        });

      if (error) throw error;

      if (data && data.success) {
        // Reload data to get the latest state
        await loadLeaveRequests();
        return { success: true };
      } else {
        throw new Error(data?.message || 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Leave request error:', error);
      
      // Fallback to direct database insert
      try {
        const newRequest = {
          id: crypto.randomUUID(),
          employee_id: employeeId,
          type: requestData.type,
          start_date: requestData.startDate,
          end_date: requestData.endDate,
          reason: requestData.reason,
          status: 'pending',
          applied_date: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('leave_requests')
          .insert(newRequest);

        if (insertError) throw insertError;

        await loadLeaveRequests();
        return { success: true };
      } catch (directError) {
        console.error('Direct insert failed, using localStorage:', directError);
        
        // Fallback to localStorage
        const newRequest: LeaveRequest = {
          id: crypto.randomUUID(),
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
    }
  };

  const reviewLeaveRequest = async (
    requestId: string, 
    action: 'approved' | 'rejected', 
    comment?: string
  ) => {
    try {
      // Use the dedicated database function for reviewing leave request
      const { data, error } = await supabase
        .rpc('review_leave_request', {
          p_request_id: requestId,
          p_status: action,
          p_admin_comment: comment,
          p_reviewed_by: employeeId
        });

      if (error) throw error;

      if (data && data.success) {
        // Reload data to get the latest state
        await loadLeaveRequests();
        return { success: true };
      } else {
        throw new Error(data?.message || 'Failed to review leave request');
      }
    } catch (error) {
      console.error('Error reviewing leave request:', error);
      
      // Fallback to direct database update
      try {
        const { error: updateError } = await supabase
          .from('leave_requests')
          .update({
            status: action,
            admin_comment: comment,
            reviewed_by: employeeId,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (updateError) throw updateError;

        await loadLeaveRequests();
        return { success: true };
      } catch (directError) {
        console.error('Direct update failed, using localStorage:', directError);
        
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