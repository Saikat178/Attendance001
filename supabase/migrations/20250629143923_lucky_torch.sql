/*
  # Fix RLS Policies and UUID Issues

  1. Security Policy Updates
    - Fix infinite recursion in employees table policies
    - Simplify RLS policies to avoid circular dependencies

  2. Data Type Consistency
    - Ensure all ID columns use proper UUID format
    - Add proper constraints and defaults
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "users_can_read_own_employee_data" ON employees;
DROP POLICY IF EXISTS "users_can_update_own_employee_data" ON employees;
DROP POLICY IF EXISTS "users_can_insert_own_employee_data" ON employees;
DROP POLICY IF EXISTS "admins_can_read_all_employees" ON employees;
DROP POLICY IF EXISTS "admins_can_update_employee_verification" ON employees;

-- Create simplified, non-recursive policies for employees table
CREATE POLICY "employees_can_read_own_data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "employees_can_update_own_data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "employees_can_insert_own_data"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create a separate policy for admin access that doesn't reference employees table
CREATE POLICY "service_role_full_access_employees"
  ON employees
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add a function to check if user is admin without causing recursion
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  );
$$;

-- Create admin policy using the function
CREATE POLICY "admins_full_access_employees"
  ON employees
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Ensure proper UUID generation for all tables
ALTER TABLE employees ALTER COLUMN id SET DEFAULT auth.uid();

-- Update attendance_records policies to be simpler
DROP POLICY IF EXISTS "users_can_manage_own_attendance" ON attendance_records;
DROP POLICY IF EXISTS "admins_can_read_all_attendance" ON attendance_records;

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

-- Update leave_requests policies
DROP POLICY IF EXISTS "users_can_manage_own_leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "admins_can_manage_all_leave_requests" ON leave_requests;

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

-- Update comp_off_requests policies
DROP POLICY IF EXISTS "users_can_manage_own_comp_off_requests" ON comp_off_requests;
DROP POLICY IF EXISTS "admins_can_manage_all_comp_off_requests" ON comp_off_requests;

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

-- Update notifications policies
DROP POLICY IF EXISTS "users_can_read_own_notifications" ON notifications;
DROP POLICY IF EXISTS "users_can_update_own_notifications" ON notifications;
DROP POLICY IF EXISTS "authenticated_users_can_create_notifications" ON notifications;

CREATE POLICY "users_manage_own_notifications"
  ON notifications
  FOR ALL
  TO authenticated
  USING (recipient_id = auth.uid() OR sender_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid() OR sender_id = auth.uid());

-- Update documents policies
DROP POLICY IF EXISTS "users_can_manage_own_documents" ON documents;
DROP POLICY IF EXISTS "admins_can_manage_all_documents" ON documents;

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

-- Update profile_change_requests policies
DROP POLICY IF EXISTS "users_can_manage_own_profile_change_requests" ON profile_change_requests;
DROP POLICY IF EXISTS "admins_can_manage_all_profile_change_requests" ON profile_change_requests;

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

-- Update holidays policies
DROP POLICY IF EXISTS "all_users_can_read_holidays" ON holidays;
DROP POLICY IF EXISTS "admins_can_manage_holidays" ON holidays;

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

-- Update audit_logs policies
DROP POLICY IF EXISTS "admins_can_read_audit_logs" ON audit_logs;

CREATE POLICY "admins_read_audit_logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (is_admin_user());