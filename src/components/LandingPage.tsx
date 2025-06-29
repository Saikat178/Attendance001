import React, { useEffect, useState } from 'react';
import { Building2, Clock, Calendar, Users, FileText, Coffee, CheckCircle, Shield } from 'lucide-react';

interface LandingPageProps {
  onTransition: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onTransition }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <Clock className="w-12 h-12 text-blue-500" />,
      title: "Real-time Attendance Tracking",
      description: "Check in/out with break management and accurate time tracking"
    },
    {
      icon: <Calendar className="w-12 h-12 text-green-500" />,
      title: "Leave Management",
      description: "Request and approve leaves with comprehensive tracking"
    },
    {
      icon: <Users className="w-12 h-12 text-purple-500" />,
      title: "Employee Management",
      description: "Complete employee profiles with document verification"
    },
    {
      icon: <Coffee className="w-12 h-12 text-orange-500" />,
      title: "Comp-Off System",
      description: "Track and manage compensatory time off for weekend work"
    },
    {
      icon: <Shield className="w-12 h-12 text-red-500" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with comprehensive audit logging"
    }
  ];

  useEffect(() => {
    setIsVisible(true);
    
    // Auto-transition after 5 seconds
    const timer = setTimeout(() => {
      onTransition();
    }, 5000);

    // Rotate through features
    const featureInterval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(featureInterval);
    };
  }, [onTransition, features.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex flex-col items-center justify-center p-4">
      <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="mb-8">
          <div className="flex items-center justify-center mb-6">
            <Building2 className="w-16 h-16 text-white mr-4" />
            <div className="text-left">
              <h1 className="text-5xl font-bold text-white">AttendanceFlow</h1>
              <p className="text-blue-100 text-xl">Smart Attendance Management</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto mb-8">
            <div className="h-32 flex items-center justify-center">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className={`absolute transition-all duration-500 ${
                    index === activeFeature 
                      ? 'opacity-100 transform-none' 
                      : 'opacity-0 translate-x-10'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-blue-100">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center space-x-2 mb-8">
            {features.map((_, index) => (
              <div 
                key={index} 
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === activeFeature ? 'bg-white scale-125' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={onTransition}
            className="bg-white text-blue-700 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Get Started
          </button>
        </div>
        
        <div className="flex justify-center mt-8">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;