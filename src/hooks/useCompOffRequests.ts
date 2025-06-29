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
          employee:employees!comp_off_requests_employee_id_fkey(name, employee_id)
        `)
        .order('applied_date', { ascending: false });

      if (!isAdmin) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;

      if (!error && data) {
        setCompOffRequests(data.map(transformCompOffRequest));
      } else {
        // Fallback to localStorage
        const storageKey = isAdmin ? 'all_compoff_requests' : `compoff_requests_${employeeId}`;
        const localData = localStorage.getItem(storageKey);
        if (localData) {
          setCompOffRequests(JSON.parse(localData));
        } else {
          setCompOffRequests([]);
        }
      }
    } catch (error) {
      console.error('Error loading comp off requests:', error);
      
      // Fallback to localStorage
      const storageKey = isAdmin ? 'all_compoff_requests' : `compoff_requests_${employeeId}`;
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        setCompOffRequests(JSON.parse(localData));
      } else {
        setCompOffRequests([]);
      }
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
      const newRequest = {
        id: `compoff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        employee_id: employeeId,
        work_date: requestData.workDate,
        comp_off_date: requestData.compOffDate,
        reason: requestData.reason,
        status: 'pending',
        applied_date: new Date().toISOString()
      };

      // Try Supabase first
      const { error } = await supabase
        .from('comp_off_requests')
        .insert(newRequest);

      if (!error) {
        // Create notification for admins
        await createNotificationForAdmins(
          'compoff_request',
          'New Comp Off Request',
          `New comp off request for work done on ${requestData.workDate}`,
          employeeId
        );

        await loadCompOffRequests();
        return { success: true };
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Supabase save failed, using localStorage:', error);
      
      // Fallback to localStorage
      const newRequest: CompOffRequest = {
        id: `compoff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        employeeId,
        workDate: requestData.workDate,
        compOffDate: requestData.compOffDate,
        reason: requestData.reason,
        status: 'pending',
        appliedDate: new Date(),
        employeeName: 'Current User',
        employeeNumber: 'EMP001'
      };

      // Save to localStorage
      const storageKey = `compoff_requests_${employeeId}`;
      const existingRequests = localStorage.getItem(storageKey);
      let requests = existingRequests ? JSON.parse(existingRequests) : [];
      requests.unshift(newRequest);
      localStorage.setItem(storageKey, JSON.stringify(requests));

      // Also save to admin view
      const adminRequests = localStorage.getItem('all_compoff_requests');
      let allRequests = adminRequests ? JSON.parse(adminRequests) : [];
      allRequests.unshift(newRequest);
      localStorage.setItem('all_compoff_requests', JSON.stringify(allRequests));

      setCompOffRequests(requests);
      return { success: true };
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

      if (!error) {
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
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error reviewing comp off request:', error);
      
      // Fallback to localStorage
      const allRequests = localStorage.getItem('all_compoff_requests');
      if (allRequests) {
        let requests = JSON.parse(allRequests);
        requests = requests.map((req: CompOffRequest) => 
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
        localStorage.setItem('all_compoff_requests', JSON.stringify(requests));
        setCompOffRequests(requests);
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
    compOffRequests,
    loading,
    submitCompOffRequest,
    reviewCompOffRequest,
    refreshData: loadCompOffRequests
  };
};