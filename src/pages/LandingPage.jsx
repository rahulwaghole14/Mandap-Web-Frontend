import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Building2, 
  Star, 
  ArrowRight, 
  CheckCircle,
  Sparkles,
  Heart,
  Award,
  Globe,
  Smartphone,
  Download
} from 'lucide-react';
import MandapamLogo from '../components/MandapamLogo';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: "Member Management",
      description: "Efficiently manage your association members with detailed profiles and business information."
    },
    {
      icon: <Calendar className="w-8 h-8 text-green-600" />,
      title: "Event Management",
      description: "Organize and track events with attendee management and detailed event information."
    },
    {
      icon: <Building2 className="w-8 h-8 text-purple-600" />,
      title: "Association Management",
      description: "Manage multiple associations with comprehensive administrative tools."
    },
    {
      icon: <Award className="w-8 h-8 text-yellow-600" />,
      title: "Board of Directors",
      description: "Manage BOD members with designated positions and contact information."
    }
  ];

  const stats = [
    { number: "500+", label: "Active Members" },
    { number: "50+", label: "Associations" },
    { number: "100+", label: "Events Organized" },
    { number: "99%", label: "Satisfaction Rate" }
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <MandapamLogo size="medium" showText={false} />
          <button
            onClick={handleLoginClick}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="text-blue-800">
                  MANDAPAM
                </span>
                <br />
                <span className="text-gray-800">Management System</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Streamline your association management with our comprehensive platform. 
                Manage members, events, and associations with ease and efficiency.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={handleLoginClick}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 text-lg font-semibold rounded-full hover:border-blue-600 hover:text-blue-600 transition-all duration-300 transform hover:scale-105">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your associations effectively
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 ${
                  currentFeature === index ? 'ring-2 ring-blue-500 scale-105' : ''
                }`}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative z-10 px-6 py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Join the growing community of successful associations
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-blue-100 text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Why Choose MANDAPAM?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the difference with our comprehensive management solution
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Easy to Use</h3>
              <p className="text-gray-600">Intuitive interface designed for efficiency and ease of use</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Cloud-Based</h3>
              <p className="text-gray-600">Access your data anywhere, anytime with our secure cloud platform</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Reliable Support</h3>
              <p className="text-gray-600">24/7 customer support to help you succeed</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of associations already using MANDAPAM to streamline their management
            </p>
            <button
              onClick={handleLoginClick}
              className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile App Section */}
      <div className="relative z-10 px-6 py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-4">
              <Smartphone className="w-8 h-8 text-blue-600 mr-2" />
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800">
                Download Our Mobile App
              </h2>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Access MANDAPAM on the go with our mobile application
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {/* Play Store */}
            <a
              href="https://play.google.com/store/apps/details?id=com.mandapam.app"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div className="bg-black text-white rounded-2xl p-6 hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-4 min-w-[280px]">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5Z"
                      fill="#EA4335"
                    />
                    <path
                      d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z"
                      fill="#FBBC04"
                    />
                    <path
                      d="M16.81 8.88L14.54 11.15L6.05 2.66L16.81 8.88Z"
                      fill="#34A853"
                    />
                    <path
                      d="M20.16 10.81C20.5 11.08 20.5 11.57 20.16 11.84L16.81 15.12L14.54 12.85L16.81 10.58L20.16 10.81Z"
                      fill="#4285F4"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-300">GET IT ON</div>
                  <div className="text-xl font-bold">Google Play</div>
                </div>
              </div>
            </a>

            {/* App Store */}
            <a
              href="https://apps.apple.com/app/mandapam/id123456789"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div className="bg-black text-white rounded-2xl p-6 hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-4 min-w-[280px]">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"
                      fill="#000000"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-300">Download on the</div>
                  <div className="text-xl font-bold">App Store</div>
                </div>
              </div>
            </a>
          </div>

          {/* Coming Soon Badge */}
          <div className="text-center mt-8">
            <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              <Download className="w-4 h-4 mr-2" />
              Mobile App Coming Soon
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <MandapamLogo size="small" showText={false} className="text-white" />
          </div>
          <p className="text-gray-400">
            © 2024 MANDAPAM Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
