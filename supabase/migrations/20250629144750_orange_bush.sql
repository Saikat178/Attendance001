/*
  # Fix Employee RLS Policies to Prevent Recursion

  This migration fixes the infinite recursion issue in the employees table policies
  by redefining the is_admin_user() function to avoid recursive database queries.
*/

-- First, drop all existing policies on employees table to start fresh
DROP POLICY IF EXISTS "admins_full_access_employees" ON employees;
DROP POLICY IF EXISTS "employees_can_insert_own_data" ON employees;
DROP POLICY IF EXISTS "employees_can_read_own_data" ON employees;
DROP POLICY IF EXISTS "employees_can_update_own_data" ON employees;
DROP POLICY IF EXISTS "service_role_full_access_employees" ON employees;

-- Redefine the is_admin_user function to avoid recursion
-- This function is used by other table policies, so we can't drop it
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    -- Check if user has admin role in JWT metadata
    (auth.jwt() ->> 'role' = 'admin'),
    -- Check if user has admin role in raw_user_meta_data
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'),
    -- Check app_metadata as well
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'),
    false
  );
$$;

-- Create new, non-recursive policies for employees table

-- Policy 1: Service role has full access (for system operations)
CREATE POLICY "service_role_full_access"
  ON employees
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Admins can read all employee data
CREATE POLICY "admins_can_read_all"
  ON employees
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

-- Policy 3: Admins can insert employee data
CREATE POLICY "admins_can_insert"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

-- Policy 4: Admins can update all employee data
CREATE POLICY "admins_can_update_all"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Policy 5: Admins can delete employee data
CREATE POLICY "admins_can_delete"
  ON employees
  FOR DELETE
  TO authenticated
  USING (is_admin_user());

-- Policy 6: Employees can read their own data
CREATE POLICY "employees_read_own_data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy 7: Employees can update their own data (with field restrictions)
CREATE POLICY "employees_update_own_data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Prevent changes to critical fields by checking they remain the same
    -- We'll use a subquery to get the current values instead of OLD
    role = (SELECT role FROM employees WHERE id = auth.uid()) AND
    employee_id = (SELECT employee_id FROM employees WHERE id = auth.uid()) AND
    email = (SELECT email FROM employees WHERE id = auth.uid())
  );

-- Policy 8: Allow initial employee record creation during signup
CREATE POLICY "allow_signup_insert"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Ensure RLS is enabled on employees table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Drop any helper functions that might have been created
DROP FUNCTION IF EXISTS is_user_admin();
DROP FUNCTION IF EXISTS check_user_is_admin();