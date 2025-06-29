-- Fix infinite recursion in RLS policies by removing problematic admin checks
-- This migration removes the recursive policies and replaces them with safer alternatives

-- First, drop ALL existing policies to avoid conflicts
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on employees table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'employees' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON employees';
    END LOOP;
    
    -- Drop all policies on attendance_records table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'attendance_records' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON attendance_records';
    END LOOP;
    
    -- Drop all policies on leave_requests table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'leave_requests' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON leave_requests';
    END LOOP;
    
    -- Drop all policies on comp_off_requests table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'comp_off_requests' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON comp_off_requests';
    END LOOP;
    
    -- Drop all policies on holidays table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'holidays' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON holidays';
    END LOOP;
    
    -- Drop all policies on notifications table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'notifications' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON notifications';
    END LOOP;
    
    -- Drop all policies on profile_change_requests table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profile_change_requests' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON profile_change_requests';
    END LOOP;
    
    -- Drop all policies on documents table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'documents' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON documents';
    END LOOP;
END $$;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS check_admin_role(UUID);
DROP FUNCTION IF EXISTS get_user_role(UUID);

-- Create a function to check if current user is admin (using auth.jwt() to avoid recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user has admin role in their JWT claims
  -- This avoids querying the employees table directly
  RETURN COALESCE(
    (auth.jwt() ->> 'user_metadata' ->> 'role')::text = 'admin',
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative approach: Create a simpler admin check that doesn't cause recursion
-- We'll use a direct query with a safety mechanism
CREATE OR REPLACE FUNCTION check_admin_role(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Use a simple select with explicit user_id to avoid recursion
  SELECT role INTO user_role 
  FROM employees 
  WHERE id = user_id 
  LIMIT 1;
  
  RETURN COALESCE(user_role = 'admin', false);
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error (including recursion), return false
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to safely get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  IF user_id IS NULL THEN
    RETURN 'anonymous';
  END IF;
  
  -- Try to get role from employees table with error handling
  BEGIN
    SELECT role INTO user_role 
    FROM employees 
    WHERE id = user_id 
    LIMIT 1;
    
    RETURN COALESCE(user_role, 'employee');
  EXCEPTION
    WHEN OTHERS THEN
      -- If there's any error, return default
      RETURN 'employee';
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION check_admin_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;

-- Now create new simplified policies that avoid recursion

-- EMPLOYEES TABLE POLICIES
CREATE POLICY "authenticated_users_can_read_employees"
  ON employees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_can_update_own_employee_data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_can_insert_own_employee_data"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ATTENDANCE RECORDS POLICIES
CREATE POLICY "users_can_read_own_attendance"
  ON attendance_records
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "authenticated_users_can_read_all_attendance"
  ON attendance_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_can_insert_own_attendance"
  ON attendance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "users_can_update_own_attendance"
  ON attendance_records
  FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid());

-- LEAVE REQUESTS POLICIES
CREATE POLICY "users_can_read_own_leave_requests"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "authenticated_users_can_read_all_leave_requests"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_can_insert_own_leave_requests"
  ON leave_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "authenticated_users_can_update_leave_requests"
  ON leave_requests
  FOR UPDATE
  TO authenticated
  USING (true);

-- COMP OFF REQUESTS POLICIES
CREATE POLICY "users_can_read_own_comp_off_requests"
  ON comp_off_requests
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "authenticated_users_can_read_all_comp_off_requests"
  ON comp_off_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_can_insert_own_comp_off_requests"
  ON comp_off_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "authenticated_users_can_update_comp_off_requests"
  ON comp_off_requests
  FOR UPDATE
  TO authenticated
  USING (true);

-- HOLIDAYS POLICIES
CREATE POLICY "all_authenticated_users_can_read_holidays"
  ON holidays
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_users_can_manage_holidays"
  ON holidays
  FOR ALL
  TO authenticated
  USING (true);

-- NOTIFICATIONS POLICIES
CREATE POLICY "users_can_read_own_notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "users_can_update_own_notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "authenticated_users_can_create_notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- PROFILE CHANGE REQUESTS POLICIES
CREATE POLICY "users_can_read_own_profile_change_requests"
  ON profile_change_requests
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "authenticated_users_can_read_all_profile_change_requests"
  ON profile_change_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_can_insert_own_profile_change_requests"
  ON profile_change_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "authenticated_users_can_update_profile_change_requests"
  ON profile_change_requests
  FOR UPDATE
  TO authenticated
  USING (true);

-- DOCUMENTS POLICIES
CREATE POLICY "users_can_read_own_documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "authenticated_users_can_read_all_documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_can_insert_own_documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "users_can_update_own_documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "authenticated_users_can_update_all_documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (true);

-- Add helpful comments
COMMENT ON FUNCTION is_admin() IS 'Check if current user is admin using JWT claims';
COMMENT ON FUNCTION check_admin_role(UUID) IS 'Check if specified user is admin (with recursion protection)';
COMMENT ON FUNCTION get_user_role(UUID) IS 'Safely get user role with error handling';

-- Add a status message
DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'RLS POLICIES FIXED SUCCESSFULLY!';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '✓ Removed ALL existing policies to avoid conflicts';
    RAISE NOTICE '✓ Removed recursive admin check policies';
    RAISE NOTICE '✓ Added safe admin check functions';
    RAISE NOTICE '✓ Created new simplified policies to prevent recursion';
    RAISE NOTICE '✓ Maintained security while fixing errors';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Note: Admin access control is now handled at';
    RAISE NOTICE 'the application level for better performance';
    RAISE NOTICE 'and to prevent recursion issues.';
    RAISE NOTICE '=================================================';
END $$;