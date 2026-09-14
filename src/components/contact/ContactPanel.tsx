"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, Mail, MapPin, Globe, Compass } from "lucide-react";
import styles from "./ContactPanel.module.css";

/**
 * The /contact page: a premium, cinematic, editorial contact experience
 * designed in the Mining Discovery dark charcoal, warm cream, and gold accent visual language.
 */

const CONTACT = {
  email: "info@miningdiscovery.com",
  basedIn: "Chandigarh · India",
  address: ["180 Layfatte street", "Passaic, New Jersey 07055"],
  focus: "Media · Branding · Investor Engagement",
} as const;

/*
 * Brand glyphs matching the site's footer and social links.
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
  company: string;
  subject: string;
  message: string;
}

type Errors = Partial<Record<keyof Fields, string>>;

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

export const ContactPanel: React.FC = () => {
  const [values, setValues] = useState<Fields>({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const set =
    (key: keyof Fields) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const next = event.target.value;
      setValues((prev) => ({ ...prev, [key]: next }));
      setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    };

  /** Composes the message and hands it to the visitor's mail client. */
  const handoff = (v: Fields) => {
    const emailSubject = v.subject.trim()
      ? `${v.subject.trim()} — ${v.name.trim()}`
      : `Website enquiry from ${v.name.trim()}`;
    const companyHeader = v.company.trim() ? `Company: ${v.company.trim()}\n\n` : "";
    const body = `${companyHeader}${v.message.trim()}\n\n—\n${v.name.trim()}\n${v.email.trim()}`;
    window.location.href =
      `mailto:${CONTACT.email}?subject=${encodeURIComponent(emailSubject)}` +
      `&body=${encodeURIComponent(body)}`;
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      const first = (["name", "email", "message"] as const).find((k) => found[k]);
      if (first) formRef.current?.querySelector<HTMLElement>(`#c-${first}`)?.focus();
      return;
    }

    handoff(values);
    setSent(true);
    setValues({ name: "", email: "", company: "", subject: "", message: "" });
  };

  const described = (key: keyof Fields) => (errors[key] ? `c-${key}-error` : undefined);

  return (
    <div className={styles.contactContainer}>
      <div className={styles.contactGlow} aria-hidden="true" />

      <div className={styles.contentWrapper}>
        {/* ------------------------------------------------- Top Introduction */}
        <div className="max-w-3xl">
          <div className={styles.eyebrowBadge}>
            <span className={styles.eyebrowDot} />
            GET IN TOUCH
          </div>

          <h1 className={styles.mainHeading}>
            LET&apos;S START A<br />CONVERSATION.
          </h1>

          <p className={styles.supportingCopy}>
            Have a mining project, brand or story ready to move further? Let&apos;s talk.
          </p>
        </div>

        {/* ------------------------------------------------- Two-Column Editorial Grid */}
        <div className={styles.mainGrid}>
          {/* ----------------------------------------------- LEFT: Mining Visual & Information */}
          <div className={styles.infoCard}>
            <div className={styles.visualContainer}>
              <Image
                src="/about/open-pit-golden-hour.png"
                alt="Mining Discovery Global Exploration and Operations"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className={styles.visualOverlay} />
              <div className={styles.visualBadge}>
                <Compass className="h-3 w-3 text-[#C49A3A]" />
                GLOBAL REACH · MINING OPERATIONS
              </div>
            </div>

            <div className={styles.infoBody}>
              <div>
                <h2 className={styles.infoHeading}>LET&apos;S TALK MINING.</h2>
                <p className={styles.infoDesc}>
                  Whether you&apos;re looking to amplify a project, strengthen your digital
                  presence, reach investors or put your company in front of the mining industry
                  — let&apos;s start the conversation.
                </p>
              </div>

              <dl className={styles.infoList}>
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>EMAIL</dt>
                  <dd className="mt-0.5">
                    <a
                      href={`mailto:${CONTACT.email}`}
                      className={`${styles.infoValue} ${styles.infoLink}`}
                    >
                      {CONTACT.email}
                    </a>
                  </dd>
                </div>

                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>BASED IN</dt>
                  <dd className={`${styles.infoValue} mt-0.5`}>
                    {CONTACT.basedIn}
                  </dd>
                </div>

                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>REGISTERED OFFICE</dt>
                  <dd className="mt-0.5">
                    <address className="font-sans text-[14px] not-italic leading-[1.6] text-[#F5F1E8]">
                      {CONTACT.address.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </address>
                  </dd>
                </div>

                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>FOCUS</dt>
                  <dd className={`${styles.infoValue} mt-0.5`}>
                    {CONTACT.focus}
                  </dd>
                </div>
              </dl>

              {/* Social Links */}
              <div className={styles.socialRow}>
                {SOCIALS.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    aria-label={social.name}
                    className={styles.socialBtn}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-4 w-4 fill-current"
                    >
                      <path d={social.path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ----------------------------------------------- RIGHT: Contact Form */}
          <div className={styles.formCard}>
            <form ref={formRef} onSubmit={onSubmit} noValidate>
              {/* Row 1: Full Name & Email */}
              <div className={styles.formRow2}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="c-name" className={styles.fieldLabel}>
                    Full Name <span className="text-[#C49A3A]">*</span>
                  </label>
                  <input
                    id="c-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={values.name}
                    onChange={set("name")}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={described("name")}
                    className={`${styles.fieldInput} ${errors.name ? styles.fieldInputBad : ""}`}
                  />
                  {errors.name && (
                    <p id="c-name-error" className={styles.fieldError}>
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="c-email" className={styles.fieldLabel}>
                    Email Address <span className="text-[#C49A3A]">*</span>
                  </label>
                  <input
                    id="c-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={values.email}
                    onChange={set("email")}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={described("email")}
                    className={`${styles.fieldInput} ${errors.email ? styles.fieldInputBad : ""}`}
                  />
                  {errors.email && (
                    <p id="c-email-error" className={styles.fieldError}>
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Company & Subject */}
              <div className={`${styles.formRow2} mt-8 sm:mt-10`}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="c-company" className={styles.fieldLabel}>
                    Company / Organization
                  </label>
                  <input
                    id="c-company"
                    name="company"
                    type="text"
                    autoComplete="organization"
                    placeholder="Mining company or project name"
                    value={values.company}
                    onChange={set("company")}
                    className={styles.fieldInput}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="c-subject" className={styles.fieldLabel}>
                    Subject
                  </label>
                  <input
                    id="c-subject"
                    name="subject"
                    type="text"
                    placeholder="Area of interest / enquiry"
                    value={values.subject}
                    onChange={set("subject")}
                    className={styles.fieldInput}
                  />
                </div>
              </div>

              {/* Row 3: Message */}
              <div className={`${styles.fieldGroup} mt-8 sm:mt-10`}>
                <label htmlFor="c-message" className={styles.fieldLabel}>
                  Message <span className="text-[#C49A3A]">*</span>
                </label>
                <textarea
                  id="c-message"
                  name="message"
                  rows={4}
                  placeholder="Tell us about your project, objectives, or timeline..."
                  value={values.message}
                  onChange={set("message")}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={described("message")}
                  className={`${styles.fieldInput} resize-none ${
                    errors.message ? styles.fieldInputBad : ""
                  }`}
                />
                {errors.message && (
                  <p id="c-message-error" className={styles.fieldError}>
                    {errors.message}
                  </p>
                )}
              </div>

              {/* Submit Action Bar */}
              <div className={styles.submitBar}>
                <p
                  aria-live="polite"
                  className={`${styles.sentMessage} ${
                    sent ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                >
                  {sent ? SENT_COPY : " "}
                </p>

                <button type="submit" className={styles.submitBtn}>
                  Send Message
                  <ArrowRight className={styles.submitArrow} />
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
