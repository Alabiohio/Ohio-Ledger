import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ohio Ledger",
  description: "Receipt and EXP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='ohio-ledger-theme';var s=localStorage.getItem(k);var mode=(s==='light'||s==='dark'||s==='system')?s:'system';var d=mode==='dark'||(mode==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(mode==='system'){r.removeAttribute('data-theme');}else{r.setAttribute('data-theme',mode);}r.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="h-full text-[var(--foreground)] bg-[var(--background)] font-sans selection:bg-[var(--color-brand-peach)] selection:text-white">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
