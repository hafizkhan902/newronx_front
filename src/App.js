import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import './index.css';
import StartupValidatorPage from './StartupValidatorPage';
import LoginPage from './LoginPage';
import PublicProfile from './components/brainstorming/sections/PublicProfile';
import { useUser } from './UserContext';
import { ThemeProvider } from './ThemeContext';
import { HeaderAd, FooterAd, InContentAd } from './components/AdWrapper';
import PublicIdeaView from './components/PublicIdeaView';
import UserAvatar from './components/UserAvatar';

const tools = [
  {
    name: 'Code Evaluator',
    description: 'Submit code and get AI-powered feedback to improve your skills.',
    path: '/code-evaluator',
  },
  {
    name: 'Design Critique',
    description: 'Upload UI/UX designs for instant, actionable AI review.',
    path: '/design-critique',
  },
  {
    name: 'Startup Validator',
    description: 'Validate your app ideas, share with the community, and form a team.',
    path: '/startup-validator',
  },
  {
    name: 'Learning Assistant',
    description: 'Ask questions and get code, diagrams, and explanations.',
    path: '/learning-assistant',
  },
  {
    name: 'Career Path Builder',
    description: 'Let AI build a custom roadmap for your software journey.',
    path: '/career-path-builder',
  },
  {
    name: 'Voice-to-Project',
    description: 'Convert voice notes into structured project summaries.',
    path: '/voice-to-project',
  },
  {
    name: 'Portfolio Builder',
    description: 'Collect and export your best work into a stunning portfolio.',
    path: '/portfolio-builder',
  },
  {
    name: 'AI Chat Mentor',
    description: 'Chat with an AI tutor and coach for guidance and support.',
    path: '/ai-chat-mentor',
  },
];

const routineCard = (
  <div className="max-w-3xl mx-auto mb-12 mt-16">
    <Link to="/routine-management" className="block bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 rounded-3xl shadow-xl border-2 border-blue-600 hover:scale-105 transition-transform p-8 text-center relative overflow-hidden">
      <div className="flex flex-col items-center justify-center">
        <div className="mb-4">
          <svg className="w-16 h-16 text-blue-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 48 48">
            <rect x="8" y="12" width="32" height="28" rx="6" className="stroke-blue-400" strokeWidth="2.5" fill="#1e293b"/>
            <rect x="14" y="18" width="20" height="8" rx="2" className="stroke-blue-300" strokeWidth="2" fill="#334155"/>
            <rect x="14" y="30" width="12" height="4" rx="2" className="stroke-blue-300" strokeWidth="2" fill="#334155"/>
          </svg>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow">Routine Management</h2>
        <p className="text-blue-100 text-base md:text-lg mb-4 max-w-xl mx-auto">
          Stay on top of your studies, projects, and self-care. Our Routine Management tool helps you plan, track, and optimize your daily habits—so you can focus on what matters most.
        </p>
        <span className="inline-block bg-blue-600 text-white font-semibold px-6 py-2 rounded-full shadow hover:bg-blue-700 transition">Start Managing Your Routine</span>
      </div>
      <div className="absolute -top-8 -right-8 opacity-20 pointer-events-none select-none">
        <svg width="120" height="120" fill="none" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" stroke="#3b82f6" strokeWidth="10" fill="none" />
        </svg>
      </div>
    </Link>
  </div>
);

function UseCaseSection() {
  return (
    <section className="relative w-full min-h-[420px] flex items-center justify-center overflow-hidden rounded-3xl shadow-xl bg-gray-900 my-8">
      {/* Blurred SVG Background - covers entire section */}
      <div className="absolute inset-0 w-full h-full z-0">
        <svg width="100%" height="100%" viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-cover blur-2xl opacity-40">
          <ellipse cx="720" cy="300" rx="600" ry="220" fill="#1e293b" />
          <rect x="420" y="180" width="600" height="240" rx="60" fill="#334155" stroke="#3b82f6" strokeWidth="8" />
          <rect x="520" y="240" width="180" height="60" rx="18" fill="#3b82f6" />
          <rect x="800" y="240" width="180" height="60" rx="18" fill="#a78bfa" />
          <rect x="520" y="340" width="460" height="40" rx="12" fill="#64748b" />
          <circle cx="1100" cy="200" r="40" fill="#22d3ee" />
          <circle cx="420" cy="420" r="32" fill="#f472b6" />
          <circle cx="1100" cy="480" r="24" fill="#facc15" />
        </svg>
      </div>
      {/* Foreground Content */}
      <div className="relative z-10 w-full md:w-2/3 mx-auto px-4 py-16">
        <h2 className="text-3xl font-extrabold text-white mb-8 text-center">How CodeMentorAI Empowers You</h2>
        <ul className="space-y-8">
          <li className="flex items-start gap-4">
            <span className="bg-blue-700 text-white rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            </span>
            <div>
              <h3 className="text-xl font-bold text-blue-400">Supercharge Your Workflow</h3>
              <p className="text-gray-300">Turn ideas into action. Brainstorm, code, and iterate faster—AI tools help you break through blockers and keep your momentum high.</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <span className="bg-green-700 text-white rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </span>
            <div>
              <h3 className="text-xl font-bold text-green-400">Build, Learn, and Grow</h3>
              <p className="text-gray-300">Validate ideas, manage your routine, and build a portfolio. Learn by doing, get feedback in real time, and showcase your progress.</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <span className="bg-purple-700 text-white rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
            </span>
            <div>
              <h3 className="text-xl font-bold text-purple-400">Stay Organized</h3>
              <p className="text-gray-300">Routine management and smart planning tools help you balance study, projects, and self-care—so you can focus on what matters most.</p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-20">
      <h2 className="text-3xl font-extrabold text-white mb-12 text-center">AI Subscription Pricing</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Free for DIU Students */}
        <div className="bg-gradient-to-br from-green-900 via-green-800 to-gray-900 border-2 border-green-500 rounded-2xl shadow-lg p-8 flex flex-col items-center text-center">
          <span className="inline-block bg-green-600 text-white text-xs font-bold px-4 py-1 rounded-full mb-4">Best for DIU Students</span>
          <h3 className="text-2xl font-bold text-green-300 mb-2">Chargeless</h3>
          <p className="text-lg text-green-100 mb-4">For Daffodil International University students</p>
          <p className="text-sm text-green-200 mb-6">Sign up with your university email (<span className="font-mono">@diu.edu.bd</span>) to enjoy all AI tools for free.</p>
          <span className="text-4xl font-extrabold text-green-400 mb-2">$0</span>
          <span className="text-green-200 text-sm mb-6">per month</span>
          <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-full transition">Get Started</button>
        </div>
        {/* Free Limited Access Plan */}
        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 border-2 border-gray-600 rounded-2xl shadow-lg p-8 flex flex-col items-center text-center">
          <span className="inline-block bg-gray-700 text-white text-xs font-bold px-4 py-1 rounded-full mb-4">Free Plan</span>
          <h3 className="text-2xl font-bold text-gray-200 mb-2">Limited Access</h3>
          <p className="text-lg text-gray-100 mb-4">For anyone, no university email required</p>
          <ul className="text-gray-300 text-sm mb-6 space-y-1">
            <li>✔️ Access to selected AI tools</li>
            <li>✔️ 10 code evaluations/month</li>
            <li>✔️ Community support</li>
            <li>❌ No portfolio export</li>
            <li>❌ No priority support</li>
          </ul>
          <span className="text-4xl font-extrabold text-gray-100 mb-2">$0</span>
          <span className="text-gray-400 text-sm mb-6">per month</span>
          <button className="bg-gray-700 hover:bg-gray-800 text-white font-semibold px-6 py-2 rounded-full transition">Try for Free</button>
        </div>
        {/* Standard Plan */}
        <div className="bg-gray-900 border-2 border-blue-700 rounded-2xl shadow-lg p-8 flex flex-col items-center text-center">
          <span className="inline-block bg-blue-700 text-white text-xs font-bold px-4 py-1 rounded-full mb-4">Standard</span>
          <h3 className="text-2xl font-bold text-blue-300 mb-2">Standard Access</h3>
          <p className="text-lg text-blue-100 mb-4">For students and learners worldwide</p>
          <ul className="text-blue-200 text-sm mb-6 space-y-1">
            <li>✔️ Access to all AI tools</li>
            <li>✔️ 100 code evaluations/month</li>
            <li>✔️ Community support</li>
          </ul>
          <span className="text-4xl font-extrabold text-blue-400 mb-2">$9</span>
          <span className="text-blue-200 text-sm mb-6">per month</span>
          <button className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2 rounded-full transition">Start Standard</button>
        </div>
        {/* Pro Plan */}
        <div className="bg-gradient-to-br from-purple-900 via-gray-900 to-blue-900 border-2 border-purple-500 rounded-2xl shadow-lg p-8 flex flex-col items-center text-center">
          <span className="inline-block bg-purple-700 text-white text-xs font-bold px-4 py-1 rounded-full mb-4">Pro</span>
          <h3 className="text-2xl font-bold text-purple-300 mb-2">Pro Access</h3>
          <p className="text-lg text-purple-100 mb-4">For power users and professionals</p>
          <ul className="text-purple-200 text-sm mb-6 space-y-1">
            <li>✔️ Unlimited AI tool usage</li>
            <li>✔️ Priority support</li>
            <li>✔️ Early access to new features</li>
          </ul>
          <span className="text-4xl font-extrabold text-purple-400 mb-2">$19</span>
          <span className="text-purple-200 text-sm mb-6">per month</span>
          <button className="bg-purple-700 hover:bg-purple-800 text-white font-semibold px-6 py-2 rounded-full transition">Go Pro</button>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="w-full flex justify-center py-16 relative mt-8">
      {/* Blurry Glassmorphic Background */}
      <div className="absolute inset-0 w-full h-full z-0 flex items-center justify-center">
        <div className="w-full h-full bg-gradient-to-r from-blue-900/60 via-purple-900/60 to-gray-900/60 backdrop-blur-xl rounded-3xl"></div>
      </div>
      <div className="max-w-2xl w-full flex flex-col items-center text-center px-4 relative z-10">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 drop-shadow">Start Building Smarter Today.</h2>
        <p className="text-lg text-blue-100 mb-8">Get access to all AI tools for free — no credit card required.</p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold px-10 py-4 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-50">
          Get Started Now
        </button>
      </div>
    </section>
  );
}

function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <span className="text-2xl font-bold tracking-tight text-white">CodeMentorAI</span>
        <span className="text-sm text-gray-400">Empowering Software Engineering Students</span>
      </nav>
      {/* Use Case Section */}
      <UseCaseSection />
      {/* Hero Section */}
      <header className="py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white">Unlock Your Coding Potential</h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400">
          CodeMentorAI is your all-in-one platform for learning, building, and thinking creatively. Explore modular AI tools designed for software engineering students—each crafted to help you grow, innovate, and succeed.
        </p>
      </header>
      {/* Tool Cards Grid */}
      <main className="flex-1 px-4 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {tools.map((tool) => (
            <Link
              key={tool.name}
              to={tool.path}
              className="bg-gray-900 border border-gray-800 rounded-xl shadow hover:shadow-lg hover:border-blue-500 transition p-6 flex flex-col cursor-pointer group"
            >
              <h2 className="text-xl font-semibold mb-2 text-white group-hover:text-blue-400 transition">{tool.name}</h2>
              <p className="text-gray-400 text-sm flex-1">{tool.description}</p>
              <span className="mt-4 text-blue-500 text-xs font-medium group-hover:underline">Open Tool →</span>
            </Link>
          ))}
        </div>
        {/* Routine Management Card (moved below the grid) */}
        {routineCard}
        
        {/* In-Content Ad */}
        <InContentAd />
        
        {/* Pricing Section */}
        <PricingSection />
        {/* CTA Section */}
        <CTASection />
      </main>
    </div>
  );
}

function Placeholder({ name }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">{name}</h1>
      <p className="text-gray-400 mb-8">This is the {name} page. Tool functionality coming soon.</p>
      <Link to="/home" className="text-blue-500 hover:underline">← Back to Home</Link>
    </div>
  );
}

// Modular subcomponents for public profile
function PublicAvatarStatus({ avatar, status, fullName, userId, isMentor, isInvestor }) {
  const statusColors = {
    active: 'bg-green-500',
    busy: 'bg-yellow-500',
    offline: 'bg-gray-400',
  };
  const statusLabels = {
    active: 'Active',
    busy: 'Busy',
    offline: 'Offline',
  };
  return (
    <div className="relative inline-block mb-4">
      <UserAvatar
        userId={userId}
        avatarUrl={avatar}
        size={96}
        isMentor={isMentor}
        isInvestor={isInvestor}
      />
      <span className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white ${statusColors[status] || 'bg-gray-300'}`}></span>
    </div>
  );
}

function PublicSkills({ skills }) {
  if (!skills || skills.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="text-xs text-gray-500 mb-1">Skills</div>
      <div className="flex flex-wrap gap-2 justify-center">
        {skills.map((skill, idx) => (
          <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium">{skill}</span>
        ))}
      </div>
    </div>
  );
}

function PublicRoles({ roles }) {
  if (!roles || roles.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="text-xs text-gray-500 mb-1">Interested Roles</div>
      <div className="flex flex-wrap gap-2 justify-center">
        {roles.map((role, idx) => (
          <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">{role}</span>
        ))}
      </div>
    </div>
  );
}

function PublicSocialLinks({ socialLinks }) {
  if (!socialLinks || socialLinks.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="text-xs text-gray-500 mb-1">Social Links</div>
      <div className="flex flex-wrap gap-2 justify-center">
        {socialLinks.map((link, idx) => (
          <a
            key={idx}
            href={link.value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-xs bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1"
          >
            <span className="font-medium">{link.type}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function App() {
  const { user, setUser } = useUser();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // Use UserContext to determine authentication status
  const isAuthenticated = !!user;

  // Handle successful login
  const handleLogin = (loginData) => {
    console.log('🔄 App - handleLogin called with:', loginData);
    // If login returns user data, set it in context
    if (loginData && (loginData.user || loginData._id)) {
      const userData = loginData.user || loginData;
      console.log('🔄 App - Setting user in context:', userData);
      setUser(userData);
      setIsAuthChecking(false);
      console.log('🔄 App - User context updated, should trigger re-render');
    }
  };

  // Check authentication status and fetch user profile on app startup
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('🔍 App - Checking authentication status and fetching user profile...');
        const response = await fetch('/api/users/profile', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('🔍 App - Profile check response status:', response.status);
        
        if (response.ok) {
          const profileData = await response.json();
          const userData = profileData.user || profileData;
          console.log('🔍 App - Profile check successful:', userData);
          if (userData && !user) {
            setUser(userData);
            console.log('🔍 App - User context updated from profile check');
          }
        } else {
          console.log('🔍 App - Profile check failed - user not authenticated');
        }
      } catch (error) {
        console.log('🔍 App - Profile check error:', error);
      } finally {
        setIsAuthChecking(false);
      }
    };

    // Only check if we don't have user data
    if (!user) {
      checkAuthStatus();
    } else {
      console.log('🔍 App - User already in context, skipping profile check');
      setIsAuthChecking(false);
    }
  }, [user, setUser]);

  // Monitor authentication state changes for debugging
  useEffect(() => {
    console.log('🔄 App - Authentication state changed:', { isAuthenticated, hasUser: !!user });
    
    // Force re-render when authentication state changes
    if (isAuthenticated && user) {
      console.log('🎯 App - User authenticated, should show StartupValidatorPage');
    }
  }, [isAuthenticated, user]);

  // OAuth callback handling
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const loginStatus = urlParams.get('login');
      const provider = urlParams.get('provider');
      const error = urlParams.get('error');
      
      console.log('🔍 App - OAuth callback check:', { loginStatus, provider, error });
      
      if (loginStatus === 'success' && provider === 'google') {
        console.log('✅ App - Google OAuth successful!');
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Fetch user profile after successful OAuth
        try {
          const response = await fetch('/api/users/profile', {
            credentials: 'include'
          });
          
          if (response.ok) {
            const userData = await response.json();
            const profileData = userData.user || userData;
            console.log('✅ App - OAuth user profile fetched:', profileData);
            setUser(profileData);
          } else {
            console.error('❌ App - Failed to fetch user profile after OAuth');
          }
        } catch (error) {
          console.error('❌ App - Error fetching user profile after OAuth:', error);
        }
      }
      
      // Handle OAuth errors
      if (error === 'google_auth_failed') {
        console.error('❌ App - Google OAuth failed');
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        // You could show an error message here if needed
      }
      
      // Handle specific validation errors
      if (error === 'validation_error' || error === 'lastName_required') {
        console.error('❌ App - Google OAuth validation error: lastName required');
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        // Show user-friendly error message
        alert('Google login failed due to missing information. Please try manual registration or contact support.');
      }
    };

    handleOAuthCallback();
  }, [setUser]);

  return (
    <ThemeProvider>
      <Router>
        <div className="app-container">
          {/* Header Ad */}
          <HeaderAd />
          
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed top-0 right-0 bg-black text-white p-2 text-xs z-50">
              Auth: {isAuthenticated ? '✅' : '❌'} | User: {user ? 'Yes' : 'No'}
            </div>
          )}
          
          <Routes>
            <Route 
              path="/" 
              element={
                (() => {
                  console.log('🔄 App - Rendering route for path "/" with isAuthenticated:', isAuthenticated, 'isAuthChecking:', isAuthChecking);
                  
                  // Show loading screen while checking authentication
                  if (isAuthChecking) {
                    return (
                      <div className="min-h-screen flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-gray-600 text-sm">Loading...</p>
                        </div>
                      </div>
                    );
                  }
                  
                  return isAuthenticated ? (
                    <StartupValidatorPage />
                  ) : (
                    <LoginPage onLogin={handleLogin} />
                  );
                })()
              } 
            />
            <Route path="/home" element={<Home />} />
            {tools.map((tool) => (
              <Route
                key={tool.path}
                path={tool.path}
                element={<Placeholder name={tool.name} />}
              />
            ))}
            <Route path="/routine-management" element={<Placeholder name="Routine Management" />} />
            <Route path="/profile/:userId" element={<PublicProfileWrapper />} />
            <Route path="/ideas/public/:ideaId" element={<PublicIdeaView />} />
          </Routes>
          
          {/* Footer Ad */}
          <FooterAd />
        </div>
      </Router>
    </ThemeProvider>
  );
}

// Wrapper to extract userId param and pass to PublicProfile
function PublicProfileWrapper() {
  const { userId } = useParams();
  return <PublicProfile userId={userId} />;
}

export default App;
