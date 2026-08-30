"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { OtpInput, SelectDropdown, TextField } from "@lokesh-workspace/ui";

import { useAuth } from "@/components/authProvider";
import { COUNTRY_CODES_OPTIONS } from "@/constants/selectOptions/places";

const CODE_LENGTH = 4;

/** Show enough of the number to recognise it, not enough to leak it. */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  return `${"•".repeat(Math.max(2, digits.length - 4))}${digits.slice(-4)}`;
}

function VerifyCard() {
  const router = useRouter();
  const auth = useAuth();
  const params = useSearchParams();

  // Sign-up passes the number it just registered. Arriving without one - the
  // Google path, or a refresh after the query string was dropped - falls back
  // to asking for it, which is the same screen either way.
  const [phone, setPhone] = useState<string>(() => params.get("phone") ?? "");
  const [countryCode, setCountryCode] = useState<string>(() => params.get("cc") ?? "IN");
  const [needsPhone, setNeedsPhone] = useState<boolean>(() => !params.get("phone"));

  const purpose = params.get("purpose") === "login" ? "login" : "signup";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  // Auto-submit fires as soon as the last digit lands; this stops a re-render
  // from firing it twice for the same code.
  const submitted = useRef("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Sign-up already issued a code server-side, so this screen never asks for
  // one and would otherwise never learn the development passcode. Ask directly.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/otp/config")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setDevCode(data.devCode ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const sendCode = useCallback(
    async (targetPhone: string, targetCc: string) => {
      setError("");
      setNotice("");
      setBusy(true);
      try {
        const response = await fetch("/api/auth/otp/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: targetPhone, country_code: targetCc, purpose }),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(data.detail ?? "Could not send the code. Please try again.");
          return false;
        }

        setDevCode(data.devCode ?? null);
        setCooldown(Number(data.retryAfter ?? 30));
        setNotice(`We sent a ${CODE_LENGTH}-digit code to ${targetCc} ${maskPhone(targetPhone)}.`);
        return true;
      } catch {
        setError("Could not reach the Vivah4U service. Please try again.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [purpose],
  );

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 6) {
      setError("Enter the mobile number you registered with.");
      return;
    }
    if (await sendCode(digits, countryCode)) {
      setPhone(digits);
      setNeedsPhone(false);
    }
  }

  const verify = useCallback(
    async (submittedCode: string) => {
      if (submittedCode.length !== CODE_LENGTH) return;
      submitted.current = submittedCode;
      setError("");
      setBusy(true);

      try {
        const response = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            country_code: countryCode,
            code: submittedCode,
            purpose,
          }),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.verified) {
          setError(data.detail ?? "That code is incorrect or has expired.");
          setCode("");
          submitted.current = "";
          return;
        }

        // Verifying signs the member in. `login` routes onward: the wizard when
        // the profile is not complete enough, otherwise the home page.
        auth.login({
          username: data.username,
          isProfileComplete: Boolean(data.isProfileComplete),
          profileId: data.profileId,
        });
      } catch {
        setError("Could not reach the Vivah4U service. Please try again.");
        submitted.current = "";
      } finally {
        setBusy(false);
      }
    },
    [auth, countryCode, phone, purpose],
  );

  if (needsPhone) {
    return (
      <div className="auth-card">
        <h1 className="auth-title">Confirm your mobile number</h1>
        <p className="auth-subtitle">
          Tell us the number to send your {CODE_LENGTH}-digit code to.
        </p>

        <form onSubmit={handlePhoneSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="w-36 shrink-0">
              <SelectDropdown
                id="verify-country-code"
                label="Country code"
                placeholder=""
                options={COUNTRY_CODES_OPTIONS}
                value={countryCode}
                onChange={setCountryCode}
                showButtonValue
                searchable
              />
            </div>
            <div className="min-w-0 flex-1">
              <TextField
                id="verify-phone"
                label="Mobile number"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          {error && <div className="auth-alert auth-alert-error">{error}</div>}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>

        <p className="auth-note">
          Already confirmed? <Link href="/login" className="link">Sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Enter your code</h1>
      <p className="auth-subtitle">
        We sent a {CODE_LENGTH}-digit code to {countryCode} {maskPhone(phone)}.
      </p>

      <div className="mt-6">
        <OtpInput
          id="otp"
          value={code}
          onChange={(next) => {
            setCode(next);
            if (error) setError("");
          }}
          onComplete={(next) => {
            if (submitted.current !== next) void verify(next);
          }}
          length={CODE_LENGTH}
          disabled={busy}
          errorValue={error || undefined}
          autoFocus
        />
      </div>

      {devCode && !error && (
        <div className="auth-alert mt-4">
          <strong>Development mode.</strong> No SMS provider is configured yet — use{" "}
          <code className="font-semibold">{devCode}</code> to continue.
        </div>
      )}

      {notice && !error && !devCode && <div className="auth-alert mt-4">{notice}</div>}

      <button
        type="button"
        className="btn-primary mt-5 w-full"
        onClick={() => void verify(code)}
        disabled={busy || code.length !== CODE_LENGTH}
      >
        {busy ? "Verifying…" : "Verify and continue"}
      </button>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          type="button"
          className="link disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
          onClick={() => void sendCode(phone, countryCode)}
          disabled={busy || cooldown > 0}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
        <button
          type="button"
          className="text-color-placeholder-text hover:underline"
          onClick={() => {
            setNeedsPhone(true);
            setCode("");
            setError("");
          }}
        >
          Use a different number
        </button>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="hero-bg auth-shell">
      {/* useSearchParams needs a Suspense boundary to keep the route static. */}
      <Suspense fallback={<div className="auth-card">Loading…</div>}>
        <VerifyCard />
      </Suspense>
    </div>
  );
}
