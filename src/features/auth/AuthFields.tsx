"use client";

import { useState } from "react";
import type { IconType } from "react-icons";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

/**
 * Underlined input with a leading icon, ported from CRA's `loginform.scss`
 * `.input_group`. The underline is two stacked elements: a static hairline and
 * a lime gradient that scales in from the left on focus.
 */
export function AuthField({
  id,
  name,
  type = "text",
  placeholder,
  icon: Icon,
  error,
  defaultValue,
  autoComplete,
  required,
  minLength,
}: {
  id: string;
  name: string;
  type?: string;
  placeholder: string;
  icon: IconType;
  error?: string;
  defaultValue?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  const [filled, setFilled] = useState(Boolean(defaultValue));
  const isPassword = type === "password";
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="auth-fade-up relative mb-7 md-auth:mb-6">
      <span
        className={[
          "pointer-events-none absolute left-0 top-1/2 z-[2] -translate-y-1/2 text-[22px] transition-colors duration-300 md-auth:text-[20px]",
          focused ? "text-[#d6ff00]" : filled ? "text-[#8faa00]" : "text-color",
        ].join(" ")}
      >
        <Icon aria-hidden />
      </span>

      <input
        id={id}
        name={name}
        type={isPassword && revealed ? "text" : type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        spellCheck={false}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `err-${id}` : undefined}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false);
          setFilled(Boolean(e.target.value));
        }}
        onChange={(e) => setFilled(Boolean(e.target.value))}
        className={[
          "w-full border-none bg-transparent py-[1.125rem] pl-11 text-[16px] text-foreground outline-none transition-all duration-300",
          "placeholder:text-color placeholder:opacity-60 focus:placeholder:opacity-40",
          "md-auth:py-[0.875rem] md-auth:pl-10",
          isPassword ? "pr-12" : "",
        ].join(" ")}
      />

      {isPassword && (
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          aria-label={revealed ? "Hide password" : "Show password"}
          className="absolute right-0 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-[10px] border-none bg-none p-3 text-[22px] text-color transition-all duration-300 hover:bg-[rgba(214,255,0,0.1)] md-auth:min-h-0 md-auth:min-w-0 md-auth:rounded-lg md-auth:p-2 md-auth:text-[20px]"
        >
          {revealed ? <AiFillEyeInvisible aria-hidden /> : <AiFillEye aria-hidden />}
        </button>
      )}

      {/* Static hairline + lime gradient that scales in on focus. */}
      <span className="absolute inset-x-0 bottom-0 h-px bg-white/10" aria-hidden>
        <span
          className={[
            "absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-to-r from-[#d6ff00] to-[#8faa00]",
            "shadow-[0_0_10px_rgba(214,255,0,0.3)] transition-transform duration-300",
            focused ? "scale-x-100" : "scale-x-0",
          ].join(" ")}
        />
      </span>

      {error && (
        <p id={`err-${id}`} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Primary lime submit button — CRA `.loginform_button`. */
export function AuthSubmitButton({
  children,
  pending,
  pendingLabel,
  disabled,
}: {
  children: React.ReactNode;
  pending?: boolean;
  pendingLabel?: string;
  /** Blocks submission without showing the pending label. */
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="auth-fade-up relative h-14 w-full overflow-hidden rounded-[14px] border-none bg-gradient-to-br from-[#d6ff00] to-[#b8e000] text-[17px] font-semibold text-[#070707] shadow-[0_4px_15px_rgba(214,255,0,0.3),0_0_30px_rgba(214,255,0,0.1)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(214,255,0,0.4),0_0_40px_rgba(214,255,0,0.2)] disabled:cursor-not-allowed disabled:opacity-60 md-auth:rounded-xl"
    >
      <span className="relative z-[1] flex items-center justify-center gap-2">
        {pending ? (
          pendingLabel ?? "Please wait…"
        ) : (
          <>
            <span>{children}</span>
            <svg className="h-5 w-5 transition-transform duration-300" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 12h14M12 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}
      </span>
    </button>
  );
}

/** "or continue with" rule — CRA `.divider_wrapper`. */
export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="my-8 flex w-full items-center gap-4 md-auth:my-8">
      <span className="h-px flex-1 bg-white/10" aria-hidden />
      <span className="whitespace-nowrap text-[14px] text-color opacity-60">
        {label}
      </span>
      <span className="h-px flex-1 bg-white/10" aria-hidden />
    </div>
  );
}

/** Heading pair — CRA `.welcome_text`. */
export function AuthHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="auth-fade-up mb-9 md-auth:mb-8">
      <h1 className="m-0 mb-2.5 font-serif text-[34px] font-normal leading-[1.15] text-foreground md-auth:mb-2 md-auth:text-[38px] md-auth:leading-[1.2]">
        {title}
      </h1>
      <p className="m-0 text-[15px] leading-[1.5] text-color opacity-70 md-auth:text-[14px]">
        {subtitle}
      </p>
    </div>
  );
}
