import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, X } from 'lucide-react';

export type LayoutType = 'modern' | 'card' | 'minimal' | 'classic';

interface LayoutSelectorProps {
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
}

const layouts = [
  {
    id: 'modern' as LayoutType,
    name: 'Modern',
    description: 'Floating navigation with glassmorphism effects',
    preview: '/api/placeholder/200/120',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'card' as LayoutType,
    name: 'Card-Based',
    description: 'Dashboard with interactive navigation cards',
    preview: '/api/placeholder/200/120',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'minimal' as LayoutType,
    name: 'Minimal',
    description: 'Clean and simple top navigation',
    preview: '/api/placeholder/200/120',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'classic' as LayoutType,
    name: 'Classic',
    description: 'Traditional sidebar and header layout',
    preview: '/api/placeholder/200/120',
    color: 'from-gray-500 to-slate-500'
  }
];

const LayoutSelector: React.FC<LayoutSelectorProps> = ({ currentLayout, onLayoutChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Layout Selector Button */}
      <motion.button
        className="fixed bottom-2 right-6 z-50 p-3 bg-card border border-border rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
      >
        <Palette className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </motion.button>

      {/* Layout Selection Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <motion.div
              className="relative bg-card border border-border rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold font-display">Choose Layout</h2>
                  <p className="text-muted-foreground">Select your preferred interface design</p>
                </div>
                <motion.button
                  className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Layout Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {layouts.map((layout, index) => (
                  <motion.div
                    key={layout.id}
                    className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                      currentLayout === layout.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onLayoutChange(layout.id);
                      setIsOpen(false);
                    }}
                  >
                    {/* Preview Image Placeholder */}
                    <div className={`w-full h-32 bg-gradient-to-br ${layout.color} rounded-lg mb-4 flex items-center justify-center relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="relative z-10 text-primary-foreground font-bold text-lg">
                        {layout.name}
                      </div>
                      
                      {/* Mock UI Elements */}
                      <div className="absolute top-2 left-2 right-2 h-2 bg-white/30 rounded" />
                      <div className="absolute bottom-2 left-2 w-16 h-2 bg-white/30 rounded" />
                      <div className="absolute bottom-2 right-2 w-8 h-2 bg-white/30 rounded" />
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{layout.name}</h3>
                        {currentLayout === layout.id && (
                          <motion.div
                            className="p-1 bg-primary text-primary-foreground rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          >
                            <Check className="h-3 w-3" />
                          </motion.div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {layout.description}
                      </p>
                    </div>

                    {/* Hover Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${layout.color} opacity-0 hover:opacity-5 rounded-xl transition-opacity duration-300`} />
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Layout changes are applied immediately. You can switch anytime from this selector.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LayoutSelector;