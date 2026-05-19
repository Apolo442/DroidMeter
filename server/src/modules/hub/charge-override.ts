const MANUAL_RESUME_OVERRIDE_MS = 60 * 60 * 1000;

let manualResumeOverrideUntil = 0;

export function enableManualResumeOverride(now = Date.now()) {
  manualResumeOverrideUntil = now + MANUAL_RESUME_OVERRIDE_MS;
}

export function disableManualResumeOverride() {
  manualResumeOverrideUntil = 0;
}

export function isManualResumeOverrideActive(now = Date.now()) {
  return now < manualResumeOverrideUntil;
}
