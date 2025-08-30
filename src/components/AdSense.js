import React, { useEffect, useRef } from 'react';
import { ADSENSE_CONFIG, getAdSlot, isAdSenseEnabled } from '../config/adsense';

const AdSense = ({ 
  adSlot, 
  adFormat = 'auto', 
  style = {}, 
  className = '',
  responsive = true,
  fullWidthResponsive = true 
}) => {
  const adRef = useRef(null);

  useEffect(() => {
    // Check if AdSense is loaded
    if (window.adsbygoogle && adRef.current) {
      try {
        window.adsbygoogle.push({});
      } catch (error) {
        console.error('AdSense error:', error);
      }
    }
  }, [adSlot]);

  // Don't render ads in development or if AdSense is not enabled
  if (!isAdSenseEnabled()) {
    return (
      <div 
        ref={adRef}
        style={{
          ...style,
          background: '#f0f0f0',
          border: '2px dashed #ccc',
          padding: '20px',
          textAlign: 'center',
          color: '#666',
          minHeight: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        className={className}
      >
        <div>
          <strong>AdSense Ad Placeholder</strong><br />
          <small>Slot: {adSlot}</small><br />
          <small>Format: {adFormat}</small>
        </div>
      </div>
    );
  }

  return (
    <div ref={adRef} style={style} className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CONFIG.PUBLISHER_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive}
      />
    </div>
  );
};

export default AdSense; 