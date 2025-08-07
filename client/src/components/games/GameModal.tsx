import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2 } from 'lucide-react';
import TicTacToeGame from './TicTacToeGame';
import RockPaperScissorsGame from './RockPaperScissorsGame';
import Button from '../ui/Button';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameType: 'tictactoe' | 'rockpaperscissors' | null;
  title?: string;
}

const GameModal: React.FC<GameModalProps> = ({
  isOpen,
  onClose,
  gameType,
  title = 'Quick Game'
}) => {
  if (!isOpen || !gameType) return null;

  const renderGame = () => {
    switch (gameType) {
      case 'tictactoe':
        return <TicTacToeGame onClose={onClose} compact={false} showScore={true} />;
      case 'rockpaperscissors':
        return <RockPaperScissorsGame onClose={onClose} compact={false} showScore={true} />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-background rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                    <Gamepad2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{title}</h2>
                    <p className="text-sm text-muted-foreground">
                      Play while your content loads!
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  icon={<X className="h-4 w-4" />}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Close
                </Button>
              </div>

              {/* Game Content */}
              <div className="p-6">
                {renderGame()}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GameModal;