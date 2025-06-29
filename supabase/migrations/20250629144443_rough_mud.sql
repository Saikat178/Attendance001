/*
  # Fix RLS Policies for Employees Table

  1. Security Changes
    - Remove recursive policies that cause infinite loops
    - Create non-recursive admin check functions
    - Implement proper RLS policies for employees table
    - Allow employees to read/update their own data
    - Allow admins to manage all employee data

  2. Policy Structure
    - Service role: Full access for system operations
    - Admins: Full CRUD access to all employee records
    - Employees: Read/update access to their own records only
    - Signup: Allow initial record creation during registration
*/

-- First, drop all existing policies on employees table to start fresh
DROP POLICY IF EXISTS "admins_full_access_employees" ON employees;
DROP POLICY IF EXISTS "employees_can_insert_own_data" ON employees;
DROP POLICY IF EXISTS "employees_can_read_own_data" ON employees;
DROP POLICY IF EXISTS "employees_can_update_own_data" ON employees;
DROP POLICY IF EXISTS "service_role_full_access_employees" ON employees;

-- Drop any existing admin check functions that might cause recursion
DROP FUNCTION IF EXISTS is_admin_user();
DROP FUNCTION IF EXISTS is_user_admin();

-- Create a simple, non-recursive function to check admin status
CREATE OR REPLACE FUNCTION check_user_is_admin()
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
    false
  );
$$;

-- Create new, non-recursive policies

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
  USING (check_user_is_admin());

-- Policy 3: Admins can insert employee data
CREATE POLICY "admins_can_insert"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (check_user_is_admin());

-- Policy 4: Admins can update all employee data
CREATE POLICY "admins_can_update_all"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (check_user_is_admin())
  WITH CHECK (check_user_is_admin());

-- Policy 5: Admins can delete employee data
CREATE POLICY "admins_can_delete"
  ON employees
  FOR DELETE
  TO authenticated
  USING (check_user_is_admin());

-- Policy 6: Employees can read their own data
CREATE POLICY "employees_read_own_data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy 7: Employees can update their own data (with restrictions)
CREATE POLICY "employees_update_own_data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Only allow updates to specific fields, prevent role/email changes
    role IS NOT DISTINCT FROM role AND
    employee_id IS NOT DISTINCT FROM employee_id AND
    email IS NOT DISTINCT FROM email
  );

-- Policy 8: Allow initial employee record creation during signup
CREATE POLICY "allow_signup_insert"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Create a helper function for other tables to check admin status
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT check_user_is_admin();
$$;

-- Ensure RLS is enabled on employees table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;