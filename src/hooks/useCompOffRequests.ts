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
      // Use the dedicated database function for submitting comp off request
      const { data, error } = await supabase
        .rpc('submit_comp_off_request', {
          p_employee_id: employeeId,
          p_work_date: requestData.workDate,
          p_comp_off_date: requestData.compOffDate,
          p_reason: requestData.reason
        });

      if (error) throw error;

      if (data && data.success) {
        // Reload data to get the latest state
        await loadCompOffRequests();
        return { success: true };
      } else {
        throw new Error(data?.message || 'Failed to submit comp off request');
      }
    } catch (error) {
      console.error('Comp off request error:', error);
      
      // Fallback to direct database insert
      try {
        const newRequest = {
          id: crypto.randomUUID(),
          employee_id: employeeId,
          work_date: requestData.workDate,
          comp_off_date: requestData.compOffDate,
          reason: requestData.reason,
          status: 'pending',
          applied_date: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('comp_off_requests')
          .insert(newRequest);

        if (insertError) throw insertError;

        await loadCompOffRequests();
        return { success: true };
      } catch (directError) {
        console.error('Direct insert failed, using localStorage:', directError);
        
        // Fallback to localStorage
        const newRequest: CompOffRequest = {
          id: crypto.randomUUID(),
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
    }
  };

  const reviewCompOffRequest = async (
    requestId: string, 
    action: 'approved' | 'rejected', 
    comment?: string
  ) => {
    try {
      // Use the dedicated database function for reviewing comp off request
      const { data, error } = await supabase
        .rpc('review_comp_off_request', {
          p_request_id: requestId,
          p_status: action,
          p_admin_comment: comment,
          p_reviewed_by: employeeId
        });

      if (error) throw error;

      if (data && data.success) {
        // Reload data to get the latest state
        await loadCompOffRequests();
        return { success: true };
      } else {
        throw new Error(data?.message || 'Failed to review comp off request');
      }
    } catch (error) {
      console.error('Error reviewing comp off request:', error);
      
      // Fallback to direct database update
      try {
        const { error: updateError } = await supabase
          .from('comp_off_requests')
          .update({
            status: action,
            admin_comment: comment,
            reviewed_by: employeeId,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (updateError) throw updateError;

        await loadCompOffRequests();
        return { success: true };
      } catch (directError) {
        console.error('Direct update failed, using localStorage:', directError);
        
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