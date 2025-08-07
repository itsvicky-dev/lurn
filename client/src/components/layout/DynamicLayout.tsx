import React from 'react';
import { useLayout } from '../../contexts/LayoutContext';
import MainLayout from './MainLayout';
import ModernLayout from './ModernLayout';
import CardLayout from './CardLayout';
import MinimalLayout from './MinimalLayout';
import LayoutSelector from './LayoutSelector';

const DynamicLayout: React.FC = () => {
  const { currentLayout, setLayout } = useLayout();

  const renderLayout = () => {
    switch (currentLayout) {
      case 'modern':
        return <ModernLayout />;
      case 'card':
        return <CardLayout />;
      case 'minimal':
        return <MinimalLayout />;
      case 'classic':
        return <MainLayout />;
      default:
        return <ModernLayout />;
    }
  };

  return (
    <>
      {renderLayout()}
      <LayoutSelector 
        currentLayout={currentLayout} 
        onLayoutChange={setLayout} 
      />
    </>
  );
};

export default DynamicLayout;