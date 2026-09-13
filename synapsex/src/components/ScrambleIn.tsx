import React, { useState, useEffect } from 'react';

interface ScrambleInProps {
  text: string;
  delay?: number; // ms before start
  triggered?: boolean;
  className?: string;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><';

export const ScrambleIn: React.FC<ScrambleInProps> = ({
  text,
  delay = 0,
  triggered = true,
  className = '',
}) => {
  const [displayText, setDisplayText] = useState<string>('');
  const [started, setStarted] = useState<boolean>(false);

  useEffect(() => {
    if (!triggered) {
      setDisplayText('');
      setStarted(false);
      return;
    }

    const startTimeout = setTimeout(() => {
      setStarted(true);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [triggered, delay]);

  useEffect(() => {
    if (!started) return;

    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      // Reveal at 0.5 chars per frame
      const revealedCount = Math.floor(frame * 0.5);

      if (revealedCount >= text.length) {
        setDisplayText(text);
        clearInterval(interval);
        return;
      }

      let result = '';
      for (let i = 0; i < text.length; i++) {
        if (i < revealedCount) {
          result += text[i];
        } else if (text[i] === ' ') {
          result += ' ';
        } else if (i < revealedCount + 3) {
          // Characters not yet revealed show random chars (up to 3 ahead of the reveal cursor)
          const randomChar = CHARS[Math.floor(Math.random() * CHARS.length)];
          result += randomChar;
        } else {
          // Characters beyond that are empty
          break;
        }
      }

      setDisplayText(result);
    }, 25);

    return () => clearInterval(interval);
  }, [started, text]);

  if (!triggered || !started || displayText === '') {
    return <span className={className}>&nbsp;</span>;
  }

  return <span className={className}>{displayText}</span>;
};
