import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../../../UserContext';

// ── Small helpers ─────────────────────────────────────────────────────────────
function SectionCard({ icon, title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <span className="text-indigo-500">{icon}</span>
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

function FieldLabel({ children, optional }) {
  return (
    <label className="block text-[11px] font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
      {children}{optional && <span className="ml-1 font-normal normal-case tracking-normal text-gray-400">(optional)</span>}
    </label>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition bg-gray-50';
const textareaCls = `${inputCls} resize-none`;

// ── Main component ─────────────────────────────────────────────────────────────
function NewPostSection({
  form, setForm,
  showFields, setShowFields,
  phase, setPhase,
  image, setImage,
  pitch, setPitch,
  pdf, setPdf,
  addMenuOpen, setAddMenuOpen,
  privacy, setPrivacy,
  submitting,
  handleFormChange, handleImageChange, handlePitchChange, handlePdfChange,
  onAvatarClick,
}) {
  const { user, setUser } = useUser();
  const [loading, setLoading]               = useState(!user);
  const [error, setError]                   = useState(null);
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [aiAnalyzing, setAiAnalyzing]       = useState(false);
  const [aiSuccess, setAiSuccess]           = useState('');
  const [neededRoles, setNeededRoles]       = useState('');
  const [roleInput, setRoleInput]           = useState('');
  const [imageFile, setImageFile]           = useState(null);
  const [pdfFile, setPdfFile]               = useState(null);
  const imageInputRef = useRef(null);
  const pdfInputRef   = useRef(null);

  // ── Fetch user if needed ───────────────────────────────────────────────────
  useEffect(() => {
    if (user) { setLoading(false); return; }
    (async () => {
      try {
        const r = await fetch('/api/users/profile', { credentials: 'include', cache: 'no-store' });
        if (!r.ok) throw new Error('Failed to fetch user');
        const d = await r.json();
        setUser(d.user || d);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    })();
  }, [user, setUser]);

  // ── File handlers ──────────────────────────────────────────────────────────
  const handleLocalImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImage(URL.createObjectURL(file));
  };
  const handleLocalPdfChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
    setPdf(file.name);
  };

  // ── Roles helpers ──────────────────────────────────────────────────────────
  const rolesArray = neededRoles ? neededRoles.split(',').map(r => r.trim()).filter(Boolean) : [];
  const addRole = (raw) => {
    const trimmed = raw.trim();
    if (!trimmed || rolesArray.includes(trimmed)) return;
    setNeededRoles(prev => prev ? `${prev}, ${trimmed}` : trimmed);
  };
  const removeRole = (role) => {
    setNeededRoles(rolesArray.filter(r => r !== role).join(', '));
  };

  // ── AI role analysis ───────────────────────────────────────────────────────
  const analyzeRolesWithAI = async () => {
    if (!form.description?.trim()) return;
    setAiAnalyzing(true);
    setError(null);
    setAiSuccess('');
    try {
      const res = await fetch('/api/ai/analyze-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title?.trim() || '',
          description: form.description.trim(),
          targetAudience: form.targetAudience?.trim() || '',
          problemStatement: form.problemStatement?.trim() || '',
          uniqueValue: form.uniqueValue?.trim() || '',
          neededRoles: neededRoles?.trim() || '',
        }),
      });
      if (res.status === 429) throw new Error('Rate limit exceeded (10 req / 15 min). Please wait.');
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || `Failed (${res.status})`); }
      const result = await res.json();
      if (result.success && Array.isArray(result.data?.roles) && result.data.roles.length > 0) {
        setNeededRoles(result.data.roles.join(', '));
        setAiSuccess(`${result.data.roles.length} roles suggested by AI`);
        setTimeout(() => setAiSuccess(''), 4000);
      } else throw new Error('No roles suggested. Try adding more details to your description.');
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 10000);
    } finally { setAiAnalyzing(false); }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleFormSubmit = async (status = 'draft') => {
    setLocalSubmitting(true);
    setError(null);
    try {
      if (!form.title.trim())       throw new Error('Title is required');
      if (!form.description.trim()) throw new Error('Description is required');
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('privacy', privacy || 'Public');
      fd.append('status', status);
      if (form.targetAudience?.trim())    fd.append('targetAudience',    form.targetAudience.trim());
      if (form.marketAlternatives?.trim()) fd.append('marketAlternatives', form.marketAlternatives.trim());
      if (form.problemStatement?.trim())  fd.append('problemStatement',  form.problemStatement.trim());
      if (form.uniqueValue?.trim())       fd.append('uniqueValue',       form.uniqueValue.trim());
      if (neededRoles) fd.append('neededRoles', JSON.stringify(rolesArray));
      if (pitch?.trim()) fd.append('pitch', pitch.trim());
      if (imageFile)  fd.append('image',    imageFile);
      if (pdfFile)    fd.append('document', pdfFile);

      const res = await fetch('/api/ideas', { method: 'POST', credentials: 'include', body: fd });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed to create post'); }

      // Reset
      setForm({ title: '', description: '', targetAudience: '', marketAlternatives: '', problemStatement: '', uniqueValue: '' });
      setImage(null); setImageFile(null);
      setPitch(''); setPdf(null); setPdfFile(null);
      setNeededRoles(''); setPrivacy('Public');
      setPhase('main');
    } catch (err) { setError(err.message); }
    finally { setLocalSubmitting(false); }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="max-w-2xl mx-auto py-16 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
    </div>
  );

  const canPublish = form.title.trim() && form.description.trim();

  // Privacy icon helper
  const PrivacyIcon = () => {
    if (privacy === 'Team') return (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
    );
    if (privacy === 'Private') return (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
    );
    return (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-28">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">Share Your Vision</h1>
        <p className="text-sm text-gray-500">Articulate your concept, find your tribe, and build the future together.</p>
      </div>

      {/* ── Banner image ────────────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden cursor-pointer group"
        style={{ minHeight: 180 }}
        onClick={() => imageInputRef.current?.click()}
      >
        {image ? (
          <img src={image} alt="Banner" className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-slate-800 via-teal-900 to-indigo-900 flex flex-col items-center justify-center gap-2">
            <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M3.75 3.75h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6a2.25 2.25 0 012.25-2.25z" />
            </svg>
            <span className="text-xs text-white/40">Click to add a cover image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-full">
            {image ? 'Change image' : 'Upload image'}
          </span>
        </div>
      </div>
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleLocalImageChange} />
      <input ref={pdfInputRef}   type="file" accept="application/pdf" className="hidden" onChange={handleLocalPdfChange} />

      {/* ── The Basics ──────────────────────────────────────────────────────── */}
      <SectionCard
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
        title="The Basics"
      >
        {/* Idea title */}
        <div>
          <FieldLabel>Idea Title</FieldLabel>
          <input
            className={inputCls}
            name="title"
            placeholder="e.g. Decentralized Clean Energy Marketplace"
            value={form.title}
            onChange={handleFormChange}
          />
        </div>

        {/* Description with toolbar */}
        <div>
          <FieldLabel>Description</FieldLabel>
          {/* Formatting toolbar (cosmetic) */}
          <div className="flex items-center gap-1 px-3 py-2 border border-gray-200 border-b-0 rounded-t-xl bg-white">
            {[
              { label: 'B', title: 'Bold', cls: 'font-bold' },
              { label: 'I', title: 'Italic', cls: 'italic' },
            ].map(({ label, title, cls }) => (
              <button key={label} type="button" title={title}
                className={`w-7 h-7 text-xs ${cls} text-gray-600 hover:bg-gray-100 rounded transition`}>
                {label}
              </button>
            ))}
            <button type="button" title="Link" className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            </button>
            <button type="button" title="List" className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
          <textarea
            className={`${textareaCls} rounded-t-none border-t-0 min-h-[140px]`}
            name="description"
            placeholder="Tell us the story behind this idea…"
            value={form.description}
            onChange={handleFormChange}
            rows={6}
          />
        </div>

        {/* Target audience */}
        <div>
          <FieldLabel optional>Targeted Audience</FieldLabel>
          <input
            className={inputCls}
            name="targetAudience"
            placeholder="Who are you building this for?"
            value={form.targetAudience}
            onChange={handleFormChange}
          />
        </div>

        {/* PDF attachment */}
        {pdf && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="truncate">{pdf}</span>
            <button type="button" onClick={() => { setPdf(null); setPdfFile(null); }} className="ml-auto text-gray-400 hover:text-red-500 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        )}

        {/* Pitch */}
        {showFields.pitch && (
          <div>
            <FieldLabel optional>Elevator Pitch</FieldLabel>
            <input className={inputCls} name="pitch" placeholder="A short one-liner pitch…" value={pitch} onChange={handlePitchChange} />
          </div>
        )}

        {/* Add extras row */}
        <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
          <span className="text-xs text-gray-400 font-medium">Add:</span>
          <button type="button" onClick={() => pdfInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            PDF
          </button>
          <button type="button" onClick={() => setShowFields({ pitch: !showFields.pitch })}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            Pitch
          </button>
        </div>
      </SectionCard>

      {/* ── The Hook ────────────────────────────────────────────────────────── */}
      <SectionCard
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        title="The Hook"
      >
        <div>
          <FieldLabel optional>Problem Statement</FieldLabel>
          <textarea
            className={`${textareaCls} min-h-[90px]`}
            name="problemStatement"
            placeholder="What keeps people up at night?"
            value={form.problemStatement}
            onChange={handleFormChange}
            rows={3}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel optional>Unique Value Prop</FieldLabel>
            <input className={inputCls} name="uniqueValue" placeholder="Your secret sauce…" value={form.uniqueValue} onChange={handleFormChange} />
          </div>
          <div>
            <FieldLabel optional>Market Alternatives</FieldLabel>
            <input className={inputCls} name="marketAlternatives" placeholder="Current solutions…" value={form.marketAlternatives} onChange={handleFormChange} />
          </div>
        </div>
      </SectionCard>

      {/* ── Roles Needed ────────────────────────────────────────────────────── */}
      <SectionCard
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        title="Roles Needed"
      >
        {/* Role chips */}
        {rolesArray.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {rolesArray.map(role => (
              <span key={role} className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M2 20c0-4 8-6 10-6s10 2 10 6"/></svg>
                {role}
                <button type="button" onClick={() => removeRole(role)} className="text-indigo-400 hover:text-indigo-700 focus:outline-none ml-0.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add role input */}
        <div className="flex gap-2">
          <input
            className={`${inputCls} flex-1`}
            placeholder="e.g. Fullstack Engineer, UI/UX Designer…"
            value={roleInput}
            onChange={e => setRoleInput(e.target.value)}
            onKeyDown={e => {
              if ((e.key === 'Enter' || e.key === ',') && roleInput.trim()) {
                e.preventDefault();
                addRole(roleInput);
                setRoleInput('');
              }
            }}
          />
          <button
            type="button"
            onClick={() => { if (roleInput.trim()) { addRole(roleInput); setRoleInput(''); } }}
            className="px-4 py-2 text-sm font-semibold text-indigo-600 border border-indigo-300 rounded-xl hover:bg-indigo-50 transition whitespace-nowrap"
          >
            + Add Role
          </button>
        </div>

        {/* ── AI Analyze — only here ─────────────────────────────────────── */}
        <div className="pt-1">
          <button
            type="button"
            onClick={analyzeRolesWithAI}
            disabled={aiAnalyzing || !form.description?.trim()}
            title={!form.description?.trim() ? 'Add a description first to enable AI analysis' : 'Let AI suggest roles based on your idea'}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl text-sm font-semibold transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
              bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm"
          >
            {aiAnalyzing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing your idea…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Analyze Roles with AI
                <span className="opacity-70 font-normal text-xs">· Suggest roles for your idea</span>
              </>
            )}
          </button>

          {/* AI feedback */}
          {aiSuccess && (
            <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              {aiSuccess}
            </div>
          )}
          {error && (
            <div className={`mt-3 px-4 py-3 rounded-xl text-sm flex items-start gap-2 ${
              error.includes('Rate limit') ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
              : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="font-medium">{error.includes('Rate limit') ? 'Rate Limited' : 'Analysis Failed'}</p>
                <p className="text-xs mt-0.5 opacity-80">{error}</p>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Global submit error ───────────────────────────────────────────────── */}
      {error && !aiAnalyzing && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Floating action bar — fixed to bottom, frosted-glass style
          On mobile it sits above the BottomNav (bottom-16); on desktop bottom-6
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-16 md:bottom-6 left-0 right-0 z-30 flex justify-center pointer-events-none px-4">
        <div className="
          pointer-events-auto
          w-full max-w-2xl
          bg-white/80 backdrop-blur-md
          border border-gray-200/80
          rounded-2xl shadow-xl shadow-black/10
          px-4 py-3
          flex items-center gap-3
        ">
          {/* Left — progress dots */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            {[
              form.title.trim(),
              form.description.trim(),
              form.problemStatement?.trim() || form.targetAudience?.trim(),
              rolesArray.length > 0,
            ].map((done, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${done ? 'bg-indigo-500' : 'bg-gray-200'}`}
              />
            ))}
            <span className="ml-1.5 text-xs text-gray-400 font-medium">
              {[form.title.trim(), form.description.trim(), form.problemStatement?.trim() || form.targetAudience?.trim(), rolesArray.length > 0].filter(Boolean).length}/4
            </span>
          </div>

          <div className="flex-1" />

          {/* Save Draft */}
          <button
            type="button"
            onClick={() => handleFormSubmit('draft')}
            disabled={localSubmitting || !canPublish}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition disabled:opacity-40 whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span className="hidden sm:inline">Save Draft</span>
          </button>

          {/* Privacy selector */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
              onClick={() => setShowFields(p => ({ ...p, privacy: !p.privacy }))}
            >
              <PrivacyIcon />
              <span className="hidden sm:inline">{privacy}</span>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
            </button>
            {showFields.privacy && (
              <div className="absolute bottom-full mb-2 right-0 w-36 bg-white border border-gray-200 rounded-xl shadow-xl z-40 overflow-hidden">
                {['Public', 'Team', 'Private'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-gray-50 ${privacy === opt ? 'font-semibold text-indigo-600' : 'text-gray-700'}`}
                    onClick={() => { setPrivacy(opt); setShowFields(p => ({ ...p, privacy: false })); }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Publish */}
          <button
            type="button"
            onClick={() => handleFormSubmit('published')}
            disabled={localSubmitting || !canPublish}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap
              bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-500/30"
          >
            {localSubmitting ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Publishing…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Publish Idea
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewPostSection;
