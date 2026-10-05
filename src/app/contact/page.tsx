import type { Metadata } from "next";
import { ContactPanel } from "@/components/contact";

export const metadata: Metadata = {
  title: "Contact | Mining Discovery",
  description:
    "Start a conversation with Mining Discovery — questions, projects and opportunities across the global mining industry.",
};

/*
 * The dedicated /contact route.
 * Redesigned to seamlessly match the Mining Discovery dark charcoal,
 * warm cream, and gold accent visual language.
 */
export default function ContactPage() {
  return (
    <div className="w-full min-h-screen bg-[#D9D6CE] font-sans text-[#0F172A]">
      <ContactPanel />
    </div>
  );
}
