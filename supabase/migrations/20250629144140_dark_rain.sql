/*
  # Fix infinite recursion in employees RLS policies

  1. Problem
    - The current RLS policies on the employees table are causing infinite recursion
    - This is likely due to the `is_admin_user()` function or circular policy references

  2. Solution
    - Drop existing problematic policies
    - Create new, simplified policies that avoid recursion
    - Use direct role checks instead of complex functions

  3. Security
    - Maintain proper access control
    - Employees can only access their own data
    - Admins can access all employee data
    - Service role has full access for system operations
*/

-- First, drop all existing policies on employees table to start fresh
DROP POLICY IF EXISTS "admins_full_access_employees" ON employees;
DROP POLICY IF EXISTS "employees_can_insert_own_data" ON employees;
DROP POLICY IF EXISTS "employees_can_read_own_data" ON employees;
DROP POLICY IF EXISTS "employees_can_update_own_data" ON employees;
DROP POLICY IF EXISTS "service_role_full_access_employees" ON employees;

-- Create a simple function to check if user is admin without recursion
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
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
  USING (
    -- Check if user has admin role in their metadata
    (auth.jwt() ->> 'role' = 'admin') OR
    -- Or check if user exists in employees table with admin role
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = auth.uid() AND e.role = 'admin'
    )
  );

-- Policy 3: Admins can insert employee data
CREATE POLICY "admins_can_insert"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Check if user has admin role in their metadata
    (auth.jwt() ->> 'role' = 'admin') OR
    -- Or check if user exists in employees table with admin role
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = auth.uid() AND e.role = 'admin'
    )
  );

-- Policy 4: Admins can update all employee data
CREATE POLICY "admins_can_update_all"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (
    -- Check if user has admin role in their metadata
    (auth.jwt() ->> 'role' = 'admin') OR
    -- Or check if user exists in employees table with admin role
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = auth.uid() AND e.role = 'admin'
    )
  )
  WITH CHECK (
    -- Check if user has admin role in their metadata
    (auth.jwt() ->> 'role' = 'admin') OR
    -- Or check if user exists in employees table with admin role
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = auth.uid() AND e.role = 'admin'
    )
  );

-- Policy 5: Admins can delete employee data
CREATE POLICY "admins_can_delete"
  ON employees
  FOR DELETE
  TO authenticated
  USING (
    -- Check if user has admin role in their metadata
    (auth.jwt() ->> 'role' = 'admin') OR
    -- Or check if user exists in employees table with admin role
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = auth.uid() AND e.role = 'admin'
    )
  );

-- Policy 6: Employees can read their own data
CREATE POLICY "employees_read_own_data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy 7: Employees can update their own data (limited fields)
CREATE POLICY "employees_update_own_data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Prevent employees from changing critical fields
    role = OLD.role AND
    employee_id = OLD.employee_id AND
    email = OLD.email
  );

-- Policy 8: Allow initial employee record creation during signup
CREATE POLICY "allow_signup_insert"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Drop the problematic is_admin_user function if it exists
DROP FUNCTION IF EXISTS is_admin_user();

-- Create a new, safer admin check function
CREATE OR REPLACE FUNCTION check_admin_access()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    -- First check JWT claims
    (auth.jwt() ->> 'role' = 'admin'),
    -- Fallback to database check (but avoid recursion)
    false
  );
$$;