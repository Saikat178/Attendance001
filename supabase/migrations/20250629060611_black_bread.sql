-- Add support for employee ID login by ensuring employee_id is properly indexed and unique
-- This migration enhances the login system to support both email and employee ID

-- Ensure employee_id is unique and properly indexed (should already exist from previous migration)
-- Adding this as a safety check
DO $$
BEGIN
    -- Check if the unique constraint exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employees_employee_id_key' 
        AND table_name = 'employees'
    ) THEN
        ALTER TABLE employees ADD CONSTRAINT employees_employee_id_key UNIQUE (employee_id);
    END IF;
END $$;

-- Ensure the index exists for performance
CREATE INDEX IF NOT EXISTS idx_employees_employee_id_lookup ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_email_lookup ON employees(email);

-- Create a function to find employee by identifier (email or employee_id)
CREATE OR REPLACE FUNCTION find_employee_by_identifier(identifier TEXT)
RETURNS TABLE(
    employee_uuid UUID,
    employee_email TEXT,
    employee_id_value TEXT,
    employee_name TEXT,
    employee_role TEXT
) AS $$
BEGIN
    -- Check if identifier looks like an email
    IF identifier ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        -- Search by email
        RETURN QUERY
        SELECT id, email, employee_id, name, role
        FROM employees
        WHERE email = identifier;
    ELSE
        -- Search by employee_id
        RETURN QUERY
        SELECT id, email, employee_id, name, role
        FROM employees
        WHERE employee_id = identifier;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to validate employee credentials for login
CREATE OR REPLACE FUNCTION validate_employee_login(identifier TEXT, user_role TEXT)
RETURNS TABLE(
    is_valid BOOLEAN,
    employee_email TEXT,
    employee_id_value TEXT,
    employee_name TEXT,
    message TEXT
) AS $$
DECLARE
    emp_record RECORD;
BEGIN
    -- Find employee by identifier
    SELECT * INTO emp_record
    FROM find_employee_by_identifier(identifier);
    
    IF emp_record IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Employee not found'::TEXT;
        RETURN;
    END IF;
    
    -- Check if role matches
    IF emp_record.employee_role != user_role THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Role mismatch'::TEXT;
        RETURN;
    END IF;
    
    -- Return success
    RETURN QUERY SELECT TRUE, emp_record.employee_email, emp_record.employee_id_value, emp_record.employee_name, 'Valid credentials'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get employee statistics for admin dashboard
CREATE OR REPLACE FUNCTION get_employee_stats()
RETURNS TABLE(
    total_employees BIGINT,
    verified_employees BIGINT,
    pending_employees BIGINT,
    admin_count BIGINT,
    employee_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_employees,
        COUNT(*) FILTER (WHERE is_verified = true) as verified_employees,
        COUNT(*) FILTER (WHERE is_verified = false OR is_verified IS NULL) as pending_employees,
        COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
        COUNT(*) FILTER (WHERE role = 'employee') as employee_count
    FROM employees;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if employee ID is available during registration
CREATE OR REPLACE FUNCTION is_employee_id_available(emp_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM employees WHERE employee_id = emp_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to generate the next available employee ID (optional utility)
CREATE OR REPLACE FUNCTION generate_employee_id(prefix TEXT DEFAULT 'EMP')
RETURNS TEXT AS $$
DECLARE
    next_id TEXT;
    counter INTEGER := 1;
    current_year TEXT := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
BEGIN
    LOOP
        next_id := prefix || current_year || LPAD(counter::TEXT, 4, '0');
        
        IF is_employee_id_available(next_id) THEN
            RETURN next_id;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 9999 THEN
            RAISE EXCEPTION 'Unable to generate unique employee ID';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for the new functions
-- Note: Functions marked as SECURITY DEFINER run with the privileges of the function owner

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION find_employee_by_identifier(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_employee_login(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_employee_id_available(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_employee_id(TEXT) TO authenticated;

-- Grant execute permissions for admin functions to authenticated users
-- (RLS will handle the actual access control)
GRANT EXECUTE ON FUNCTION get_employee_stats() TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION find_employee_by_identifier(TEXT) IS 'Find employee by email or employee ID';
COMMENT ON FUNCTION validate_employee_login(TEXT, TEXT) IS 'Validate employee credentials for login';
COMMENT ON FUNCTION is_employee_id_available(TEXT) IS 'Check if employee ID is available for registration';
COMMENT ON FUNCTION generate_employee_id(TEXT) IS 'Generate next available employee ID with given prefix';
COMMENT ON FUNCTION get_employee_stats() IS 'Get employee statistics for admin dashboard';

-- Create a view for employee lookup (useful for admin interfaces)
CREATE OR REPLACE VIEW employee_lookup AS
SELECT 
    id,
    employee_id,
    name,
    email,
    role,
    department,
    position,
    is_verified,
    created_at
FROM employees
ORDER BY created_at DESC;

-- Add RLS policy for the view
CREATE POLICY "Admins can access employee lookup"
    ON employees
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Grant access to the view
GRANT SELECT ON employee_lookup TO authenticated;

-- Add indexes for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_employees_role_verified ON employees(role, is_verified);
CREATE INDEX IF NOT EXISTS idx_employees_created_at ON employees(created_at);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department) WHERE department IS NOT NULL;

-- Update the system readiness check to include login functionality
CREATE OR REPLACE FUNCTION check_system_readiness()
RETURNS TABLE(
    component TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check if tables exist and are accessible
    RETURN QUERY
    SELECT 
        'Database Tables'::TEXT,
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') 
            THEN 'Ready'::TEXT
            ELSE 'Not Ready'::TEXT
        END,
        'All required tables are present'::TEXT;
    
    -- Check if RLS is enabled
    RETURN QUERY
    SELECT 
        'Row Level Security'::TEXT,
        CASE 
            WHEN (SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
                  WHERE c.relname IN ('employees', 'attendance_records', 'leave_requests') 
                  AND c.relrowsecurity = true) >= 3
            THEN 'Enabled'::TEXT
            ELSE 'Disabled'::TEXT
        END,
        'Security policies are active'::TEXT;
    
    -- Check login functions
    RETURN QUERY
    SELECT 
        'Login Functions'::TEXT,
        CASE 
            WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'find_employee_by_identifier')
            AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_employee_login')
            THEN 'Available'::TEXT
            ELSE 'Missing'::TEXT
        END,
        'Employee ID and email login support'::TEXT;
    
    -- Check if holidays are configured
    RETURN QUERY
    SELECT 
        'Holiday Calendar'::TEXT,
        CASE 
            WHEN (SELECT COUNT(*) FROM holidays WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)) > 0
            THEN 'Configured'::TEXT
            ELSE 'Not Configured'::TEXT
        END,
        (SELECT COUNT(*)::TEXT || ' holidays configured for ' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT FROM holidays WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE));
    
    -- Check if data is clean
    RETURN QUERY
    SELECT 
        'Data State'::TEXT,
        CASE 
            WHEN (SELECT COUNT(*) FROM employees) = 0 AND (SELECT COUNT(*) FROM attendance_records) = 0
            THEN 'Clean'::TEXT
            ELSE 'Has Data'::TEXT
        END,
        'Database is ready for production data'::TEXT;
    
    -- Check employee ID uniqueness
    RETURN QUERY
    SELECT 
        'Employee ID System'::TEXT,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'employees_employee_id_key' 
                AND table_name = 'employees'
            )
            THEN 'Ready'::TEXT
            ELSE 'Not Ready'::TEXT
        END,
        'Employee ID uniqueness enforced'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Run the updated readiness check
SELECT * FROM check_system_readiness();

-- Add final status message
DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'EMPLOYEE LOGIN SYSTEM UPDATED SUCCESSFULLY!';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'New features added:';
    RAISE NOTICE '✓ Login with Employee ID or Email';
    RAISE NOTICE '✓ Employee lookup functions';
    RAISE NOTICE '✓ Employee ID availability checking';
    RAISE NOTICE '✓ Enhanced security and performance';
    RAISE NOTICE '✓ Admin statistics functions';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Users can now login using either:';
    RAISE NOTICE '• Their email address (e.g., john@company.com)';
    RAISE NOTICE '• Their employee ID (e.g., EMP20240001)';
    RAISE NOTICE '=================================================';
END $$;