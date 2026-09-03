"use client";

import React from "react";
import { Shield, LogOut, Menu, Bell, ChevronDown, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}