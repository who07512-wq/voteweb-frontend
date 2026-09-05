"use client";

import React from "react";
import { CadLayout } from "@/components/cad-dashboard/CadLayout";

export default function CadRootLayout({ children }: { children: React.ReactNode }) {
  return <CadLayout>{children}</CadLayout>;
}
