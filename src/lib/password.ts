import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as zxcvbnCommon from '@zxcvbn-ts/language-common';
import * as zxcvbnEn from '@zxcvbn-ts/language-en';

// Initialize zxcvbn with English translations and common patterns
const options = {
  translations: zxcvbnEn.translations,
  graphs: zxcvbnCommon.adjacencyGraphs,
  dictionary: {
    ...zxcvbnCommon.dictionary,
    ...zxcvbnEn.dictionary,
  },
};

zxcvbnOptions.setOptions(options);

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-4
  feedback: string[];
  breached: boolean;
}

/**
 * Checks if a password has appeared in a data breach using the HIBP k-anonymity API.
 * This does NOT send the password to the server. It hashes it locally and sends only the first 5 chars.
 */
async function checkBreachedPassword(password: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  const prefix = hashHex.slice(0, 5);
  const suffix = hashHex.slice(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!response.ok) return false; // Fail open if API is down
    
    const text = await response.text();
    // Check if our suffix exists in the response
    const regex = new RegExp(`^${suffix}:`, 'm');
    return regex.test(text);
  } catch (error) {
    console.error("HIBP Check Failed:", error);
    return false; // Fail open
  }
}

/**
 * Validates password against NIST/OWASP guidelines.
 * @param password The password to check
 * @param userInputs Optional array of strings (email, name, username) to check for PII
 */
export async function validatePassword(
  password: string, 
  userInputs: string[] = []
): Promise<ValidationResult> {
  const errors: string[] = [];

  // 1. Basic Length Checks (NIST)
  if (password.length < 12) {
    return {
      isValid: false,
      score: 0,
      feedback: ["Password must be at least 12 characters long."],
      breached: false
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      score: 0,
      feedback: ["Password must be fewer than 128 characters."],
      breached: false
    };
  }

  // 2. Breach Check (Async)
  const isBreached = await checkBreachedPassword(password);
  if (isBreached) {
    return {
      isValid: false,
      score: 0,
      feedback: ["This password has appeared in a known data breach. Please choose a different one."],
      breached: true
    };
  }

  // 3. Strength & Pattern Check (zxcvbn)
  // We pass userInputs so it can penalize passwords that contain the user's name/email
  const result = zxcvbn(password, userInputs);

  // Score 0-2 is considered weak/guessable. 3-4 is strong.
  if (result.score < 3) {
    // Collect specific warnings from zxcvbn
    if (result.feedback.warning) errors.push(result.feedback.warning);
    // If zxcvbn didn't give a specific warning but score is low, give generic advice
    if (errors.length === 0) {
      errors.push("Password is too easy to guess. Avoid common words, repeated characters, or sequences.");
    }
  }

  return {
    isValid: errors.length === 0,
    score: result.score,
    feedback: errors,
    breached: false
  };
}