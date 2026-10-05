// Onboarding now happens before an account exists, so answers are held in
// localStorage until sign-up and then written to the user's profile.

const KEY = "nutrigen_onboarding_draft";

export interface OnboardingDraft {
  health_goal: string;
  dietary_preferences: string[];
  breakfast_time: string;
  lunch_time: string;
  dinner_time: string;
}

export const saveOnboardingDraft = (draft: OnboardingDraft) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Storage can be unavailable (private mode); the app falls back to
    // asking again after sign-up.
  }
};

export const loadOnboardingDraft = (): OnboardingDraft | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.health_goal === "string" &&
      Array.isArray(parsed?.dietary_preferences)
    ) {
      return parsed as OnboardingDraft;
    }
  } catch {
    // fall through to null
  }
  return null;
};

export const clearOnboardingDraft = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
};
