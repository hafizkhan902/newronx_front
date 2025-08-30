import React, { useState, useEffect } from 'react';
import BrainstormPost from '../../BrainstormPost';
import UserAvatar from '../../UserAvatar';
import { useUser } from '../../../UserContext';

function NewPostSection({
  form,
  setForm,
  showFields,
  setShowFields,
  phase,
  setPhase,
  image,
  setImage,
  pitch,
  setPitch,
  pdf,
  setPdf,
  addMenuOpen,
  setAddMenuOpen,
  privacy,
  setPrivacy,
  submitting,
  handleFormChange,
  handleImageChange,
  handlePitchChange,
  handlePdfChange,
  onAvatarClick // Add onAvatarClick prop
}) {
  const [neededRoles, setNeededRoles] = useState("");
  const [error, setError] = useState(null);
  const { user, setUser } = useUser(); // Use global user context
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [localSubmitting, setLocalSubmitting] = useState(false); // Local submitting state for form submission
  const [aiAnalyzing, setAiAnalyzing] = useState(false); // State for AI analysis loading

  // Fetch user data only if not already available
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/users/profile', {
          credentials: 'include',
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        const userData = data.user || data;
        setUser(userData); // Set in global context
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    // Only fetch if we don't have user data yet
    if (!user) {
    fetchUser();
    } else {
      setLoading(false);
    }
  }, [user, setUser]);

  // Update image file handler
  const handleLocalImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImage(URL.createObjectURL(file));
      setAddMenuOpen(false);
    }
  };

  // Update PDF file handler
  const handleLocalPdfChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      setPdf(file.name);
      setAddMenuOpen(false);
    }
  };

  // AI Role Analysis function - matching API specification exactly
  const analyzeRolesWithAI = async () => {
    setAiAnalyzing(true);
    setError(null);
    
    try {
      // Validate that we have description for analysis
      if (!form.description?.trim()) {
        throw new Error('Description is required for AI analysis');
      }

      console.log('🤖 Starting AI role analysis with Google Gemini...');
      
      // Prepare request payload according to API specification
      const requestPayload = {
        title: form.title?.trim() || '',
        description: form.description.trim(),
        targetAudience: form.targetAudience?.trim() || '',
        problemStatement: form.problemStatement?.trim() || '',
        uniqueValue: form.uniqueValue?.trim() || '',
        neededRoles: neededRoles?.trim() || ''
      };
      
      console.log('📤 Sending request payload:', requestPayload);
      
      // Make API call to backend AI service (Google Gemini)
      const response = await fetch('/api/ai/analyze-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Important for cookie-based JWT auth
        body: JSON.stringify(requestPayload)
      });
      
      console.log('📡 AI API Response status:', response.status);
      
      if (!response.ok) {
        // Handle specific error cases according to API spec
        if (response.status === 429) {
          throw new Error('Rate limit exceeded (10 requests per 15 minutes). Please wait before trying again.');
        }
        if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Invalid request data provided for analysis.');
        }
        if (response.status === 500) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'AI service temporarily unavailable.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `AI analysis failed (${response.status})`);
      }
      
      const result = await response.json();
      console.log('🎯 AI Analysis Result from Google Gemini:', result);
      
      // Handle success response according to API specification
      if (result.success) {
        if (result.data && Array.isArray(result.data.roles) && result.data.roles.length > 0) {
          const suggestedRoles = result.data.roles;
          
          // Add roles to the input field (replace existing content)
          setNeededRoles(suggestedRoles.join(', '));
          
          console.log('✅ AI suggested roles applied:', suggestedRoles);
          console.log('📊 Analysis metadata:', result.data.metadata);
          
          // Show success message based on analysis method
          if (result.data.aiGenerated) {
            setError(null); // Clear any previous errors
          } else if (result.data.fallback) {
            setError('AI service was unavailable, but we found some relevant roles based on your description.');
          }
        } else {
          // Handle case when API returns success but no roles
          if (result.data && result.data.fallback) {
            throw new Error('AI service unavailable and no suitable roles found. Please try again later or add roles manually.');
          } else {
            throw new Error('No roles suggested by AI for this description. Try providing more details about your idea.');
          }
        }
      } else {
        // Handle API error response
        throw new Error(result.message || result.error || 'Invalid response format from AI service');
      }
      
    } catch (err) {
      console.error('❌ AI analysis error:', err);
      
      // Show error in popup/message
      setError(err.message);
      
      // Clear error after 10 seconds for better UX
      setTimeout(() => setError(null), 10000);
    } finally {
      setAiAnalyzing(false);
    }
  };



  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLocalSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!form.title.trim()) {
        throw new Error('Title is required');
      }
      if (!form.description.trim()) {
        throw new Error('Description is required');
      }

      // Create FormData instance
      const formData = new FormData();

      // Add text fields
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('privacy', privacy || 'Public');
      formData.append('status', 'draft');

      // Add optional fields if they exist
      if (form.targetAudience?.trim()) {
        formData.append('targetAudience', form.targetAudience.trim());
      }
      if (form.marketAlternatives?.trim()) {
        formData.append('marketAlternatives', form.marketAlternatives.trim());
      }
      if (form.problemStatement?.trim()) {
        formData.append('problemStatement', form.problemStatement.trim());
      }
      if (form.uniqueValue?.trim()) {
        formData.append('uniqueValue', form.uniqueValue.trim());
      }

      // Add needed roles as JSON string
      if (neededRoles) {
        const roles = neededRoles.split(',')
          .map(role => role.trim())
          .filter(role => role.length > 0);
        formData.append('neededRoles', JSON.stringify(roles));
      }

      // Add pitch if exists
      if (pitch?.trim()) {
        formData.append('pitch', pitch.trim());
      }

      // Add image file if exists
      if (imageFile) {
        formData.append('image', imageFile);
      }

      // Add PDF file if exists
      if (pdfFile) {
        formData.append('document', pdfFile);
      }

      // Detailed logging of payload and data types
      try {
        const resolveType = (value) => {
          if (value === null) return 'null';
          if (Array.isArray(value)) return 'array';
          if (value instanceof File) return `File(name=${value.name}, type=${value.type || 'unknown'}, size=${value.size}B)`;
          return typeof value;
        };

        console.groupCollapsed('🧪 Idea submission payload (raw values and types)');
        console.log('title:', form.title, `(type=${resolveType(form.title)})`);
        console.log('description:', form.description, `(type=${resolveType(form.description)})`);
        console.log('targetAudience:', form.targetAudience, `(type=${resolveType(form.targetAudience)})`);
        console.log('marketAlternatives:', form.marketAlternatives, `(type=${resolveType(form.marketAlternatives)})`);
        console.log('problemStatement:', form.problemStatement, `(type=${resolveType(form.problemStatement)})`);
        console.log('uniqueValue:', form.uniqueValue, `(type=${resolveType(form.uniqueValue)})`);
        console.log('pitch:', pitch, `(type=${resolveType(pitch)})`);
        console.log('privacy:', privacy, `(type=${resolveType(privacy)})`);
        console.log('status:', 'draft', `(type=${resolveType('draft')})`);
        console.log('neededRoles (input string):', neededRoles, `(type=${resolveType(neededRoles)})`);
        console.log('imageFile:', imageFile ? `${imageFile.name} (${resolveType(imageFile)})` : imageFile, `(type=${resolveType(imageFile)})`);
        console.log('pdfFile:', pdfFile ? `${pdfFile.name} (${resolveType(pdfFile)})` : pdfFile, `(type=${resolveType(pdfFile)})`);

        console.groupCollapsed('FormData entries (as sent)');
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`${key}: File`, { name: value.name, type: value.type, size: value.size });
          } else {
            console.log(`${key}:`, value, `(type=${typeof value})`);
          }
        }
        console.groupEnd();
        console.groupEnd();
      } catch (logErr) {
        console.warn('Logging payload failed:', logErr);
      }

      console.log('📡 Sending form data to /api/ideas (multipart/form-data will be set by the browser)');

      // Make the API request
      const response = await fetch('/api/ideas', {
        method: 'POST',
        credentials: 'include',
        body: formData // Browser will set the correct multipart/form-data Content-Type
      });

      console.log('📬 Response status:', response.status, response.statusText);
      console.log('📬 Response content-type:', response.headers.get('content-type'));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create post');
      }

      const responseData = await response.json();
      console.groupCollapsed('✅ Post created successfully (response body and types)');
      console.log('type of responseData:', Array.isArray(responseData) ? 'array' : typeof responseData);
      console.log('responseData:', responseData);
      console.groupEnd();

      // Reset form and state
      setForm({
        title: '',
        description: '',
        targetAudience: '',
        marketAlternatives: '',
        problemStatement: '',
        uniqueValue: ''
      });
      setImage(null);
      setImageFile(null);
      setPitch('');
      setPdf(null);
      setPdfFile(null);
      setNeededRoles('');
      setPrivacy('Public');
      setPhase('main');
      
    } catch (err) {
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setLocalSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto flex flex-col gap-6 bg-white p-8 border border-gray-200 relative">
        <div className="animate-pulse flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-full bg-gray-200"></div>
          <div className="h-8 bg-gray-200 rounded w-full"></div>
        </div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <>
      {phase === 'main' && (
        <form onSubmit={e => e.preventDefault()} className="max-w-xl mx-auto flex flex-col gap-6 bg-white p-8 border border-gray-200 relative">
          {/* Title Input with User Avatar */}
          <div className="flex items-center gap-4 mb-2">
            <UserAvatar
              userId={user?._id}
              avatarUrl={user?.avatar}
              size={48}
              isMentor={user?.isMentor}
              isInvestor={user?.isInvestor}
            />
            <input
              className="flex-1 font-sans text-lg tracking-wide italic placeholder-gray-400 text-black bg-white border-0 border-b-2 border-gray-200 focus:border-black focus:ring-0 px-0 py-2 transition-all duration-200 outline-none"
              style={{ borderRadius: 0 }}
              name="title"
              placeholder="Title"
              value={form.title}
              onChange={handleFormChange}
              required
              aria-label="Title"
            />
          </div>

          {/* Description Textarea */}
          <div className="relative mb-2">
            <textarea
              className="font-sans text-xl tracking-wide italic placeholder-gray-400 text-black bg-white border-0 border-b-2 border-gray-200 focus:border-black focus:ring-0 px-0 py-3 transition-all duration-200 outline-none resize-none min-h-[200px] w-full"
              style={{ borderRadius: 0 }}
              name="description"
              placeholder="Share your startup idea in detail... What inspired you? What problem does it solve? How will it work?"
              value={form.description}
              onChange={handleFormChange}
              required
              aria-label="Share your startup idea"
            />
          </div>

          {/* Add menu button */}
          <div className="flex items-center mt-2 relative">
            <button
              type="button"
              className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200 rounded-full border border-gray-200 shadow-sm transition"
              onClick={() => setAddMenuOpen((open) => !open)}
              aria-label="Add more"
            >
              <span className="text-2xl leading-none">+</span>
            </button>
            {addMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-32 bg-white border border-gray-200 rounded shadow z-20">
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setAddMenuOpen(false);
                    document.getElementById('image-input').click();
                  }}
                >
                  Add Image
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setAddMenuOpen(false);
                    setShowFields({ pitch: true });
                  }}
                >
                  Add Pitch
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setAddMenuOpen(false);
                    document.getElementById('pdf-input').click();
                  }}
                >
                  Add PDF
                </button>
              </div>
            )}
            {/* Hidden file inputs */}
            <input
              id="image-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLocalImageChange}
            />
            <input
              id="pdf-input"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleLocalPdfChange}
            />
          </div>

          {/* Show pitch input if selected */}
          {showFields.pitch && (
            <div className="mb-2">
              <input
                className="w-full border-0 border-b-2 border-gray-200 focus:border-black bg-transparent text-black font-sans text-base tracking-wide italic placeholder-gray-400 px-0 py-2 outline-none transition-all duration-200"
                style={{ borderRadius: 0 }}
                name="pitch"
                placeholder="Add a short pitch..."
                value={pitch}
                onChange={handlePitchChange}
                autoFocus
              />
            </div>
          )}

          {/* Show image preview */}
          {image && (
            <div className="mb-2 relative">
              <img 
                src={image} 
                alt="Preview" 
                className="max-h-40 rounded border border-gray-200" 
              />
              {submitting && (
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded">
                  <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          )}

          {/* Show PDF name if selected */}
          {pdf && (
            <div className="mb-2 text-xs text-gray-500">PDF: {pdf}</div>
          )}

          <div className="flex justify-between items-center mt-4">
            <button
              type="button"
              className="text-black underline text-sm font-sans tracking-wide"
              onClick={() => setPhase('main')}
            >
              Cancel
            </button>
            <button
              type="button"
              className="bg-black text-white px-8 py-2 border border-black font-semibold font-sans text-base tracking-wide transition disabled:opacity-50"
              style={{ borderRadius: 0 }}
              disabled={!form.title.trim() || !form.description.trim()}
              onClick={() => setPhase('details')}
            >
              Next: Shape Your Idea
            </button>
          </div>
        </form>
      )}
      {phase === 'details' && (
        <form onSubmit={handleFormSubmit} className="max-w-xl mx-auto flex flex-col gap-8 bg-white p-8 border border-gray-200 relative">
          <h3 className="text-xl font-bold text-black mb-2">Add More Details</h3>
          {/* Target Audience */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded border border-gray-200">
            <span className="text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M2 20c0-4 8-6 10-6s10 2 10 6"/></svg>
            </span>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Target Audience</label>
              <input
                className="w-full border-0 border-b-2 border-gray-200 focus:border-black bg-transparent text-black font-sans text-base tracking-wide italic placeholder-gray-400 px-0 py-2 outline-none transition-all duration-200"
                style={{ borderRadius: 0 }}
                name="targetAudience"
                placeholder="Who is this for? (e.g. Students, Developers)"
                value={form.targetAudience}
                onChange={handleFormChange}
              />
            </div>
          </div>
          {/* Market Alternatives */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded border border-gray-200">
            <span className="text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="7" height="7" rx="2" /><rect x="14" y="7" width="7" height="7" rx="2" /><rect x="3" y="17" width="7" height="4" rx="2" /><rect x="14" y="17" width="7" height="4" rx="2" /></svg>
            </span>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Market Alternatives</label>
              <input
                className="w-full border-0 border-b-2 border-gray-200 focus:border-black bg-transparent text-black font-sans text-base tracking-wide italic placeholder-gray-400 px-0 py-2 outline-none transition-all duration-200"
                style={{ borderRadius: 0 }}
                name="marketAlternatives"
                placeholder="What are the alternatives? (e.g. Notion, Slack)"
                value={form.marketAlternatives}
                onChange={handleFormChange}
              />
            </div>
          </div>
          {/* Problem Statement */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded border border-gray-200">
            <span className="text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" /></svg>
            </span>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Problem Statement</label>
              <input
                className="w-full border-0 border-b-2 border-gray-200 focus:border-black bg-transparent text-black font-sans text-base tracking-wide italic placeholder-gray-400 px-0 py-2 outline-none transition-all duration-200"
                style={{ borderRadius: 0 }}
                name="problemStatement"
                placeholder="What problem does it solve?"
                value={form.problemStatement}
                onChange={handleFormChange}
              />
            </div>
          </div>
          {/* Unique Value */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded border border-gray-200">
            <span className="text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07l-1.41 1.41M6.34 17.66l-1.41 1.41m12.02 0l-1.41-1.41M6.34 6.34L4.93 4.93" /></svg>
            </span>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Unique Value</label>
              <input
                className="w-full border-0 border-b-2 border-gray-200 focus:border-black bg-transparent text-black font-sans text-base tracking-wide italic placeholder-gray-400 px-0 py-2 outline-none transition-all duration-200"
                style={{ borderRadius: 0 }}
                name="uniqueValue"
                placeholder="What makes it unique?"
                value={form.uniqueValue}
                onChange={handleFormChange}
              />
            </div>
          </div>
          {/* Roles Needed */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1 font-semibold">Roles Needed <span className="text-gray-400 font-normal">(optional, e.g. developer, designer, content writer)</span></label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="List roles needed to assist this idea, separated by commas"
                value={neededRoles}
                onChange={e => setNeededRoles(e.target.value)}
              />
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                onClick={analyzeRolesWithAI}
                disabled={aiAnalyzing || !form.description?.trim()}
                title={!form.description?.trim() ? 'Description required for AI analysis' : 'Analyze your idea with AI to get role suggestions'}
              >
                {aiAnalyzing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>🤖 Analyzing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>🤖 Analyze with AI</span>
                  </>
                )}
              </button>
            </div>
            {/* Error Display for AI Analysis */}
            {error && (
              <div className={`mt-2 p-3 rounded text-sm ${
                error.includes('AI service was unavailable') 
                  ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                  : error.includes('Rate limit')
                  ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <div className="flex items-start gap-2">
                  {error.includes('AI service was unavailable') ? (
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : error.includes('Rate limit') ? (
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )}
                  <div className="flex-1">
                    <span className="font-medium">
                      {error.includes('Rate limit') ? 'Rate Limited' :
                       error.includes('AI service was unavailable') ? 'Fallback Used' :
                       'Analysis Failed'}
                    </span>
                    <p className="mt-1 text-xs opacity-90">{error}</p>
                    {error.includes('Rate limit') && (
                      <p className="mt-1 text-xs opacity-75">Please wait 15 minutes before trying again.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Live Preview with privacy icon in top right */}
          <div className="mt-8 relative">
            <div className="text-xs text-gray-400 mb-2">Live Preview</div>
            <BrainstormPost post={{
              id: 0,
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
              neededRoles: neededRoles, // Include neededRoles in the post data
              hideActions: true,
              privacyBadge: (
                <div className="absolute top-4 right-4 z-10">
                  <div className="relative">
                    <button
                      type="button"
                      className="flex items-center gap-1 px-2 py-1 border border-gray-300 text-gray-600 hover:text-black hover:border-black bg-white font-sans text-xs tracking-wide rounded-full transition relative shadow-sm"
                      style={{ borderRadius: '9999px', fontSize: '0.85rem' }}
                      onClick={() => setShowFields({ privacy: !showFields.privacy })}
                      aria-label="Select privacy"
                    >
                      {privacy === 'Team' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      ) : privacy === 'Private' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
                      )}
                      <span>{privacy}</span>
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
                    </button>
                    {showFields.privacy && (
                      <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow z-20">
                        {['Public', 'Team', 'Private'].map(option => (
                          <button
                            key={option}
                            type="button"
                            className={`w-full text-left px-4 py-2 text-sm font-sans hover:bg-gray-100 ${privacy === option ? 'text-black font-semibold' : 'text-gray-700'}`}
                            onClick={() => {
                              setPrivacy(option);
                              setShowFields({ privacy: false });
                            }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ),
            }} />
          </div>
          {/* Add error message display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mt-4">
              <p className="text-red-600 text-sm font-medium">Error: {error}</p>
              <p className="text-red-500 text-xs mt-1">Please check your input and try again. If the problem persists, contact support.</p>
            </div>
          )}
          <div className="flex justify-between items-center mt-4">
            <button
              type="button"
              className="text-black underline text-sm font-sans tracking-wide"
              onClick={() => setPhase('main')}
            >
              Back
            </button>
            <button
              type="submit"
              className="bg-black text-white px-8 py-2 border border-black font-semibold font-sans text-base tracking-wide transition disabled:opacity-50"
              style={{ borderRadius: 0 }}
                              disabled={localSubmitting || !form.title.trim() || !form.description.trim()}
            >
                              {localSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

export default NewPostSection; 