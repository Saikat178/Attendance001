import React, { useEffect, useState } from 'react';
import { Building2, Clock, Calendar, Users, FileText, Coffee, CheckCircle, Shield, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onTransition: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onTransition }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [countdown, setCountdown] = useState(3);

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
    
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onTransition();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Rotate through features
    const featureInterval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 2000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(featureInterval);
    };
  }, [onTransition, features.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-10 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white opacity-5 rounded-full animate-pulse delay-1000"></div>
      </div>

      <div className={`text-center transition-all duration-1000 relative z-10 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
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
          
          <div className="space-y-4">
            <button
              onClick={onTransition}
              className="bg-white text-blue-700 px-8 py-3 rounded-lg hover:bg-blue-50 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center mx-auto"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            
            <p className="text-blue-100 text-sm">
              Auto-redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>
          </div>
        </div>
        
        {/* Demo Credentials */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto mt-8">
          <h3 className="text-white font-semibold mb-4">Demo Credentials</h3>
          <div className="space-y-2 text-sm text-blue-100">
            <div className="bg-white/10 rounded p-2">
              <strong>Employee:</strong> john@company.com / password123
            </div>
            <div className="bg-white/10 rounded p-2">
              <strong>Admin:</strong> admin@company.com / admin123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;