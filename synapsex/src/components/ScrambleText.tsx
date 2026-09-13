import React, { useState, useEffect, useRef } from 'react';

interface ScrambleTextProps {
  text: string;
  isHovered: boolean;
  className?: string;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><';

export const ScrambleText: React.FC<ScrambleTextProps> = ({
  text,
  isHovered,
  className = '',
}) => {
  const [displayText, setDisplayText] = useState<string>(text);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isHovered) {
      // On unhover: immediately resets to original text
      setDisplayText(text);
      return;
    }

    // On hover: scrambles all chars with random chars, then reveals left-to-right at 4 frames/char, interval 25ms
    let frame = 0;
    const framesPerChar = 4;

    intervalRef.current = setInterval(() => {
      frame++;
      const revealedCount = Math.floor(frame / framesPerChar);

      if (revealedCount >= text.length) {
        setDisplayText(text);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      let result = '';
      for (let i = 0; i < text.length; i++) {
        if (i < revealedCount) {
          result += text[i];
        } else if (text[i] === ' ') {
          result += ' ';
        } else {
          result += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }

      setDisplayText(result);
    }, 25);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovered, text]);

  return <span className={className}>{displayText}</span>;
};
