import React, { createContext, useContext, useState, useEffect } from 'react';

export type LayoutType = 'modern' | 'card' | 'minimal' | 'classic';

interface LayoutContextType {
  currentLayout: LayoutType;
  setLayout: (layout: LayoutType) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

interface LayoutProviderProps {
  children: React.ReactNode;
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const [currentLayout, setCurrentLayout] = useState<LayoutType>(() => {
    // Get saved layout from localStorage or default to 'modern'
    const saved = localStorage.getItem('ai-tutor-layout');
    return (saved as LayoutType) || 'modern';
  });

  const setLayout = (layout: LayoutType) => {
    setCurrentLayout(layout);
    localStorage.setItem('ai-tutor-layout', layout);
  };

  useEffect(() => {
    // Save to localStorage whenever layout changes
    localStorage.setItem('ai-tutor-layout', currentLayout);
  }, [currentLayout]);

  return (
    <LayoutContext.Provider value={{ currentLayout, setLayout }}>
      {children}
    </LayoutContext.Provider>
  );
};

export default LayoutProvider;