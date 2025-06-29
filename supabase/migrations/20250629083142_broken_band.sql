/*
  # Corporate-Focused Indian Holidays Migration

  1. Clean Setup
    - Drop existing functions to avoid conflicts
    - Clear existing holidays data
    
  2. Holiday Data
    - Add essential Indian corporate holidays for 2025-2026
    - Include national, regional, and company observances
    - Balance mandatory vs optional classifications
    
  3. Business Functions
    - Holiday planning and calendar functions
    - Working day validation
    - Corporate-focused utilities
    
  4. Optimizations
    - Indexes for performance
    - Views for quick access
    - Proper permissions
*/

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS get_holidays_by_year(INTEGER);
DROP FUNCTION IF EXISTS get_upcoming_holidays(INTEGER);
DROP FUNCTION IF EXISTS is_working_day(DATE);
DROP FUNCTION IF EXISTS get_month_calendar(INTEGER, INTEGER);

-- Drop existing view if it exists
DROP VIEW IF EXISTS current_year_holidays;

-- Clean existing holidays to avoid duplicates
DELETE FROM holidays;

-- Insert corporate-focused Indian holidays for 2025-2026
INSERT INTO holidays (name, date, type, description, is_optional) VALUES

-- NATIONAL HOLIDAYS (Mandatory for all Indian companies)
('Republic Day', '2025-01-26', 'national', 'Celebrates the adoption of the Constitution of India', false),
('Independence Day', '2025-08-15', 'national', 'Commemorates India''s independence from British rule', false),
('Gandhi Jayanti', '2025-10-02', 'national', 'Birth anniversary of Mahatma Gandhi, Father of the Nation', false),

-- MAJOR RELIGIOUS FESTIVALS (Commonly observed across corporate India)
('Makar Sankranti', '2025-01-14', 'regional', 'Hindu harvest festival, widely celebrated across India', false),
('Maha Shivratri', '2025-02-26', 'regional', 'Major Hindu festival dedicated to Lord Shiva', false),
('Holi', '2025-03-14', 'national', 'Festival of colors, celebrated pan-India', false),
('Ram Navami', '2025-04-06', 'regional', 'Birth anniversary of Lord Rama', false),
('Good Friday', '2025-04-18', 'national', 'Christian observance, national holiday', false),
('Buddha Purnima', '2025-05-12', 'national', 'Birth anniversary of Gautama Buddha', false),
('Eid ul-Fitr', '2025-03-31', 'national', 'Islamic festival marking end of Ramadan', false),
('Eid ul-Adha', '2025-06-07', 'national', 'Islamic festival of sacrifice', false),
('Krishna Janmashtami', '2025-08-16', 'regional', 'Birth anniversary of Lord Krishna', false),
('Ganesh Chaturthi', '2025-08-27', 'regional', 'Festival honoring Lord Ganesha, major in western India', true),
('Dussehra', '2025-10-02', 'national', 'Victory of good over evil, major Hindu festival', false),
('Diwali', '2025-10-20', 'national', 'Festival of lights, most important Hindu festival', false),
('Guru Nanak Jayanti', '2025-11-15', 'national', 'Birth anniversary of Guru Nanak, founder of Sikhism', false),
('Christmas', '2025-12-25', 'national', 'Birth anniversary of Jesus Christ', false),

-- REGIONAL FESTIVALS (Major ones commonly observed)
('Pongal', '2025-01-14', 'regional', 'Tamil harvest festival (South India)', true),
('Onam', '2025-09-05', 'regional', 'Kerala harvest festival', true),
('Durga Puja', '2025-09-30', 'regional', 'Major Bengali festival (East India)', true),
('Baisakhi', '2025-04-13', 'regional', 'Sikh New Year and harvest festival (North India)', true),
('Gudi Padwa', '2025-03-30', 'regional', 'Marathi New Year (Maharashtra)', true),
('Ugadi', '2025-03-30', 'regional', 'Telugu/Kannada New Year (South India)', true),

-- CULTURAL & MODERN OBSERVANCES
('Martyrs'' Day', '2025-01-30', 'company', 'Remembering Mahatma Gandhi''s martyrdom', true),
('International Women''s Day', '2025-03-08', 'company', 'Celebrating women''s achievements', true),
('World Environment Day', '2025-06-05', 'company', 'Environmental awareness day', true),
('International Yoga Day', '2025-06-21', 'company', 'Promoting yoga and wellness', true),
('Teachers'' Day', '2025-09-05', 'company', 'Honoring teachers and education', true),
('National Unity Day', '2025-10-31', 'company', 'Birth anniversary of Sardar Vallabhbhai Patel', true),

-- 2026 MAJOR HOLIDAYS (For advance planning)
('Republic Day', '2026-01-26', 'national', 'Celebrates the adoption of the Constitution of India', false),
('Makar Sankranti', '2026-01-14', 'regional', 'Hindu harvest festival', false),
('Maha Shivratri', '2026-02-17', 'regional', 'Major Hindu festival dedicated to Lord Shiva', false),
('Holi', '2026-03-05', 'national', 'Festival of colors', false),
('Ram Navami', '2026-03-28', 'regional', 'Birth anniversary of Lord Rama', false),
('Good Friday', '2026-04-03', 'national', 'Christian observance', false),
('Buddha Purnima', '2026-05-01', 'national', 'Birth anniversary of Gautama Buddha', false),
('Eid ul-Fitr', '2026-03-20', 'national', 'Islamic festival (approximate date)', false),
('Independence Day', '2026-08-15', 'national', 'India''s independence day', false),
('Krishna Janmashtami', '2026-08-05', 'regional', 'Birth anniversary of Lord Krishna', false),
('Dussehra', '2026-09-21', 'national', 'Victory of good over evil', false),
('Gandhi Jayanti', '2026-10-02', 'national', 'Birth anniversary of Mahatma Gandhi', false),
('Diwali', '2026-11-08', 'national', 'Festival of lights', false),
('Guru Nanak Jayanti', '2026-11-04', 'national', 'Birth anniversary of Guru Nanak', false),
('Christmas', '2026-12-25', 'national', 'Birth anniversary of Jesus Christ', false)

ON CONFLICT (date, name) DO NOTHING;

-- Create useful functions for corporate holiday management

-- Function to get holidays by year
CREATE OR REPLACE FUNCTION get_holidays_by_year(year_param INTEGER)
RETURNS TABLE(
    holiday_id UUID,
    holiday_name TEXT,
    holiday_date DATE,
    holiday_type TEXT,
    holiday_description TEXT,
    is_optional_holiday BOOLEAN,
    day_of_week TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        name,
        date::date,
        type,
        description,
        is_optional,
        TO_CHAR(date::date, 'Day') as day_of_week
    FROM holidays
    WHERE EXTRACT(YEAR FROM date::date) = year_param
    ORDER BY date::date;
END;
$$ LANGUAGE plpgsql;

-- Function to get upcoming holidays for planning
CREATE OR REPLACE FUNCTION get_upcoming_holidays(days_ahead INTEGER DEFAULT 90)
RETURNS TABLE(
    holiday_id UUID,
    holiday_name TEXT,
    holiday_date DATE,
    holiday_type TEXT,
    is_optional_holiday BOOLEAN,
    days_until INTEGER,
    falls_on TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        name,
        date::date,
        type,
        is_optional,
        (date::date - CURRENT_DATE)::INTEGER as days_until,
        TO_CHAR(date::date, 'Day') as falls_on
    FROM holidays
    WHERE date::date >= CURRENT_DATE 
    AND date::date <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
    ORDER BY date::date;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a date is a working day
CREATE OR REPLACE FUNCTION is_working_day(check_date DATE)
RETURNS TABLE(
    is_working BOOLEAN,
    reason TEXT,
    holiday_name TEXT
) AS $$
DECLARE
    day_of_week INTEGER;
    holiday_record RECORD;
BEGIN
    -- Get day of week (0 = Sunday, 6 = Saturday)
    day_of_week := EXTRACT(DOW FROM check_date);
    
    -- Check if it's weekend
    IF day_of_week = 0 OR day_of_week = 6 THEN
        RETURN QUERY SELECT false, 'Weekend', NULL::TEXT;
        RETURN;
    END IF;
    
    -- Check if it's a holiday
    SELECT name, is_optional INTO holiday_record
    FROM holidays
    WHERE date::date = check_date
    LIMIT 1;
    
    IF holiday_record IS NOT NULL THEN
        IF holiday_record.is_optional THEN
            RETURN QUERY SELECT true, 'Optional Holiday', holiday_record.name;
        ELSE
            RETURN QUERY SELECT false, 'Holiday', holiday_record.name;
        END IF;
    ELSE
        RETURN QUERY SELECT true, 'Working Day', NULL::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get holiday calendar for a month
CREATE OR REPLACE FUNCTION get_month_calendar(year_param INTEGER, month_param INTEGER)
RETURNS TABLE(
    calendar_date DATE,
    day_name TEXT,
    is_working_day BOOLEAN,
    holiday_name TEXT,
    holiday_type TEXT,
    is_optional BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            DATE(year_param || '-' || month_param || '-01'),
            (DATE(year_param || '-' || month_param || '-01') + INTERVAL '1 month - 1 day')::DATE,
            '1 day'::INTERVAL
        )::DATE as calendar_date
    )
    SELECT 
        ds.calendar_date,
        TO_CHAR(ds.calendar_date, 'Day') as day_name,
        CASE 
            WHEN EXTRACT(DOW FROM ds.calendar_date) IN (0, 6) THEN false
            WHEN h.id IS NOT NULL AND NOT h.is_optional THEN false
            ELSE true
        END as is_working_day,
        h.name as holiday_name,
        h.type as holiday_type,
        h.is_optional
    FROM date_series ds
    LEFT JOIN holidays h ON h.date::date = ds.calendar_date
    ORDER BY ds.calendar_date;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_holidays_by_year(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_holidays(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION is_working_day(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_month_calendar(INTEGER, INTEGER) TO authenticated;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_holidays_year ON holidays(EXTRACT(YEAR FROM date::date));
CREATE INDEX IF NOT EXISTS idx_holidays_month ON holidays(EXTRACT(MONTH FROM date::date));
CREATE INDEX IF NOT EXISTS idx_holidays_type_optional ON holidays(type, is_optional);
CREATE INDEX IF NOT EXISTS idx_holidays_date_lookup ON holidays(date);

-- Create a view for current year corporate holidays
CREATE OR REPLACE VIEW current_year_holidays AS
SELECT 
    id,
    name,
    date,
    type,
    description,
    is_optional,
    CASE 
        WHEN date::date = CURRENT_DATE THEN 'Today'
        WHEN date::date = CURRENT_DATE + 1 THEN 'Tomorrow'
        WHEN date::date > CURRENT_DATE THEN 
            CASE 
                WHEN (date::date - CURRENT_DATE) = 1 THEN 'Tomorrow'
                WHEN (date::date - CURRENT_DATE) <= 7 THEN 'This week'
                WHEN (date::date - CURRENT_DATE) <= 30 THEN 'This month'
                ELSE (date::date - CURRENT_DATE)::TEXT || ' days away'
            END
        ELSE 
            CASE 
                WHEN (CURRENT_DATE - date::date) = 1 THEN 'Yesterday'
                WHEN (CURRENT_DATE - date::date) <= 7 THEN 'Last week'
                WHEN (CURRENT_DATE - date::date) <= 30 THEN 'Last month'
                ELSE (CURRENT_DATE - date::date)::TEXT || ' days ago'
            END
    END as relative_time,
    EXTRACT(DOW FROM date::date) as day_of_week,
    TO_CHAR(date::date, 'Day, DD Month YYYY') as formatted_date
FROM holidays
WHERE EXTRACT(YEAR FROM date::date) = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY date;

-- Grant access to the view
GRANT SELECT ON current_year_holidays TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION get_holidays_by_year(INTEGER) IS 'Get all holidays for a specific year with corporate focus';
COMMENT ON FUNCTION get_upcoming_holidays(INTEGER) IS 'Get upcoming holidays for business planning';
COMMENT ON FUNCTION is_working_day(DATE) IS 'Check if a date is a working day considering weekends and holidays';
COMMENT ON FUNCTION get_month_calendar(INTEGER, INTEGER) IS 'Get complete month calendar with working days and holidays';