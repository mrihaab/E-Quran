import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw, Shield, CheckCircle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { apiSendOTP, apiVerifyOTP } from '../api';

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerified: (userData: any) => void;
}

const RESEND_COOLDOWN = 60; // seconds

export const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  onVerified,
}) => {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { addToast } = useToast();

  // Cooldown timer
  useEffect(() => {
    if (isOpen && !canResend) {
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, canResend]);

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (index === 5 && value) {
      const finalOtp = [...newOtp];
      finalOtp[5] = value;
      handleVerify(finalOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('').slice(0, 6);
      while (newOtp.length < 6) newOtp.push('');
      setOtp(newOtp);
      
      // Focus the appropriate input
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();

      // Auto-submit if all 6 digits
      if (pastedData.length === 6) {
        handleVerify(pastedData);
      }
    }
  };

  const handleVerify = async (otpString: string) => {
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await apiVerifyOTP(email, otpString);
      
      if (response.success) {
        addToast('success', 'Email Verified!', 'Your account has been verified successfully.');
        onVerified(response.data);
        onClose();
      } else {
        setError(response.message || 'Invalid OTP. Please try again.');
        // Clear OTP on error
        setOtp(new Array(6).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
      setOtp(new Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsResending(true);
    try {
      await apiSendOTP(email);
      addToast('success', 'OTP Sent!', 'A new verification code has been sent to your email.');
      setCooldown(RESEND_COOLDOWN);
      setCanResend(false);
      setOtp(new Array(6).fill(''));
      setError(null);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      addToast('error', 'Failed to Resend', err.message || 'Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(otp.join(''));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-center relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            >
              <X className="size-5" />
            </button>
            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="size-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Verify Your Email</h2>
            <p className="text-white/90 text-sm mt-1">
              Enter the 6-digit code sent to
            </p>
            <p className="text-white font-semibold">{email}</p>
          </div>

          {/* Body */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* OTP Inputs */}
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={isVerifying}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg"
                >
                  {error}
                </motion.p>
              )}

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isVerifying || otp.some(d => !d)}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin size-5 border-2 border-white border-t-transparent rounded-full" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="size-5" />
                    Verify Email
                  </>
                )}
              </button>
            </form>

            {/* Resend Section */}
            <div className="mt-6 text-center">
              <p className="text-slate-500 text-sm mb-2">Didn't receive the code?</p>
              <button
                onClick={handleResend}
                disabled={!canResend || isResending}
                className="text-emerald-600 font-semibold text-sm hover:text-emerald-700 transition-colors disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1 mx-auto"
              >
                <RefreshCw className={`size-4 ${isResending ? 'animate-spin' : ''}`} />
                {isResending 
                  ? 'Sending...' 
                  : canResend 
                    ? 'Resend OTP' 
                    : `Resend in ${cooldown}s`
                }
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
