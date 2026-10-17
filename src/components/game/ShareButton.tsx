'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Check, Copy, Link, Twitter } from 'lucide-react';
import type { GuessResult } from '@/lib/gameEngine';
import { generateShareText } from '@/lib/gameEngine';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  won: boolean;
  guessCount: number;
  maxGuesses: number;
  puzzleNumber: number;
  guesses: GuessResult[][];
  customGameId?: string | null;
}

export function ShareButton({
  won,
  guessCount,
  maxGuesses,
  puzzleNumber,
  guesses,
  customGameId
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  const shareText = generateShareText(won, guessCount, maxGuesses, puzzleNumber, guesses);
  const shareLink = customGameId 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?custom=${customGameId}`
    : '';
  
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const handleCopyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };
  
  const handleShare = async () => {
    const fullText = shareLink ? `${shareText}\n\nPlay: ${shareLink}` : shareText;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Scidle',
          text: fullText,
          url: shareLink || undefined
        });
        return;
      } catch (err) {
        // Fallback to copy
      }
    }
    
    handleCopyText();
  };
  
  const handleTwitter = () => {
    const text = encodeURIComponent(shareText + (shareLink ? `\n\n${shareLink}` : ''));
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };
  
  return (
    <div className="flex gap-2 flex-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={handleShare}
              className={cn(
                "flex-1 gap-2",
                won 
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white" 
                  : "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white"
              )}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Share
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <pre className="text-xs whitespace-pre-wrap">{shareText}</pre>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline"
              onClick={handleTwitter}
              className="gap-2"
            >
              <Twitter className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Share on X/Twitter</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {customGameId && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline"
                onClick={handleCopyLink}
                className="gap-2"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Link className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Copy game link</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
