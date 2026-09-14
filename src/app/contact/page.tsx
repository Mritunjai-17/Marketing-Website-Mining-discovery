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
    <div className="w-full min-h-screen bg-[#11110F] font-sans text-[#F5F1E8]">
      <ContactPanel />
    </div>
  );
}
