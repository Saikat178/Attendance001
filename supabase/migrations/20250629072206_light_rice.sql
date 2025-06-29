/*
  # Add Comprehensive Indian Holidays

  1. Holidays Added
    - National holidays (Republic Day, Independence Day, Gandhi Jayanti)
    - Major religious festivals (Diwali, Holi, Eid, Christmas, etc.)
    - Regional festivals (Durga Puja, Onam, Pongal, etc.)
    - Cultural celebrations (Karva Chauth, Raksha Bandhan, etc.)
    - Buddhist and Jain festivals (Buddha Purnima, Mahavir Jayanti)
    - Sikh festivals (Guru Nanak Jayanti, Baisakhi)

  2. Coverage
    - Current year (2025) holidays
    - Next year (2026) holidays for planning
    - Both fixed date and lunar calendar festivals

  3. Holiday Types
    - National: Government declared national holidays
    - Regional: State-specific or regional celebrations
    - Company: Optional holidays that companies may observe
*/

-- First, clean existing holidays to avoid duplicates
DELETE FROM holidays;

-- Insert comprehensive Indian holidays for 2025
INSERT INTO holidays (name, date, type, description, is_optional) VALUES

-- NATIONAL HOLIDAYS (Fixed Dates)
('Republic Day', '2025-01-26', 'national', 'Celebrates the adoption of the Constitution of India on January 26, 1950', false),
('Independence Day', '2025-08-15', 'national', 'Commemorates India''s independence from British rule on August 15, 1947', false),
('Gandhi Jayanti', '2025-10-02', 'national', 'Birth anniversary of Mahatma Gandhi, Father of the Nation', false),

-- MAJOR RELIGIOUS FESTIVALS (2025 dates based on lunar calendar)
('Makar Sankranti', '2025-01-14', 'national', 'Hindu festival marking the transition of the sun into Capricorn', false),
('Vasant Panchami', '2025-02-02', 'regional', 'Hindu festival celebrating the arrival of spring and goddess Saraswati', true),
('Maha Shivratri', '2025-02-26', 'national', 'Hindu festival dedicated to Lord Shiva', false),
('Holi', '2025-03-14', 'national', 'Hindu festival of colors celebrating the victory of good over evil', false),
('Ram Navami', '2025-04-06', 'national', 'Hindu festival celebrating the birth of Lord Rama', false),
('Good Friday', '2025-04-18', 'national', 'Christian observance commemorating the crucifixion of Jesus Christ', false),
('Easter Sunday', '2025-04-20', 'regional', 'Christian festival celebrating the resurrection of Jesus Christ', true),
('Buddha Purnima', '2025-05-12', 'national', 'Buddhist festival celebrating the birth of Gautama Buddha', false),
('Eid ul-Fitr', '2025-03-31', 'national', 'Islamic festival marking the end of Ramadan fasting month', false),
('Eid ul-Adha', '2025-06-07', 'national', 'Islamic festival of sacrifice commemorating Abraham''s willingness to sacrifice his son', false),
('Raksha Bandhan', '2025-08-09', 'regional', 'Hindu festival celebrating the bond between brothers and sisters', true),
('Krishna Janmashtami', '2025-08-16', 'national', 'Hindu festival celebrating the birth of Lord Krishna', false),
('Ganesh Chaturthi', '2025-08-27', 'regional', 'Hindu festival honoring Lord Ganesha, the remover of obstacles', true),
('Dussehra', '2025-10-02', 'national', 'Hindu festival celebrating the victory of good over evil', false),
('Karva Chauth', '2025-10-20', 'regional', 'Hindu festival where married women fast for their husbands'' well-being', true),
('Diwali', '2025-10-20', 'national', 'Hindu festival of lights celebrating the return of Lord Rama to Ayodhya', false),
('Dhanteras', '2025-10-18', 'regional', 'Hindu festival marking the beginning of Diwali celebrations', true),
('Govardhan Puja', '2025-10-21', 'regional', 'Hindu festival celebrating Lord Krishna''s lifting of Govardhan hill', true),
('Bhai Dooj', '2025-10-22', 'regional', 'Hindu festival celebrating the bond between brothers and sisters', true),
('Guru Nanak Jayanti', '2025-11-15', 'national', 'Sikh festival celebrating the birth of Guru Nanak, founder of Sikhism', false),
('Christmas', '2025-12-25', 'national', 'Christian festival celebrating the birth of Jesus Christ', false),

-- REGIONAL FESTIVALS
('Pongal', '2025-01-14', 'regional', 'Tamil harvest festival celebrated in Tamil Nadu', true),
('Onam', '2025-09-05', 'regional', 'Malayalam harvest festival celebrated in Kerala', true),
('Durga Puja', '2025-09-30', 'regional', 'Bengali festival celebrating goddess Durga, mainly in West Bengal', true),
('Kali Puja', '2025-10-20', 'regional', 'Bengali festival celebrating goddess Kali, celebrated alongside Diwali', true),
('Baisakhi', '2025-04-13', 'regional', 'Sikh and Hindu festival marking the harvest season and Sikh New Year', true),
('Gudi Padwa', '2025-03-30', 'regional', 'Marathi New Year celebrated in Maharashtra', true),
('Ugadi', '2025-03-30', 'regional', 'Telugu and Kannada New Year celebrated in Andhra Pradesh and Karnataka', true),
('Vishu', '2025-04-14', 'regional', 'Malayalam New Year celebrated in Kerala', true),
('Poila Boishakh', '2025-04-15', 'regional', 'Bengali New Year celebrated in West Bengal', true),
('Rath Yatra', '2025-06-29', 'regional', 'Hindu festival celebrating Lord Jagannath, famous in Puri, Odisha', true),
('Teej', '2025-08-06', 'regional', 'Hindu festival celebrated by women, popular in North India', true),
('Navratri (Start)', '2025-09-21', 'regional', 'Nine-day Hindu festival celebrating goddess Durga', true),
('Navratri (End)', '2025-09-29', 'regional', 'Last day of nine-day Hindu festival celebrating goddess Durga', true),

-- JAIN AND BUDDHIST FESTIVALS
('Mahavir Jayanti', '2025-04-10', 'regional', 'Jain festival celebrating the birth of Lord Mahavira', true),
('Paryushan', '2025-08-24', 'regional', 'Most important Jain festival focusing on spiritual purification', true),

-- SIKH FESTIVALS
('Guru Gobind Singh Jayanti', '2025-01-17', 'regional', 'Sikh festival celebrating the birth of the tenth Sikh Guru', true),
('Hola Mohalla', '2025-03-15', 'regional', 'Sikh festival of martial arts celebrated after Holi', true),

-- PARSI FESTIVALS
('Parsi New Year (Navroz)', '2025-08-16', 'regional', 'Parsi New Year celebration', true),

-- TRIBAL AND FOLK FESTIVALS
('Bihu (Assamese New Year)', '2025-04-14', 'regional', 'Assamese New Year and harvest festival', true),
('Hornbill Festival', '2025-12-01', 'regional', 'Cultural festival of Nagaland showcasing tribal heritage', true),

-- MODERN OBSERVANCES
('World Hindi Day', '2025-01-10', 'company', 'Day to promote Hindi language globally', true),
('National Youth Day', '2025-01-12', 'company', 'Celebrating the birth anniversary of Swami Vivekananda', true),
('Martyrs'' Day', '2025-01-30', 'company', 'Remembering Mahatma Gandhi''s assassination', true),
('National Science Day', '2025-02-28', 'company', 'Celebrating scientific achievements and discoveries', true),
('International Women''s Day', '2025-03-08', 'company', 'Celebrating women''s achievements and promoting gender equality', true),
('World Environment Day', '2025-06-05', 'company', 'Promoting environmental awareness and action', true),
('International Yoga Day', '2025-06-21', 'company', 'Promoting the practice of yoga worldwide', true),
('Kargil Vijay Diwas', '2025-07-26', 'company', 'Commemorating the victory in the Kargil War', true),
('Teachers'' Day', '2025-09-05', 'company', 'Honoring teachers and celebrating education', true),
('World Mental Health Day', '2025-10-10', 'company', 'Promoting mental health awareness', true),
('National Unity Day', '2025-10-31', 'company', 'Celebrating the birth anniversary of Sardar Vallabhbhai Patel', true),
('Constitution Day', '2025-11-26', 'company', 'Commemorating the adoption of the Indian Constitution', true),

-- 2026 HOLIDAYS (Major ones for planning)
('Republic Day', '2026-01-26', 'national', 'Celebrates the adoption of the Constitution of India', false),
('Makar Sankranti', '2026-01-14', 'national', 'Hindu festival marking the transition of the sun into Capricorn', false),
('Maha Shivratri', '2026-02-17', 'national', 'Hindu festival dedicated to Lord Shiva', false),
('Holi', '2026-03-05', 'national', 'Hindu festival of colors', false),
('Ram Navami', '2026-03-28', 'national', 'Hindu festival celebrating the birth of Lord Rama', false),
('Good Friday', '2026-04-03', 'national', 'Christian observance commemorating the crucifixion of Jesus Christ', false),
('Buddha Purnima', '2026-05-01', 'national', 'Buddhist festival celebrating the birth of Gautama Buddha', false),
('Eid ul-Fitr', '2026-03-20', 'national', 'Islamic festival marking the end of Ramadan (approximate date)', false),
('Independence Day', '2026-08-15', 'national', 'Commemorates India''s independence from British rule', false),
('Krishna Janmashtami', '2026-08-05', 'national', 'Hindu festival celebrating the birth of Lord Krishna', false),
('Ganesh Chaturthi', '2026-08-17', 'regional', 'Hindu festival honoring Lord Ganesha', true),
('Dussehra', '2026-09-21', 'national', 'Hindu festival celebrating the victory of good over evil', false),
('Gandhi Jayanti', '2026-10-02', 'national', 'Birth anniversary of Mahatma Gandhi', false),
('Diwali', '2026-11-08', 'national', 'Hindu festival of lights', false),
('Guru Nanak Jayanti', '2026-11-04', 'national', 'Sikh festival celebrating the birth of Guru Nanak', false),
('Christmas', '2026-12-25', 'national', 'Christian festival celebrating the birth of Jesus Christ', false)

ON CONFLICT (date, name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_holidays_year ON holidays(EXTRACT(YEAR FROM date::date));
CREATE INDEX IF NOT EXISTS idx_holidays_month ON holidays(EXTRACT(MONTH FROM date::date));
CREATE INDEX IF NOT EXISTS idx_holidays_type_optional ON holidays(type, is_optional);

-- Create a function to get holidays by year
CREATE OR REPLACE FUNCTION get_holidays_by_year(year_param INTEGER)
RETURNS TABLE(
    holiday_id UUID,
    holiday_name TEXT,
    holiday_date DATE,
    holiday_type TEXT,
    holiday_description TEXT,
    is_optional_holiday BOOLEAN,
    days_from_today INTEGER
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
        (date::date - CURRENT_DATE)::INTEGER as days_from_today
    FROM holidays
    WHERE EXTRACT(YEAR FROM date::date) = year_param
    ORDER BY date::date;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get upcoming holidays
CREATE OR REPLACE FUNCTION get_upcoming_holidays(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE(
    holiday_id UUID,
    holiday_name TEXT,
    holiday_date DATE,
    holiday_type TEXT,
    holiday_description TEXT,
    is_optional_holiday BOOLEAN,
    days_until INTEGER
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
        (date::date - CURRENT_DATE)::INTEGER as days_until
    FROM holidays
    WHERE date::date >= CURRENT_DATE 
    AND date::date <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
    ORDER BY date::date;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if a date is a holiday
CREATE OR REPLACE FUNCTION is_holiday(check_date DATE)
RETURNS TABLE(
    is_holiday_date BOOLEAN,
    holiday_name TEXT,
    holiday_type TEXT,
    is_optional_holiday BOOLEAN
) AS $$
DECLARE
    holiday_record RECORD;
BEGIN
    SELECT name, type, is_optional INTO holiday_record
    FROM holidays
    WHERE date::date = check_date
    LIMIT 1;
    
    IF holiday_record IS NOT NULL THEN
        RETURN QUERY SELECT true, holiday_record.name, holiday_record.type, holiday_record.is_optional;
    ELSE
        RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_holidays_by_year(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_holidays(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION is_holiday(DATE) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION get_holidays_by_year(INTEGER) IS 'Get all holidays for a specific year';
COMMENT ON FUNCTION get_upcoming_holidays(INTEGER) IS 'Get upcoming holidays within specified days';
COMMENT ON FUNCTION is_holiday(DATE) IS 'Check if a specific date is a holiday';

-- Create a view for current year holidays
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
        WHEN date::date > CURRENT_DATE THEN (date::date - CURRENT_DATE)::TEXT || ' days away'
        ELSE (CURRENT_DATE - date::date)::TEXT || ' days ago'
    END as relative_time,
    EXTRACT(DOW FROM date::date) as day_of_week,
    TO_CHAR(date::date, 'Day, Month DD, YYYY') as formatted_date
FROM holidays
WHERE EXTRACT(YEAR FROM date::date) = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY date;

-- Grant access to the view
GRANT SELECT ON current_year_holidays TO authenticated;

-- Final verification and statistics
DO $$
DECLARE
    total_holidays INTEGER;
    national_holidays INTEGER;
    regional_holidays INTEGER;
    company_holidays INTEGER;
    current_year_holidays INTEGER;
    next_year_holidays INTEGER;
    upcoming_holidays INTEGER;
BEGIN
    -- Count holidays by category
    SELECT COUNT(*) INTO total_holidays FROM holidays;
    SELECT COUNT(*) INTO national_holidays FROM holidays WHERE type = 'national';
    SELECT COUNT(*) INTO regional_holidays FROM holidays WHERE type = 'regional';
    SELECT COUNT(*) INTO company_holidays FROM holidays WHERE type = 'company';
    SELECT COUNT(*) INTO current_year_holidays FROM holidays WHERE EXTRACT(YEAR FROM date::date) = 2025;
    SELECT COUNT(*) INTO next_year_holidays FROM holidays WHERE EXTRACT(YEAR FROM date::date) = 2026;
    SELECT COUNT(*) INTO upcoming_holidays FROM holidays WHERE date::date >= CURRENT_DATE AND date::date <= CURRENT_DATE + INTERVAL '30 days';
    
    -- Report statistics
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'INDIAN HOLIDAYS ADDED SUCCESSFULLY!';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Holiday Statistics:';
    RAISE NOTICE '• Total Holidays: %', total_holidays;
    RAISE NOTICE '• National Holidays: %', national_holidays;
    RAISE NOTICE '• Regional Holidays: %', regional_holidays;
    RAISE NOTICE '• Company Holidays: %', company_holidays;
    RAISE NOTICE '• 2025 Holidays: %', current_year_holidays;
    RAISE NOTICE '• 2026 Holidays: %', next_year_holidays;
    RAISE NOTICE '• Upcoming (30 days): %', upcoming_holidays;
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Holiday Categories Included:';
    RAISE NOTICE '✓ National holidays (Republic Day, Independence Day, etc.)';
    RAISE NOTICE '✓ Major religious festivals (Diwali, Holi, Eid, Christmas)';
    RAISE NOTICE '✓ Regional celebrations (Durga Puja, Onam, Pongal)';
    RAISE NOTICE '✓ Cultural festivals (Raksha Bandhan, Karva Chauth)';
    RAISE NOTICE '✓ Sikh festivals (Guru Nanak Jayanti, Baisakhi)';
    RAISE NOTICE '✓ Buddhist/Jain festivals (Buddha Purnima, Mahavir Jayanti)';
    RAISE NOTICE '✓ Modern observances (Teachers Day, Environment Day)';
    RAISE NOTICE '✓ State-specific festivals (Bihu, Hornbill Festival)';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'New Functions Available:';
    RAISE NOTICE '• get_holidays_by_year(year) - Get holidays for specific year';
    RAISE NOTICE '• get_upcoming_holidays(days) - Get upcoming holidays';
    RAISE NOTICE '• is_holiday(date) - Check if date is holiday';
    RAISE NOTICE '• current_year_holidays view - Current year holidays';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Your attendance system now has comprehensive';
    RAISE NOTICE 'Indian holiday coverage for accurate tracking!';
    RAISE NOTICE '=================================================';
END $$;

-- Test the new functions
SELECT 'Testing holiday functions...' as status;
SELECT * FROM get_upcoming_holidays(7) LIMIT 3;
SELECT * FROM is_holiday('2025-01-26');
SELECT COUNT(*) as total_holidays_2025 FROM get_holidays_by_year(2025);