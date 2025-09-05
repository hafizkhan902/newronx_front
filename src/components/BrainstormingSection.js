import React, { useRef, useState, useEffect } from 'react';
import BrainstormPost from './BrainstormPost';
import './genie.css'; // Import the custom animation CSS
import FabMenu from './brainstorming/fab/FabMenu';
import InboxModal from './brainstorming/inbox/InboxModal';
import NotificationsModal from './brainstorming/notifications/NotificationsModal';
import FeedSection from './brainstorming/sections/FeedSection';

import NewPostSection from './brainstorming/sections/NewPostSection';
import SearchSection from './brainstorming/sections/SearchSection';
import FeatureTabs from './brainstorming/sections/FeatureTabs';
import ApproachModal from './brainstorming/sections/ApproachModal';
import ProfileSection from './brainstorming/sections/ProfileSection';
import SettingsSection from './brainstorming/sections/SettingsSection';
import InboxSection from './brainstorming/sections/InboxSection';
import PublicProfile from './brainstorming/sections/PublicProfile';
import { useUser } from '../UserContext';
import './brainstorming/sections/profile.css';

const initialMockPosts = [
  {
    id: 1,
    title: 'AI-powered Study Buddy',
    description: 'A chatbot that helps students plan, track, and optimize their study routines with personalized AI feedback.',
    author: { name: 'Ayesha Rahman', avatar: 'A' },
    time: '2h ago',
    tags: ['AI', 'Productivity', 'EdTech'],
    appreciateCount: 8,
    proposeCount: 2,
    suggestCount: 3,
    targetAudience: 'University students, self-learners',
    marketAlternatives: 'Notion, Todoist, Google Calendar',
    problemStatement: 'Students struggle to manage and optimize their study routines effectively.',
    uniqueValue: 'AI-driven personalized feedback and habit tracking.',
  },
  {
    id: 2,
    title: 'Remote Team Finder',
    description: 'A platform to match students with complementary skills for remote hackathons and startup projects.',
    author: { name: 'Tanvir Hasan', avatar: 'T' },
    time: '5h ago',
    tags: ['Collaboration', 'Remote', 'Teamwork'],
    appreciateCount: 12,
    proposeCount: 1,
    suggestCount: 5,
    targetAudience: 'Hackathon participants, remote students',
    marketAlternatives: 'Twine, Slack, Discord',
    problemStatement: 'It’s hard to find the right teammates for remote projects.',
    uniqueValue: 'Skill-based matching and instant team formation.',
  },
  {
    id: 3,
    title: 'Portfolio Snap',
    description: 'Instantly generate a beautiful, shareable portfolio from your GitHub and project links.',
    author: { name: 'Sara Islam', avatar: 'S' },
    time: '1d ago',
    tags: ['Portfolio', 'Web', 'Showcase'],
    appreciateCount: 20,
    proposeCount: 3,
    suggestCount: 7,
    targetAudience: 'Developers, designers, freelancers',
    marketAlternatives: 'Fiverr, Behance, LinkedIn',
    problemStatement: 'Showcasing project work is time-consuming and often looks unprofessional.',
    uniqueValue: 'One-click portfolio generation from real project data.',
  },
];

const features = [
  {
    key: 'feed',
    label: 'Feed',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="4" rx="2"/><rect x="4" y="14" width="16" height="4" rx="2"/></svg>
    ),
  },
  {
    key: 'new',
    label: 'New Post',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
    ),
  },
  {
    key: 'inbox',
    label: 'Inbox',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
      </svg>
    ),
  },
  {
    key: 'search',
    label: 'Search',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
    ),
  },

  {
    key: 'profile',
    label: 'Profile',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M2 20c0-4 8-6 10-6s10 2 10 6"/></svg>
    ),
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8c.14.31.22.65.22 1v.09A1.65 1.65 0 0 0 21 12c0 .35-.08.69-.22 1z"/></svg>
    ),
  },
];

function BrainstormingSection({ hideHeader }) {
  const [showModal, setShowModal] = useState(false);
  const [activeFeature, setActiveFeature] = useState('feed');
  const [posts, setPosts] = useState(initialMockPosts);
  const [phase, setPhase] = useState('main'); // 'main' or 'details'
  const [menuOpen, setMenuOpen] = useState(null); // post id for which menu is open
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [pitch, setPitch] = useState('');
  const [pdf, setPdf] = useState(null);
  // Add missing state hooks
  const [form, setForm] = useState({
    title: '',
    description: '',
    targetAudience: '',
    marketAlternatives: '',
    problemStatement: '',
    uniqueValue: '',
  });
  const [showFields, setShowFields] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [privacy, setPrivacy] = useState('Public');
  const [approachModal, setApproachModal] = useState({ open: false, post: null });
  const [fabOpen, setFabOpen] = useState(false);
  // Add state for notification and approaches modals
  const [showNotifications, setShowNotifications] = useState(false);
  const [showApproaches, setShowApproaches] = useState(false);
  // Remove genieStyle and genieAnim state and use a simple showGenie state
  const [showGenie, setShowGenie] = useState(false);
  const [genieClosing, setGenieClosing] = useState(false);
  const [showMentorInterest, setShowMentorInterest] = useState(false); // Add this if not present
  const [activeSection, setActiveSection] = useState('feed');
  const [publicProfileUserId, setPublicProfileUserId] = useState(null);
  const { user, setUser } = useUser();

  // Load user context globally when app starts
  useEffect(() => {
    const loadUserContext = async () => {
      if (!user) {
        console.log('[BrainstormingSection] Loading user context...');
        try {
          const res = await fetch(`/api/users/profile`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (res.ok) {
            const data = await res.json();
            const userData = data.user ? data.user : data;
            console.log('[BrainstormingSection] User context loaded:', userData);
            setUser(userData);
          } else {
            console.log('[BrainstormingSection] User not authenticated or API unavailable, using mock user');
            // Set a mock user for demo purposes
            const mockUser = {
              _id: 'currentUser',
              name: 'You',
              fullName: 'Demo User',
              email: 'demo@example.com',
              avatar: undefined
            };
            setUser(mockUser);
          }
        } catch (err) {
          console.log('[BrainstormingSection] Error loading user context, using mock user:', err.message);
          // Set a mock user for demo purposes
          const mockUser = {
            _id: 'currentUser',
            name: 'You',
            fullName: 'Demo User',
            email: 'demo@example.com',
            avatar: undefined
          };
          setUser(mockUser);
        }
      }
    };

    loadUserContext();
  }, [user, setUser]);

  // Mock data for notifications and approaches
  const mockNotifications = [
    { id: 1, text: 'Alice appreciated your idea.' },
    { id: 2, text: 'Bob proposed a new feature for your post.' },
    { id: 3, text: 'Your idea was added to Trending.' },
  ];
  const mockApproaches = [
    { id: 1, from: 'Charlie', message: 'Interested in joining your team!' },
    { id: 2, from: 'Dana', message: 'Can we collaborate on your project?' },
  ];



  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(URL.createObjectURL(e.target.files[0]));
      setAddMenuOpen(false);
    }
  };
  const handlePitchChange = (e) => {
    setPitch(e.target.value);
  };
  const handlePdfChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPdf(e.target.files[0].name);
      setAddMenuOpen(false);
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleShowField = (field) => {
    setShowFields((prev) => {
      // Only show the clicked field, hide others
      const newState = {};
      newState[field] = !prev[field];
      return newState;
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setPosts([
        {
          id: Date.now(),
          title: form.title,
          description: form.description,
          author: { name: 'You', avatar: 'Y' },
          time: 'Just now',
          tags: [],
          appreciateCount: 0,
          proposeCount: 0,
          suggestCount: 0,
          targetAudience: form.targetAudience,
          marketAlternatives: form.marketAlternatives,
          problemStatement: form.problemStatement,
          uniqueValue: form.uniqueValue,
        },
        ...posts,
      ]);
      setForm({
        title: '',
        description: '',
        targetAudience: '',
        marketAlternatives: '',
        problemStatement: '',
        uniqueValue: '',
      });
      setShowFields({});
      setActiveFeature('feed');
      setPhase('main');
      setSubmitting(false);
    }, 500);
  };

  const handleDeletePost = (id) => {
    setPosts(posts.filter(p => p.id !== id));
    setMenuOpen(null);
  };

  // Feature icon row for the creative post UI
  const postFeatures = [
    {
      key: 'targetAudience',
      label: 'Audience',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M2 20c0-4 8-6 10-6s10 2 10 6"/></svg>,
      placeholder: 'Who is this for?'
    },
    {
      key: 'marketAlternatives',
      label: 'Alternatives',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="7" height="7" rx="2" /><rect x="14" y="7" width="7" height="7" rx="2" /><rect x="3" y="17" width="7" height="4" rx="2" /><rect x="14" y="17" width="7" height="4" rx="2" /></svg>,
      placeholder: 'What are the alternatives?'
    },
    {
      key: 'problemStatement',
      label: 'Problem',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" /></svg>,
      placeholder: 'What problem does it solve?'
    },
    {
      key: 'uniqueValue',
      label: 'Unique',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07l-1.41 1.41M6.34 17.66l-1.41 1.41m12.02 0l-1.41-1.41M6.34 6.34L4.93 4.93" /></svg>,
      placeholder: 'What makes it unique?'
    },
  ];

  // Add state and ref for genie effect
  const inboxBtnRef = useRef(null);

  // When showApproaches opens, trigger the genie animation
  useEffect(() => {
    if (showApproaches) {
      setShowGenie(true);
      setGenieClosing(false);
    } else if (!showApproaches && showGenie) {
      // If closing, trigger close animation
      setGenieClosing(true);
      setTimeout(() => {
        setShowGenie(false);
        setGenieClosing(false);
      }, 600); // match animation duration
    }
    // eslint-disable-next-line
  }, [showApproaches]);

  useEffect(() => {
    // Try to keep loggedInUserId in sync with localStorage
    const storedId = localStorage.getItem('userId');
    if (storedId && storedId !== user?._id) {
      // setLoggedInUserId(storedId); // This line is no longer needed
    }
  }, [user?._id]);

  useEffect(() => {
    // console.log('Comparing publicProfileUserId:', publicProfileUserId, 'loggedInUserId:', user?._id);
    if (
      activeSection === 'publicProfile' &&
      publicProfileUserId &&
      user?._id &&
      String(publicProfileUserId) === String(user?._id)
    ) {
      setActiveSection('profile');
      setPublicProfileUserId(null);
    }
  }, [activeSection, publicProfileUserId, user?._id]);

  const handleAvatarClick = (userId) => {
    console.log('[BrainstormingSection] Avatar clicked:', {
      clickedUserId: userId,
      loggedInUserId: user?._id,
      userObject: user,
      comparison: String(userId) === String(user?._id)
    });
    
    // Always navigate to profile section, but pass the public userId if different
    setActiveFeature('profile');
    
    if (user && String(userId) === String(user._id)) {
      console.log('[BrainstormingSection] Same user detected - showing private profile');
      setPublicProfileUserId(null);
    } else {
      console.log('[BrainstormingSection] Different user - will show public profile in profile section');
      setPublicProfileUserId(userId);
    }
  };

  // State for auto-opening specific chat
  const [targetChatId, setTargetChatId] = useState(null);

  const handleNavigateToInbox = (chatId) => {
    console.log('[BrainstormingSection] Navigating to inbox with chatId:', chatId);
    
    // Store the chatId to auto-open
    setTargetChatId(chatId);
    
    // Switch to inbox feature
    setActiveFeature('inbox');
  };

  // Guard: If trying to show public profile for logged-in user, show private profile instead
  if (
    activeSection === 'publicProfile' &&
    publicProfileUserId &&
    user?._id &&
    String(publicProfileUserId).trim() === String(user._id).trim()
  ) {
    console.log('[BrainstormingSection] Guard triggered - redirecting to private profile:', {
      publicProfileUserId,
      loggedInUserId: user._id,
      comparison: String(publicProfileUserId).trim() === String(user._id).trim()
    });
    
    return (
      <div className="max-w-2xl mx-auto w-full bg-white border border-gray-200 p-6 relative">
        {!hideHeader && (
          <FeatureTabs
            features={features}
            activeFeature={null}
            setActiveFeature={featureKey => {
              setActiveFeature(featureKey);
              setActiveSection(featureKey);
              setPublicProfileUserId(null);
            }}
            setPhase={setPhase}
          />
        )}
        <div className="mt-4">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded text-center font-medium">
            You are viewing your own profile.
          </div>
          <ProfileSection showMentorInterest={showMentorInterest} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto widthmain w-full bg-white border border-gray-200 p-6 relative">
      {/* Always render the header at the top */}
      {!hideHeader && (
        <FeatureTabs
          features={features}
          activeFeature={activeSection === 'publicProfile' ? null : activeFeature}
          setActiveFeature={featureKey => {
            setActiveFeature(featureKey);
            if (activeSection === 'publicProfile') {
              setActiveSection(featureKey);
              setPublicProfileUserId(null);
            }
          }}
          setPhase={setPhase}
        />
      )}
      {/* Main content area below header */}
      <div className="mt-4">
        {(() => {
          // console.log('Render: activeSection', activeSection, 'publicProfileUserId', publicProfileUserId);
          return null;
        })()}
        {activeSection === 'publicProfile' && publicProfileUserId ? (
          String(publicProfileUserId) === String(user?._id) ? (
            <>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded text-center font-medium">
                You are viewing your own profile.
              </div>
              <ProfileSection showMentorInterest={showMentorInterest} />
            </>
          ) : (
            <PublicProfile
              userId={publicProfileUserId}
              onClose={() => {
                setActiveSection('profile');
                setPublicProfileUserId(null);
              }}
            />
          )
        ) : (
          <>
            {activeFeature === 'feed' && (
              <FeedSection
                posts={posts}
                onApproach={post => setApproachModal({ open: true, post })}
                onAvatarClick={handleAvatarClick}
                onNavigateToInbox={handleNavigateToInbox}
              />
            )}
            {activeFeature === 'new' && (
              <NewPostSection
                form={form}
                setForm={setForm}
                showFields={showFields}
                setShowFields={setShowFields}
                phase={phase}
                setPhase={setPhase}
                image={image}
                setImage={setImage}
                pitch={pitch}
                setPitch={setPitch}
                pdf={pdf}
                setPdf={setPdf}
                addMenuOpen={addMenuOpen}
                setAddMenuOpen={setAddMenuOpen}
                privacy={privacy}
                setPrivacy={setPrivacy}
                submitting={submitting}
                handleFormChange={handleFormChange}
                handleImageChange={handleImageChange}
                handlePitchChange={handlePitchChange}
                handlePdfChange={handlePdfChange}
                onAvatarClick={handleAvatarClick}
              />
            )}
            {activeFeature === 'search' && (
              <SearchSection
                posts={posts}
                searchQuery={showFields.searchQuery || ''}
                onSearchChange={q => setShowFields({ ...showFields, searchQuery: q })}
              />
            )}

            {activeFeature === 'inbox' && (
              <InboxSection 
                onAvatarClick={handleAvatarClick} 
                targetChatId={targetChatId}
                onChatOpened={() => setTargetChatId(null)}
              />
            )}

            {activeFeature === 'profile' && (
              <ProfileSection 
                showMentorInterest={showMentorInterest} 
                publicProfileUserId={publicProfileUserId}
                onClosePublicProfile={() => setPublicProfileUserId(null)}
              />
            )}
            {activeFeature === 'settings' && <SettingsSection onMentorInterestChange={setShowMentorInterest} />}
          </>
        )}
      </div>
      <ApproachModal
        open={approachModal.open}
        post={approachModal.post}
        mockApproaches={mockApproaches}
        onClose={() => setApproachModal({ open: false, post: null })}
      />
      {/* Modular FAB and Modals */}
      <FabMenu
        fabOpen={fabOpen}
        setFabOpen={setFabOpen}
        onShowNotifications={() => {
          setShowNotifications((open) => !open);
          setShowApproaches(false);
        }}
        onShowApproaches={() => {
          setShowApproaches((open) => !open);
          setShowNotifications(false);
        }}
        inboxBtnRef={inboxBtnRef}
      />
      <NotificationsModal
        show={showNotifications}
        mockNotifications={mockNotifications}
        onClose={() => setShowNotifications(false)}
      />
      <InboxModal
        show={showApproaches}
        genieClosing={genieClosing}
        showGenie={showGenie}
        mockApproaches={mockApproaches}
        onClose={() => setShowApproaches(false)}
      />
    </div>
  );
}

export default BrainstormingSection; 