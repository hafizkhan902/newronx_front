// AdSense Configuration
export const ADSENSE_CONFIG = {
  // Replace with your actual publisher ID
  PUBLISHER_ID: 'ca-pub-7488035651933192',
  
  // Ad slots configuration
  AD_SLOTS: {
    // Header banner ad
    HEADER_BANNER: 'YOUR_HEADER_AD_SLOT_ID',
    
    // Sidebar ad
    SIDEBAR: 'YOUR_SIDEBAR_AD_SLOT_ID',
    
    // In-content ad
    IN_CONTENT: 'YOUR_IN_CONTENT_AD_SLOT_ID',
    
    // Footer ad
    FOOTER: 'YOUR_FOOTER_AD_SLOT_ID',
    
    // Homepage hero ad
    HOMEPAGE_HERO: 'YOUR_HOMEPAGE_HERO_AD_SLOT_ID',
    
    // Settings page ad
    SETTINGS_PAGE: 'YOUR_SETTINGS_PAGE_AD_SLOT_ID',
    
    // Inbox page ad
    INBOX_PAGE: 'YOUR_INBOX_PAGE_AD_SLOT_ID',
  },
  
  // Ad formats
  AD_FORMATS: {
    BANNER: 'auto',
    SIDEBAR: 'auto',
    IN_CONTENT: 'auto',
    RESPONSIVE: 'auto',
    RECTANGLE: 'rectangle',
    LEADERBOARD: 'leaderboard',
  },
  
  // Ad placement settings
  PLACEMENTS: {
    HEADER: {
      slot: 'HEADER_BANNER',
      format: 'auto',
      style: {
        display: 'block',
        textAlign: 'center',
        margin: '10px 0',
        minHeight: '90px'
      }
    },
    
    SIDEBAR: {
      slot: 'SIDEBAR',
      format: 'auto',
      style: {
        display: 'block',
        margin: '20px 0',
        minHeight: '250px'
      }
    },
    
    IN_CONTENT: {
      slot: 'IN_CONTENT',
      format: 'auto',
      style: {
        display: 'block',
        textAlign: 'center',
        margin: '30px 0',
        minHeight: '250px'
      }
    },
    
    FOOTER: {
      slot: 'FOOTER',
      format: 'auto',
      style: {
        display: 'block',
        textAlign: 'center',
        margin: '20px 0',
        minHeight: '90px'
      }
    }
  }
};

// Helper function to get ad slot by name
export const getAdSlot = (slotName) => {
  return ADSENSE_CONFIG.AD_SLOTS[slotName] || slotName;
};

// Helper function to get ad placement config
export const getAdPlacement = (placementName) => {
  return ADSENSE_CONFIG.PLACEMENTS[placementName] || {};
};

// Check if AdSense is enabled (for production only)
export const isAdSenseEnabled = () => {
  return process.env.NODE_ENV === 'production' && 
         ADSENSE_CONFIG.PUBLISHER_ID !== 'ca-pub-YOUR_PUBLISHER_ID';
}; 