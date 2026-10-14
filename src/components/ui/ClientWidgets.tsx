"use client";

import dynamic from "next/dynamic";

const MiningAICHatWidget = dynamic(
  () => import("@/components/ui/MiningAICHatWidget"),
  { ssr: false }
);

export default function ClientWidgets() {
  return <MiningAICHatWidget />;
}
