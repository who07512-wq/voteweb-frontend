import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast-provider";
import { ClerkProvider } from "@clerk/nextjs";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Don Bosco Institute of Technology - Secure & Neutral Student Elections",
  description: "Secure, transparent, and neutral online election platform for student council voting.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      taskUrls={{
        "reset-password": "/reset-password",
      }}
    >
      {/* Suppress Clerk development-key console warning in dev/test builds */}
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `if(typeof window!=="undefined"){var _ow=console.warn;console.warn=function(){for(var _a=arguments,_i=0;_i<_a.length;_i++){if(typeof _a[_i]==="string"&&_a[_i].indexOf("Clerk:")!==-1&&_a[_i].indexOf("development")!==-1)return}_ow.apply(console,arguments)}}`,
        }}
      />
      <html lang="en" className={`${poppins.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col font-sans">
          <div id="clerk-captcha" />
          <ToastProvider>{children}</ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
