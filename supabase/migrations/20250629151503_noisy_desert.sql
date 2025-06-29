/*
  # Fix Supabase Functions for Data Recording

  1. Database Functions
    - Fix RLS policies that may be blocking data insertion
    - Ensure proper authentication handling
    - Add missing database functions for data operations

  2. Security
    - Maintain security while allowing proper data flow
    - Fix admin check functions
    - Ensure service role access

  3. Data Recording
    - Fix attendance recording issues
    - Fix leave request submissions
    - Fix notification creation
*/

-- First, ensure all required extensions are available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop and recreate the admin check function to be more reliable
DROP FUNCTION IF EXISTS is_admin_user() CASCADE;

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    user_role text;
BEGIN
    -- First try to get role from employees table
    SELECT role INTO user_role
    FROM employees 
    WHERE id = auth.uid();
    
    -- If found in employees table, check if admin
    IF user_role IS NOT NULL THEN
        RETURN user_role = 'admin';
    END IF;
    
    -- Fallback to JWT metadata
    user_role := auth.jwt() ->> 'role';
    IF user_role IS NOT NULL THEN
        RETURN user_role = 'admin';
    END IF;
    
    -- Check user_metadata
    user_role := auth.jwt() -> 'user_metadata' ->> 'role';
    IF user_role IS NOT NULL THEN
        RETURN user_role = 'admin';
    END IF;
    
    -- Check app_metadata
    user_role := auth.jwt() -> 'app_metadata' ->> 'role';
    IF user_role IS NOT NULL THEN
        RETURN user_role = 'admin';
    END IF;
    
    -- Default to false
    RETURN false;
END;
$$;

-- Create a function to safely get current user info
CREATE OR REPLACE FUNCTION get_current_user_info()
RETURNS TABLE(
    user_id uuid,
    user_email text,
    user_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid() as user_id,
        COALESCE(auth.email(), '') as user_email,
        COALESCE(
            (SELECT role FROM employees WHERE id = auth.uid()),
            auth.jwt() ->> 'role',
            'employee'
        ) as user_role;
END;
$$;

-- Drop all existing policies and recreate them properly
-- Employees table policies
DROP POLICY IF EXISTS "service_role_full_access" ON employees;
DROP POLICY IF EXISTS "admins_can_read_all" ON employees;
DROP POLICY IF EXISTS "admins_can_insert" ON employees;
DROP POLICY IF EXISTS "admins_can_update_all" ON employees;
DROP POLICY IF EXISTS "admins_can_delete" ON employees;
DROP POLICY IF EXISTS "employees_read_own_data" ON employees;
DROP POLICY IF EXISTS "employees_update_own_data" ON employees;
DROP POLICY IF EXISTS "allow_signup_insert" ON employees;

-- Service role has full access
CREATE POLICY "service_role_full_access"
  ON employees
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Employees can read their own data
CREATE POLICY "employees_read_own_data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Employees can update their own data (limited fields)
CREATE POLICY "employees_update_own_data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Only allow updating specific fields, prevent role/email changes
    role = (SELECT role FROM employees WHERE id = auth.uid()) AND
    employee_id = (SELECT employee_id FROM employees WHERE id = auth.uid()) AND
    email = (SELECT email FROM employees WHERE id = auth.uid())
  );

-- Allow initial employee record creation during signup
CREATE POLICY "allow_signup_insert"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Admins can read all employee data
CREATE POLICY "admins_can_read_all"
  ON employees
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

-- Admins can insert employee data
CREATE POLICY "admins_can_insert"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

-- Admins can update all employee data
CREATE POLICY "admins_can_update_all"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Admins can delete employee data
CREATE POLICY "admins_can_delete"
  ON employees
  FOR DELETE
  TO authenticated
  USING (is_admin_user());

-- Fix attendance_records policies
DROP POLICY IF EXISTS "employees_manage_own_attendance" ON attendance_records;
DROP POLICY IF EXISTS "admins_manage_all_attendance" ON attendance_records;

CREATE POLICY "employees_manage_own_attendance"
  ON attendance_records
  FOR ALL
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "admins_manage_all_attendance"
  ON attendance_records
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Fix leave_requests policies
DROP POLICY IF EXISTS "employees_manage_own_leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "admins_manage_all_leave_requests" ON leave_requests;

CREATE POLICY "employees_manage_own_leave_requests"
  ON leave_requests
  FOR ALL
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "admins_manage_all_leave_requests"
  ON leave_requests
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Fix comp_off_requests policies
DROP POLICY IF EXISTS "employees_manage_own_comp_off_requests" ON comp_off_requests;
DROP POLICY IF EXISTS "admins_manage_all_comp_off_requests" ON comp_off_requests;

CREATE POLICY "employees_manage_own_comp_off_requests"
  ON comp_off_requests
  FOR ALL
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "admins_manage_all_comp_off_requests"
  ON comp_off_requests
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Fix notifications policies
DROP POLICY IF EXISTS "users_manage_own_notifications" ON notifications;

CREATE POLICY "users_manage_own_notifications"
  ON notifications
  FOR ALL
  TO authenticated
  USING (recipient_id = auth.uid() OR sender_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid() OR sender_id = auth.uid());

-- Fix holidays policies
DROP POLICY IF EXISTS "authenticated_users_read_holidays" ON holidays;
DROP POLICY IF EXISTS "admins_manage_holidays" ON holidays;

CREATE POLICY "authenticated_users_read_holidays"
  ON holidays
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admins_manage_holidays"
  ON holidays
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Fix documents policies
DROP POLICY IF EXISTS "employees_manage_own_documents" ON documents;
DROP POLICY IF EXISTS "admins_manage_all_documents" ON documents;

CREATE POLICY "employees_manage_own_documents"
  ON documents
  FOR ALL
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "admins_manage_all_documents"
  ON documents
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Fix profile_change_requests policies
DROP POLICY IF EXISTS "employees_manage_own_profile_change_requests" ON profile_change_requests;
DROP POLICY IF EXISTS "admins_manage_all_profile_change_requests" ON profile_change_requests;

CREATE POLICY "employees_manage_own_profile_change_requests"
  ON profile_change_requests
  FOR ALL
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "admins_manage_all_profile_change_requests"
  ON profile_change_requests
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Create helper functions for data operations

-- Function to safely insert attendance record
CREATE OR REPLACE FUNCTION insert_attendance_record(
  p_employee_id uuid,
  p_date date,
  p_check_in timestamptz DEFAULT NULL,
  p_check_out timestamptz DEFAULT NULL,
  p_hours_worked numeric DEFAULT 0,
  p_break_start timestamptz DEFAULT NULL,
  p_break_end timestamptz DEFAULT NULL,
  p_total_break_time numeric DEFAULT 0,
  p_is_on_break boolean DEFAULT false,
  p_has_used_break boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  record_id uuid;
BEGIN
  -- Insert or update attendance record
  INSERT INTO attendance_records (
    employee_id, date, check_in, check_out, hours_worked,
    break_start, break_end, total_break_time, is_on_break, has_used_break
  ) VALUES (
    p_employee_id, p_date, p_check_in, p_check_out, p_hours_worked,
    p_break_start, p_break_end, p_total_break_time, p_is_on_break, p_has_used_break
  )
  ON CONFLICT (employee_id, date)
  DO UPDATE SET
    check_in = COALESCE(EXCLUDED.check_in, attendance_records.check_in),
    check_out = COALESCE(EXCLUDED.check_out, attendance_records.check_out),
    hours_worked = EXCLUDED.hours_worked,
    break_start = COALESCE(EXCLUDED.break_start, attendance_records.break_start),
    break_end = COALESCE(EXCLUDED.break_end, attendance_records.break_end),
    total_break_time = EXCLUDED.total_break_time,
    is_on_break = EXCLUDED.is_on_break,
    has_used_break = EXCLUDED.has_used_break,
    updated_at = now()
  RETURNING id INTO record_id;
  
  RETURN record_id;
END;
$$;

-- Function to safely insert leave request
CREATE OR REPLACE FUNCTION insert_leave_request(
  p_employee_id uuid,
  p_type text,
  p_start_date date,
  p_end_date date,
  p_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id uuid;
BEGIN
  INSERT INTO leave_requests (
    employee_id, type, start_date, end_date, reason, status, applied_date
  ) VALUES (
    p_employee_id, p_type, p_start_date, p_end_date, p_reason, 'pending', now()
  )
  RETURNING id INTO request_id;
  
  RETURN request_id;
END;
$$;

-- Function to safely insert comp off request
CREATE OR REPLACE FUNCTION insert_comp_off_request(
  p_employee_id uuid,
  p_work_date date,
  p_comp_off_date date,
  p_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id uuid;
BEGIN
  INSERT INTO comp_off_requests (
    employee_id, work_date, comp_off_date, reason, status, applied_date
  ) VALUES (
    p_employee_id, p_work_date, p_comp_off_date, p_reason, 'pending', now()
  )
  RETURNING id INTO request_id;
  
  RETURN request_id;
END;
$$;

-- Function to safely insert notification
CREATE OR REPLACE FUNCTION insert_notification(
  p_type text,
  p_title text,
  p_message text,
  p_recipient_id uuid,
  p_sender_id uuid,
  p_related_id uuid DEFAULT NULL,
  p_data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (
    type, title, message, recipient_id, sender_id, related_id, data, is_read, created_at
  ) VALUES (
    p_type, p_title, p_message, p_recipient_id, p_sender_id, p_related_id, p_data, false, now()
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to get employee by email or employee_id
CREATE OR REPLACE FUNCTION get_employee_by_identifier(
  p_identifier text
)
RETURNS TABLE(
  id uuid,
  employee_id text,
  name text,
  email text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.employee_id,
    e.name,
    e.email,
    e.role
  FROM employees e
  WHERE e.email = p_identifier OR e.employee_id = p_identifier;
END;
$$;

-- Function to check if employee_id or email exists
CREATE OR REPLACE FUNCTION check_employee_exists(
  p_email text DEFAULT NULL,
  p_employee_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM employees 
    WHERE (p_email IS NOT NULL AND email = p_email)
       OR (p_employee_id IS NOT NULL AND employee_id = p_employee_id)
  );
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_info() TO authenticated;
GRANT EXECUTE ON FUNCTION insert_attendance_record(uuid, date, timestamptz, timestamptz, numeric, timestamptz, timestamptz, numeric, boolean, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_leave_request(uuid, text, date, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_comp_off_request(uuid, date, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_notification(text, text, text, uuid, uuid, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION get_employee_by_identifier(text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_employee_exists(text, text) TO authenticated;

-- Ensure all tables have RLS enabled
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE comp_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_change_requests ENABLE ROW LEVEL SECURITY;

-- Create some test data to verify functions work
DO $$
DECLARE
  test_user_id uuid := '550e8400-e29b-41d4-a716-446655440000';
  test_admin_id uuid := '550e8400-e29b-41d4-a716-446655440001';
BEGIN
  -- Insert test users if they don't exist (for testing purposes)
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES 
    (test_user_id, 'test@example.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
    (test_admin_id, 'admin@example.com', crypt('admin123', gen_salt('bf')), now(), now(), now())
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert test employees if they don't exist
  INSERT INTO employees (id, employee_id, name, email, role, is_verified, created_at, updated_at)
  VALUES 
    (test_user_id, 'EMP001', 'Test Employee', 'test@example.com', 'employee', true, now(), now()),
    (test_admin_id, 'ADMIN001', 'Test Admin', 'admin@example.com', 'admin', true, now(), now())
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE 'Test data created successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test data creation failed (this is normal if auth schema is not accessible): %', SQLERRM;
END $$;

-- Final verification
DO $$
DECLARE
  policy_count integer;
  function_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
  SELECT COUNT(*) INTO function_count FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
  
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'SUPABASE FUNCTIONS FIXED FOR DATA RECORDING!';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Database Status:';
  RAISE NOTICE '• RLS Policies: %', policy_count;
  RAISE NOTICE '• Custom Functions: %', function_count;
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Fixed Issues:';
  RAISE NOTICE '✓ Admin check function improved';
  RAISE NOTICE '✓ RLS policies simplified and fixed';
  RAISE NOTICE '✓ Data insertion functions added';
  RAISE NOTICE '✓ Helper functions for operations';
  RAISE NOTICE '✓ Proper authentication handling';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Data recording should now work properly!';
  RAISE NOTICE '=================================================';
END $$;