import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CompOffRequest } from '../types';

export const useCompOffRequests = (employeeId: string, isAdmin: boolean = false) => {
  const [compOffRequests, setCompOffRequests] = useState<CompOffRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      loadCompOffRequests();
      
      // Subscribe to real-time changes
      const subscription = supabase
        .channel('comp_off_requests_changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'comp_off_requests'
          }, 
          () => {
            loadCompOffRequests();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [employeeId, isAdmin]);

  const loadCompOffRequests = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('comp_off_requests')
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
        setCompOffRequests(data.map(transformCompOffRequest));
      }
    } catch (error) {
      console.error('Error loading comp off requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformCompOffRequest = (data: any): CompOffRequest => ({
    id: data.id,
    employeeId: data.employee_id,
    workDate: data.work_date,
    compOffDate: data.comp_off_date,
    reason: data.reason,
    status: data.status,
    appliedDate: new Date(data.applied_date),
    adminComment: data.admin_comment,
    reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
    reviewedBy: data.reviewed_by,
    employeeName: data.employee?.name,
    employeeNumber: data.employee?.employee_id,
  });

  const submitCompOffRequest = async (requestData: {
    workDate: string;
    compOffDate: string;
    reason: string;
  }) => {
    try {
      const { error } = await supabase
        .from('comp_off_requests')
        .insert({
          employee_id: employeeId,
          work_date: requestData.workDate,
          comp_off_date: requestData.compOffDate,
          reason: requestData.reason,
          status: 'pending'
        });

      if (error) throw error;

      // Create notification for admins
      await createNotificationForAdmins(
        'compoff_request',
        'New Comp Off Request',
        `New comp off request for work done on ${requestData.workDate}`,
        employeeId
      );

      await loadCompOffRequests();
      return { success: true };
    } catch (error) {
      console.error('Error submitting comp off request:', error);
      return { success: false, error };
    }
  };

  const reviewCompOffRequest = async (
    requestId: string, 
    action: 'approved' | 'rejected', 
    comment?: string
  ) => {
    try {
      const { data: request } = await supabase
        .from('comp_off_requests')
        .select('employee_id')
        .eq('id', requestId)
        .single();

      const { error } = await supabase
        .from('comp_off_requests')
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
          action === 'approved' ? 'compoff_approved' : 'compoff_rejected',
          `Comp Off Request ${action.charAt(0).toUpperCase() + action.slice(1)}`,
          `Your comp off request has been ${action}${comment ? `. Comment: ${comment}` : ''}`,
          request.employee_id,
          employeeId,
          requestId
        );
      }

      await loadCompOffRequests();
      return { success: true };
    } catch (error) {
      console.error('Error reviewing comp off request:', error);
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
    compOffRequests,
    loading,
    submitCompOffRequest,
    reviewCompOffRequest,
    refreshData: loadCompOffRequests
  };
};