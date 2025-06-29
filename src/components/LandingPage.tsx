import React, { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';

interface LandingPageProps {
  onTransition: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onTransition }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      onTransition();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onTransition]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
      <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="mb-8">
          <Building2 className="w-24 h-24 text-white mx-auto mb-4 animate-pulse" />
          <h1 className="text-4xl font-bold text-white mb-2">AttendanceFlow</h1>
          <p className="text-blue-100 text-lg">Professional Attendance Management</p>
        </div>
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;