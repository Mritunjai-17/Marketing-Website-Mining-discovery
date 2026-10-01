import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ServicesJourney } from "@/components/services";

export const metadata: Metadata = {
  title: "Services | Mining Discovery",
  description:
    "Investor growth, media authority, brand and digital, audience growth, executive visibility and direct audience — six service categories built for the mining industry.",
};

/*
 * The dedicated /services route is hidden in favor of the homepage where all services
 * are already showcased. ServicesJourney is preserved intact below for future use.
 */
export default function ServicesPage() {
  redirect("/");
  // Preserved for future re-enablement:
  // return <ServicesJourney />;
}
