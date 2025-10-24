import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
import { Button } from './ui/button';
import { MnemosyneLogo } from './MnemosyneLogo';
import { ProgressDots } from './ProgressDots';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface OnboardingScreenProps {
  onGetStarted?: () => void;
  onLogin?: () => void;
}

export function OnboardingScreen({ onGetStarted, onLogin }: OnboardingScreenProps) {
  const [currentStep] = useState(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center space-y-10"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-8"
          >
            <MnemosyneLogo />
            <h1 className="text-center text-teal-900 text-6xl title-primary">
              Mnemosyne
            </h1>
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-center px-4"
          >
            <p className="text-teal-800 text-4xl opacity-90 tagline">
              Share once. Remember always.
            </p>
          </motion.div>

          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="w-full rounded-3xl overflow-hidden shadow-2xl"
          >
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1758691462321-9b6c98c40f7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxtJTIwcGF0aWVudCUyMGhlYWx0aGNhcmUlMjBjb252ZXJzYXRpb258ZW58MXx8fHwxNzYxMjIzMjc3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Healthcare companion illustration"
              className="w-full h-80 object-cover"
            />
          </motion.div>

          {/* Value Proposition (optional animated bubbles concept) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="text-center space-y-4 px-4"
          >
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                'Record your story',
                'Trusted companion',
                'Always remembered',
              ].map((text, index) => (
                <motion.span
                  key={text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 + index * 0.2, duration: 0.4 }}
                  className="inline-block px-6 py-3 bg-white/70 backdrop-blur-sm rounded-full text-teal-700 text-lg border border-teal-200/50 shadow-sm body-medium"
                >
                  {text}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Call to Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.6 }}
            className="w-full max-w-md space-y-4"
          >
            <Button
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-xl rounded-xl h-14 shadow-lg shadow-teal-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/40 hover:scale-105 button-text"
              onClick={onGetStarted}
            >
              Get Started
            </Button>

            <button
              onClick={onLogin}
              className="w-full text-center text-teal-700 hover:text-teal-900 transition-colors text-lg body-regular"
            >
              Already have an account? Log in
            </button>
          </motion.div>

          {/* Privacy Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.6 }}
            className="flex items-center gap-3 text-teal-700/80 bg-white/60 backdrop-blur-sm px-6 py-4 rounded-xl border border-teal-200/30 shadow-sm max-w-lg"
          >
            <Lock className="w-5 h-5 flex-shrink-0" />
            <p className="text-base body-regular">
              Your health story stays private — encrypted and stored securely.
            </p>
          </motion.div>

          {/* Progress Dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 0.6 }}
          >
            <ProgressDots currentStep={currentStep} totalSteps={2} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
