import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BrainstormingSection from './components/BrainstormingSection';
import FeedSection from './components/brainstorming/sections/FeedSection';
import NewPostSection from './components/brainstorming/sections/NewPostSection';
import SearchSection from './components/brainstorming/sections/SearchSection';
import MyIdeasSection from './components/brainstorming/sections/MyIdeasSection';
import ProfileSection from './components/brainstorming/sections/ProfileSection';
import SettingsSection from './components/brainstorming/sections/SettingsSection';
import PublicProfile from './components/brainstorming/sections/PublicProfile';

const sections = [

];
// Example mock data for demonstration
const mockPosts = [
  { id: 1, title: 'Sample Idea', description: 'A cool startup idea', author: { name: 'User', avatar: 'U' } },
  { id: 2, title: 'Another Idea', description: 'Another cool idea', author: { name: 'User', avatar: 'U' } },
];
const mockForm = { title: '', description: '' };
const handleFormChange = () => {};
const handleFormSubmit = () => {};

function StartupValidatorPage() {
  const [activeSection, setActiveSection] = useState('brainstorm');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [lastSection, setLastSection] = useState('brainstorm');

  // When a public profile is shown, no header icon should be selected
  const showPublicProfile = !!selectedUserId;

  let SectionComponent;
  switch (activeSection) {
    case 'brainstorm':
      SectionComponent = <BrainstormingSection setSelectedUserId={setSelectedUserId} hideHeader={showPublicProfile} />;
      break;
    case 'express':
      SectionComponent = <div className="text-gray-400 text-center py-12">(Section unavailable)</div>;
      break;
    case 'feed':
      SectionComponent = <FeedSection posts={mockPosts} setSelectedUserId={setSelectedUserId} />;
      break;
    case 'new':
      SectionComponent = <NewPostSection form={mockForm} onChange={handleFormChange} onSubmit={handleFormSubmit} setSelectedUserId={setSelectedUserId} />;
      break;
    case 'search':
      SectionComponent = <SearchSection posts={mockPosts} searchQuery={searchQuery} onSearchChange={setSearchQuery} setSelectedUserId={setSelectedUserId} />;
      break;
    case 'myideas':
      SectionComponent = <MyIdeasSection posts={mockPosts} setSelectedUserId={setSelectedUserId} />;
      break;
    case 'profile':
      SectionComponent = <ProfileSection setSelectedUserId={setSelectedUserId} />;
      break;
    case 'settings':
      SectionComponent = <SettingsSection setSelectedUserId={setSelectedUserId} />;
      break;
    default:
      SectionComponent = <BrainstormingSection setSelectedUserId={setSelectedUserId} />;
  }

  return (
    <main className="bg-white h-screen overflow-y-auto p-0">
      {/* No explicit header here; BrainstormingSection provides the main header */}
      {/* Only show section tabs if not showing public profile */}
      {!showPublicProfile && (
        <div className="max-w-4xl mx-auto w-full flex gap-2 mb-6 px-6">
          {sections.map(section => (
            <button
              key={section.key}
              className={`flex-1 py-3 text-center font-semibold text-lg transition border-b-2 ${activeSection === section.key ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
              onClick={() => {
                setActiveSection(section.key);
                setLastSection(section.key);
                setSelectedUserId(null);
              }}
              style={{ userSelect: 'none' }}
              tabIndex={0}
              aria-disabled={showPublicProfile}
              disabled={showPublicProfile}
            >
              {section.label}
            </button>
          ))}
        </div>
      )}
      {/* Main content area */}
      {showPublicProfile ? (
        <div className="max-w-4xl mx-auto w-full px-6">
          <button className="mb-4 text-xs text-blue-600 hover:underline" onClick={() => {
            setSelectedUserId(null);
            setActiveSection(lastSection);
          }}>&larr; Back</button>
          <PublicProfile userId={selectedUserId} />
        </div>
      ) : (
        SectionComponent
      )}
    </main>
  );
}

export default StartupValidatorPage; 