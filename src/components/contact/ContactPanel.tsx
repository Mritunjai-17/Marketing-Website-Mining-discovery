"use client";

import React, { useRef, useState } from "react";
import { ArrowRight, Mail, MapPin } from "lucide-react";

/**
 * The /contact page: one centred card, navy information panel beside a white form.
 *
 * REPLACES ContactHero + ContactInformation, which between them made the page a
 * full-bleed editorial spread — a display-scale uppercase headline over a tinted ground,
 * with the details set as an editorial list below it. This is a contact card instead: the
 * page is a light ground, the card sits on it, and nothing is at display scale.
 *
 * ON SUBMISSION. The project has no API routes (there is no src/app/api) and no mail
 * transport, so there is nothing to POST to. The form hands the composed message to the
 * visitor's own mail client through a mailto: URL and says exactly that — it does not
 * claim the message was received, because nothing here received it.
 *
 * To move it onto a real endpoint: replace the body of `handoff` with a fetch, keep
 * `validate` as it is, change SENT_COPY, and add a failure branch that leaves `values`
 * alone — the state is already shaped for it.
 */

/** The official details, unchanged from the component this replaces. */
const CONTACT = {
  email: "info@miningdiscovery.com",
  /*
   * Reproduced as the source publishes it, including "Layfatte" — that looks like it
   * should read "Lafayette", but correcting a street name is inventing an address, so it
   * is left exactly as found and flagged for a human to confirm.
   */
  address: ["180 Layfatte street", "Passaic, New Jersey 07055"],
} as const;

/*
 * Mirrors the set in layout/Footer.tsx — same marks, same paths, same placeholder hrefs.
 * Duplicated rather than shared because lifting it into a module would mean editing the
 * footer, which is out of scope here; worth collapsing into one export next time that
 * file is open.
 */
const SOCIALS: Array<{ name: string; href: string; path: string }> = [
  {
    name: "Facebook",
    href: "#",
    path: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
  },
  {
    name: "X",
    href: "#",
    path: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
  },
  {
    name: "Instagram",
    href: "#",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z",
  },
  {
    name: "LinkedIn",
    href: "#",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
];

const SENT_COPY =
  "Thank you. Your email app should now be open with this message ready to send.";

interface Fields {
  name: string;
  email: string;
  message: string;
}

type Errors = Partial<Record<keyof Fields, string>>;

/** Permissive on purpose: tighter patterns reject valid addresses more often than typos. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(v: Fields): Errors {
  const errors: Errors = {};
  if (!v.name.trim()) errors.name = "Please enter your name.";
  if (!v.email.trim()) errors.email = "Please enter your email address.";
  else if (!EMAIL_SHAPE.test(v.email.trim()))
    errors.email = "That doesn't look like an email address.";
  if (!v.message.trim()) errors.message = "Please write a short message.";
  return errors;
}

/** A ruled line, not a box: no fill, no radius, one hairline under the text. */
const FIELD =
  "w-full border-0 border-b bg-transparent px-0 pb-2.5 pt-1 font-sans text-[15px] " +
  "text-[#1A1D21] placeholder:text-[#9A9A95] transition-colors duration-200 " +
  "focus:outline-none focus:ring-0";
const IDLE = "border-[#D9D9D6] focus:border-[#B8860B]";
const BAD = "border-[#C0563C] focus:border-[#C0563C]";
const LABEL = "block font-sans text-[13px] font-semibold text-[#0B1F3A]";

export const ContactPanel: React.FC = () => {
  const [values, setValues] = useState<Fields>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const set =
    (key: keyof Fields) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const next = event.target.value;
      setValues((prev) => ({ ...prev, [key]: next }));
      // Clear the error as soon as they start fixing it, rather than making them submit
      // again to find out whether they did.
      setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    };

  /** Composes the message and hands it to the visitor's mail client. See the file note. */
  const handoff = (v: Fields) => {
    const subject = `Website enquiry from ${v.name.trim()}`;
    const body = `${v.message.trim()}\n\n—\n${v.name.trim()}\n${v.email.trim()}`;
    window.location.href =
      `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      // Take focus to the first problem rather than leaving a keyboard user at the button.
      const first = (["name", "email", "message"] as const).find((k) => found[k]);
      if (first) formRef.current?.querySelector<HTMLElement>(`#c-${first}`)?.focus();
      return;
    }

    handoff(values);
    setSent(true);
    setValues({ name: "", email: "", message: "" });
  };

  const cls = (key: keyof Fields) => `${FIELD} ${errors[key] ? BAD : IDLE}`;
  const described = (key: keyof Fields) => (errors[key] ? `c-${key}-error` : undefined);

  return (
    /*
      pt clears the fixed navbar; the card is centred with real margin around it rather
      than running to the viewport edge. overflow-hidden on the card is what rounds the
      two panels' outer corners without either of them carrying a radius of its own — the
      navy is square-cornered internally, so the split down the middle stays a clean edge.
    */
    <div className="w-full px-4 pb-20 pt-28 sm:px-6 lg:pb-28 lg:pt-32">
      <div className="mx-auto w-full max-w-[1180px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-32px_rgba(11,31,58,0.28)]">
        <div className="grid grid-cols-1 lg:grid-cols-[30%_1fr]">
          {/* ------------------------------------------------- navy information panel */}
          <div className="relative overflow-hidden bg-[#0B1F3A] px-8 py-10 text-white sm:px-10 lg:py-12">
            {/*
              The two soft discs from the reference, bottom-right and mostly outside the
              panel. Low-contrast white rather than gold: gold at this size would be a
              second focal point competing with the button across the card.
            */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-16 -right-12 h-48 w-48 rounded-full bg-white/[0.06]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-10 right-10 h-24 w-24 rounded-full bg-white/[0.04]"
            />

            <div className="relative flex h-full flex-col">
              <div>
                <h1 className="font-sans text-[22px] font-semibold tracking-[-0.01em] text-white">
                  Contact Information
                </h1>
                <p className="mt-2 font-sans text-[14px] leading-[1.6] text-white/60">
                  Say something to start a live chat!
                </p>
              </div>

              <dl className="mt-12 space-y-8">
                <div className="flex gap-4">
                  <Mail
                    aria-hidden="true"
                    className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#D4AF37]"
                  />
                  <div>
                    <dt className="font-sans text-[13px] font-semibold text-white/50">
                      Email
                    </dt>
                    <dd className="mt-1.5">
                      <a
                        href={`mailto:${CONTACT.email}`}
                        className="font-sans text-[14px] text-white underline decoration-white/25 underline-offset-4 transition-colors duration-200 hover:decoration-[#D4AF37] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1F3A]"
                      >
                        {CONTACT.email}
                      </a>
                    </dd>
                  </div>
                </div>

                <div className="flex gap-4">
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#D4AF37]"
                  />
                  <div>
                    <dt className="font-sans text-[13px] font-semibold text-white/50">
                      Address
                    </dt>
                    <dd className="mt-1.5">
                      <address className="font-sans text-[14px] not-italic leading-[1.65] text-white">
                        {CONTACT.address.map((line) => (
                          <span key={line} className="block">
                            {line}
                          </span>
                        ))}
                      </address>
                    </dd>
                  </div>
                </div>
              </dl>

              {/* mt-auto pins the row to the foot of the panel on desktop, where the
                  column is tall; on mobile it simply follows the address. */}
              <ul className="mt-16 flex items-center gap-5 lg:mt-auto lg:pt-16">
                {SOCIALS.map((social) => (
                  <li key={social.name}>
                    <a
                      href={social.href}
                      aria-label={social.name}
                      className="block text-white/55 transition-colors duration-200 hover:text-[#D4AF37] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1F3A]"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="h-[18px] w-[18px] fill-current"
                      >
                        <path d={social.path} />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* --------------------------------------------------------- white form panel */}
          <div className="bg-white px-8 py-10 sm:px-12 lg:px-14 lg:py-14">
            <form ref={formRef} onSubmit={onSubmit} noValidate>
              {/* Name and email share a row on desktop, stack below it. */}
              <div className="grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-name" className={LABEL}>
                    Full Name
                  </label>
                  <input
                    id="c-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="full name"
                    value={values.name}
                    onChange={set("name")}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={described("name")}
                    className={`mt-3 ${cls("name")}`}
                  />
                  {errors.name && (
                    <p id="c-name-error" className="mt-2 text-[13px] text-[#C0563C]">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="c-email" className={LABEL}>
                    Email
                  </label>
                  <input
                    id="c-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="email address"
                    value={values.email}
                    onChange={set("email")}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={described("email")}
                    className={`mt-3 ${cls("email")}`}
                  />
                  {errors.email && (
                    <p id="c-email-error" className="mt-2 text-[13px] text-[#C0563C]">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-10">
                <label htmlFor="c-message" className={LABEL}>
                  Message
                </label>
                <textarea
                  id="c-message"
                  name="message"
                  rows={4}
                  placeholder="Write your message..."
                  value={values.message}
                  onChange={set("message")}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={described("message")}
                  className={`mt-3 resize-none ${cls("message")}`}
                />
                {errors.message && (
                  <p id="c-message-error" className="mt-2 text-[13px] text-[#C0563C]">
                    {errors.message}
                  </p>
                )}
              </div>

              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-end">
                {/*
                  aria-live so the confirmation is announced without stealing focus. It
                  says the mail client opened, which is what actually happened.
                */}
                <p
                  aria-live="polite"
                  className={`max-w-[38ch] text-[13px] leading-[1.6] text-[#57595E] transition-opacity duration-500 sm:mr-auto ${
                    sent ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {sent ? SENT_COPY : " "}
                </p>

                {/* The site's primary button, unchanged from the hero's. */}
                <button
                  type="submit"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#B8860B] px-7 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-[#0B1F3A] shadow-sm transition-colors duration-200 hover:bg-[#D4AF37] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:w-auto"
                >
                  Send Message
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPanel;
