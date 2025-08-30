import React from 'react';
import AdSense from './AdSense';
import { getAdSlot, getAdPlacement, isAdSenseEnabled } from '../config/adsense';

const AdWrapper = ({ 
  placement = 'IN_CONTENT', 
  customSlot = null,
  customStyle = {},
  className = '',
  showInDevelopment = false 
}) => {
  // Don't show ads if not enabled and not in development mode
  if (!isAdSenseEnabled() && !showInDevelopment) {
    return null;
  }

  const placementConfig = getAdPlacement(placement);
  const adSlot = customSlot || getAdSlot(placementConfig.slot || placement);
  
  return (
    <AdSense
      adSlot={adSlot}
      adFormat={placementConfig.format || 'auto'}
      style={{
        ...placementConfig.style,
        ...customStyle
      }}
      className={className}
    />
  );
};

// Predefined ad components for common placements
export const HeaderAd = (props) => <AdWrapper placement="HEADER" {...props} />;
export const SidebarAd = (props) => <AdWrapper placement="SIDEBAR" {...props} />;
export const InContentAd = (props) => <AdWrapper placement="IN_CONTENT" {...props} />;
export const FooterAd = (props) => <AdWrapper placement="FOOTER" {...props} />;

export default AdWrapper; 