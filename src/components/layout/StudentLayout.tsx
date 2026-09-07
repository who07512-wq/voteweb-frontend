"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { studentApi } from "@/lib/api/students";

export interface StudentLayoutProps {
  children: React.ReactNode;
  studentName?: string;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({
  children,
  studentName,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [name, setName] = useState(studentName || "Student");

  useEffect(() => {
    studentApi.getProfile().then((profile) => {
      if (profile?.name) setName(profile.name);
    }).catch(() => {});
  }, []);

  return (
    <div className="flex h-screen bg-bg-primary dark:bg-[#131524] overflow-hidden">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onToggleMenu={() => setMobileNavOpen((prev) => !prev)}
          studentName={name}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
