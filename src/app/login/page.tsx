"use client";

import { useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { zxcvbn } from "@zxcvbn-ts/core";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Chrome, ArrowRight, ArrowLeft } from "lucide-react";
import { SmartPhoneInput } from "@/components/ui/phone-input";
import { z } from "zod";
import { validatePassword } from "@/lib/password";
import AddressAutocomplete from "@/components/AddressAutocomplete";

// --- VALIDATION SCHEMAS PER STEP ---

const step1Schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
});

const step2Schema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
});

const step3Schema = z.object({
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().optional(),
});

// --- HELPER ---
const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "An unexpected error occurred";
};

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/"; // Get redirect path or default to root

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [resetMode, setResetMode] = useState(false);

  // Password UX states
  const [pwScore, setPwScore] = useState<number | null>(null);
  const [pwFeedback, setPwFeedback] = useState<{
    warning?: string;
    suggestions?: string[];
  } | null>(null);
  const [pwBreached, setPwBreached] = useState<boolean | null>(null);
  const [checkingBreach, setCheckingBreach] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  // Email verification states
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  // Debug helpers were removed after verification

  // --- LOGIN STATE ---
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // --- RESET PASSWORD STATE ---
  const [resetEmail, setResetEmail] = useState("");

  // --- SIGNUP STATE ---
  const [signupStep, setSignupStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
  });

  // Password Validation State
  const passwordCriteria = {
    length: formData.password.length >= 12,
    match:
      formData.password.length > 0 &&
      formData.password === formData.confirmPassword,
  };

  // --- HANDLERS ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (e.target.id === "email") {
      // reset email verification while user is typing
      setEmailChecked(false);
      setEmailExists(null);
    }
    // Update zxcvbn live for password fields
    if (e.target.id === "password" || e.target.id === "loginPassword") {
      const pw = e.target.value;
      try {
        const res = zxcvbn(pw, [
          formData.email,
          formData.firstName,
          formData.lastName,
        ]);
        setPwScore(res.score);
        setPwFeedback({
          warning: res.feedback.warning ?? undefined,
          suggestions: res.feedback.suggestions ?? undefined,
        });
      } catch {
        // ignore zxcvbn errors
        setPwScore(null);
        setPwFeedback(null);
      }
    }
  };

  // Verify email availability on blur
  async function checkEmailAvailability(email: string) {
    if (!email) return;
    // normalize
    const normalized = email.trim().toLowerCase();
    setCheckingEmail(true);
    try {
      const res = await fetch("/api/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      const json = await res.json();
      if (!res.ok) {
        // Block progression by marking as not checked
        setEmailChecked(false);
        setEmailExists(null);
        if (json?.error === "no_service_key") {
          toast.error(
            "Email verification not configured. Please try again later."
          );
        } else {
          toast.error("Could not verify email. Please try again later.");
        }
        return;
      }

      setEmailChecked(true);
      setEmailExists(Boolean(json.exists));
      if (json.exists) {
        toast.error(
          "An account with that email already exists. Please sign in or reset your password."
        );
      }
    } catch (err) {
      console.error("check-email failed", err);
      setEmailChecked(false);
      setEmailExists(null);
      toast.error("Could not verify email. Please try again later.");
    } finally {
      setCheckingEmail(false);
    }
  }

  // UI helpers
  const statusClass = (v: boolean | null) =>
    v === true
      ? "text-green-600"
      : v === false
      ? "text-destructive"
      : "text-muted-foreground";

  const lengthPass = passwordCriteria.length;
  const matchPass = passwordCriteria.match;
  const strengthPass = (pwScore ?? 0) >= 3;
  const breachPass = pwBreached === false;
  // Keep references to these states to avoid lint 'assigned but never used' warnings
  void checkingEmail;
  void emailChecked;
  void emailExists;

  // Compute SHA1 hex of a string (uppercase)
  async function sha1Hex(value: string) {
    const enc = new TextEncoder();
    const buffer = await crypto.subtle.digest("SHA-1", enc.encode(value));
    const arr = Array.from(new Uint8Array(buffer));
    return arr
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }

  // Call server route to check breach by prefix+suffix
  async function checkBreach(password: string) {
    if (!password) return;
    setCheckingBreach(true);
    try {
      const hash = await sha1Hex(password);
      const prefix = hash.slice(0, 5);
      const suffix = hash.slice(5);
      const res = await fetch("/api/check-breach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix, suffix }),
      });
      const json = await res.json();
      setPwBreached(Boolean(json?.breached));
    } catch (err) {
      console.error("Breach check failed", err);
      setPwBreached(false);
    } finally {
      setCheckingBreach(false);
    }
  }

  const handlePhoneChange = (value: string) => {
    setFormData((prev) => ({ ...prev, phone: value }));
  };

  // Note: origin is resolved inside handlers to avoid unused variable during build
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  console.log(
    "Origin:",
    origin,
    process.env.NEXT_PUBLIC_SITE_URL ? "env" : "window"
  );
  console.log("Next:", next);

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      const origin =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
            next
          )}`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      toast.success("Welcome back!");
      router.refresh();
      router.push(next); // Redirect to the intended page
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const origin =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");
      // Redirect to the dedicated update-password page
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${origin}/auth/callback?next=/update-password`,
      });
      if (error) throw error;
      toast.success("Check your email for the password reset link");
      setResetMode(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // --- WIZARD LOGIC ---

  const validateStep = async (step: number): Promise<boolean> => {
    if (step === 1) {
      const result = step1Schema.safeParse(formData);
      if (!result.success) {
        toast.error(result.error.issues[0].message);
        return false;
      }

      if (!passwordCriteria.match) {
        toast.error("Passwords do not match");
        return false;
      }

      const passwordCheck = await validatePassword(formData.password, [
        formData.email,
        "fashion",
        "store",
      ]);

      if (!passwordCheck.isValid) {
        toast.error(passwordCheck.feedback[0] || "Password is too weak");
        return false;
      }
      return true;
    }

    if (step === 2) {
      const result = step2Schema.safeParse(formData);
      if (!result.success) {
        toast.error(result.error.issues[0].message);
        return false;
      }
      return true;
    }

    if (step === 3) {
      const result = step3Schema.safeParse(formData);
      if (!result.success) {
        toast.error(result.error.issues[0].message);
        return false;
      }
      return true;
    }

    return false;
  };

  const nextStep = async () => {
    setLoading(true);
    const isValid = await validateStep(signupStep);
    setLoading(false);

    if (isValid) {
      // When moving from step 1 -> 2 verify email doesn't exist and password isn't breached
      if (signupStep === 1) {
        // First, require an email-existence check via server
        try {
          setCheckingEmail(true);
          const normalizedEmail = formData.email.trim().toLowerCase();
          const emailRes = await fetch("/api/check-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: normalizedEmail }),
          });

          const emailJson = await emailRes.json();

          // If service key isn't configured or server can't verify, block progression so user isn't allowed into step 2 without validation
          if (!emailRes.ok) {
            setCheckingEmail(false);
            if (emailJson?.error === "no_service_key") {
              toast.error(
                "Email verification unavailable. Please try again later."
              );
              return;
            }
            toast.error(
              "Could not verify email existence. Please try again later."
            );
            return;
          }

          // Set UI state so checklist shows result after successful check
          setEmailChecked(true);
          setEmailExists(Boolean(emailJson?.exists));
          setCheckingEmail(false);

          if (emailJson?.exists) {
            toast.error(
              "An account with that email already exists. Please sign in or use password reset."
            );
            return;
          }
        } catch (err) {
          console.error("check-email request failed", err);
          setCheckingEmail(false);
          setEmailChecked(false);
          setEmailExists(null);
          toast.error("Could not verify email. Please try again later.");
          return;
        }

        // Only if email doesn't exist, check password breach via verify-signup
        try {
          setCheckingBreach(true);
          const hash = await sha1Hex(formData.password);
          const prefix = hash.slice(0, 5);
          const suffix = hash.slice(5);

          const normalizedEmail2 = formData.email.trim().toLowerCase();
          const res = await fetch("/api/verify-signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: normalizedEmail2, prefix, suffix }),
          });
          const json = await res.json();

          if (!res.ok) {
            setCheckingBreach(false);
            setPwBreached(null);
            toast.error(
              "Could not verify password breach. Please try again later."
            );
            return;
          }

          // Update UI state so checklist reflects server breach check
          setPwBreached(Boolean(json?.breached));
          setCheckingBreach(false);

          if (json?.breached) {
            toast.error(
              "This password has been seen in a known breach. Choose a different password."
            );
            return;
          }
        } catch (err) {
          console.warn("Could not verify breach on server", err);
          setCheckingBreach(false);
          setPwBreached(null);
          toast.error(
            "Could not verify password breach. Please try again later."
          );
          return;
        }
      }

      // Small delay so users see the 'Checking' state before we advance
      try {
        setFinalizing(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } finally {
        setFinalizing(false);
      }

      setSignupStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setSignupStep((prev) => prev - 1);
  };

  const handleFinalSignup = async () => {
    if (!(await validateStep(3))) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            billing_address: {
              address: formData.address,
            },
          },
        },
      });
      if (error) throw error;
      toast.success("Account created successfully!");
      router.refresh();
      router.push(next); // Redirect to the intended page
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8 bg-muted/20">
      <Card className="w-full max-w-md shadow-lg border-border">
        {resetMode ? (
          // --- RESET PASSWORD VIEW ---
          <>
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>
                Enter your email to receive a reset link.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="m@example.com"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleResetPassword}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setResetMode(false)}
                disabled={loading}
              >
                Back to Login
              </Button>
            </CardContent>
          </>
        ) : (
          // --- LOGIN / SIGNUP TABS ---
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "login" | "signup")}
            className="w-full"
          >
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </div>

            {/* --- LOGIN TAB --- */}
            <TabsContent value="login">
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginEmail">Email</Label>
                  <Input
                    id="loginEmail"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="m@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="loginPassword">Password</Label>
                    <Button
                      variant="link"
                      className="px-0 font-normal h-auto text-xs text-primary"
                      onClick={() => setResetMode(true)}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <Input
                    id="loginPassword"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>

                <div className="flex items-center gap-4 my-4">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">OR</span>
                  <Separator className="flex-1" />
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSocialLogin("google")}
                  disabled={loading}
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  Continue with Google
                </Button>
              </CardContent>
            </TabsContent>

            {/* --- SIGN UP TAB (WIZARD) --- */}
            <TabsContent value="signup">
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>
                  Step {signupStep} of 3:{" "}
                  {signupStep === 1
                    ? "Security"
                    : signupStep === 2
                    ? "Personal Info"
                    : "Contact"}
                </CardDescription>
                <div className="h-1 w-full bg-secondary mt-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-in-out"
                    style={{ width: `${(signupStep / 3) * 100}%` }}
                  />
                </div>
              </CardHeader>

              <CardContent className="space-y-4 min-h-[300px]">
                {signupStep === 1 && (
                  <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <Button
                      variant="outline"
                      className="w-full mb-4"
                      onClick={() => handleSocialLogin("google")}
                      disabled={loading}
                    >
                      <Chrome className="mr-2 h-4 w-4" /> Sign up with Google
                    </Button>

                    <div className="flex items-center gap-4 mb-4">
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground">OR</span>
                      <Separator className="flex-1" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={() => checkEmailAvailability(formData.email)}
                      />
                    </div>

                    <div className="space-y-3 pt-1">
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          onBlur={(e) =>
                            checkBreach((e.target as HTMLInputElement).value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                          Confirm Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* strength meter and feedback */}
                      <div className="mt-3">
                        <div className="h-2 w-full bg-muted rounded overflow-hidden">
                          <div
                            aria-hidden
                            className={`h-full transition-all`}
                            style={{
                              width: `${(pwScore ?? 0) * 25}%`,
                              background:
                                pwScore === null
                                  ? "transparent"
                                  : pwScore <= 1
                                  ? "#ef4444"
                                  : pwScore === 2
                                  ? "#f59e0b"
                                  : pwScore === 3
                                  ? "#10b981"
                                  : "#047857",
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs mt-1">
                          <div>
                            {pwScore === null ? (
                              <span className="text-muted-foreground">
                                Type a password
                              </span>
                            ) : pwScore <= 1 ? (
                              <span className="text-red-600">Very weak</span>
                            ) : pwScore === 2 ? (
                              <span className="text-amber-600">Weak</span>
                            ) : pwScore === 3 ? (
                              <span className="text-green-600">Good</span>
                            ) : (
                              <span className="text-green-800">Strong</span>
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            {pwScore !== null && (
                              <span className="hidden">Score: {pwScore}/4</span>
                            )}
                          </div>
                        </div>

                        {pwFeedback &&
                          (pwFeedback.warning ||
                            (pwFeedback.suggestions &&
                              pwFeedback.suggestions.length > 0)) && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              {pwFeedback.warning && (
                                <div className="text-sm text-yellow-700">
                                  {pwFeedback.warning}
                                </div>
                              )}
                              {pwFeedback.suggestions?.map((s, i) => (
                                <div key={i} className="mt-1">
                                  • {s}
                                </div>
                              ))}
                            </div>
                          )}

                        {checkingBreach && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Checking breach...
                          </div>
                        )}

                        {pwBreached !== null && (
                          <div
                            className={`mt-2 text-xs ${
                              pwBreached ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {pwBreached
                              ? "This password has been seen in a data breach. Choose a different one."
                              : "Password not found in known breaches."}
                          </div>
                        )}

                        {/* Consolidated checklist */}
                        <div className="mt-3 text-sm space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={statusClass(lengthPass)}>
                              {lengthPass ? "✓" : "○"} At least 12 characters
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={statusClass(strengthPass)}>
                              {strengthPass ? "✓" : "○"} Password strength
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={statusClass(matchPass)}>
                              {matchPass ? "✓" : "○"} Passwords match
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={statusClass(breachPass)}>
                              {breachPass ? "✓" : "○"} Not in known breaches
                            </span>
                          </div>
                          {/* Email availability UI removed (checks still run in background) */}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {signupStep === 2 && (
                  <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First name</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last name</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          value={formData.lastName}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      We use your name to personalize your experience and for
                      order pickups.
                    </p>
                  </div>
                )}

                {signupStep === 3 && (
                  <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <SmartPhoneInput
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        placeholder="76 123 4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Billing Address (Optional)</Label>
                      <AddressAutocomplete
                        onAddressSelect={(addr) =>
                          setFormData((prev) => ({ ...prev, address: addr }))
                        }
                        onChange={(addr) =>
                          setFormData((prev) => ({ ...prev, address: addr }))
                        }
                        defaultValue={formData.address}
                      />
                      <p className="text-xs text-muted-foreground">
                        Used for faster checkout if you choose delivery.
                      </p>
                    </div>
                  </div>
                )}

                {/* Debug output removed (no longer needed) */}
              </CardContent>

              <CardFooter className="flex justify-between">
                {signupStep > 1 ? (
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={loading}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                ) : (
                  <div />
                )}

                {signupStep < 3 ? (
                  <Button
                    onClick={nextStep}
                    disabled={
                      loading || checkingEmail || checkingBreach || finalizing
                    }
                  >
                    {checkingEmail || checkingBreach || finalizing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking
                      </>
                    ) : (
                      <>
                        Next <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={handleFinalSignup} disabled={loading}>
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Account
                  </Button>
                )}
              </CardFooter>
            </TabsContent>
          </Tabs>
        )}
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
