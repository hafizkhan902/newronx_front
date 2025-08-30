import React from 'react';

function FeatureTabs({ features, activeFeature, setActiveFeature, setPhase }) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6 flex items-center justify-center gap-6">
      {features.map((feature) => (
        <button
          key={feature.key}
          onClick={() => { setActiveFeature(feature.key); setPhase && setPhase('main'); }}
          className={`flex flex-col items-center justify-center px-2 py-1 transition text-xs font-medium
            ${activeFeature === feature.key ? 'text-black' : 'text-gray-400 hover:text-black'}`}
          aria-label={feature.label}
          style={{ borderBottom: activeFeature === feature.key ? '2px solid black' : '2px solid transparent', background: 'none', borderRadius: 0 }}
        >
          {feature.icon}
          <span className="mt-1">{feature.label}</span>
        </button>
      ))}
    </div>
  );
}

export default FeatureTabs; 