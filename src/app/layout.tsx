import type { Metadata } from "next";
import {
  Doto,
  Geist,
  Geist_Mono,
  IBM_Plex_Mono,
  Rubik_Pixels,
  Space_Mono,
  VT323,
  Workbench,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const rubikPixels = Rubik_Pixels({
  variable: "--font-rubik-pixels",
  subsets: ["latin"],
  weight: "400",
});

const doto = Doto({
  variable: "--font-doto",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
});

const workbench = Workbench({
  variable: "--font-workbench",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Kyle Ronning",
  description: "Personal website of Kyle Ronning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexMono.variable} ${spaceMono.variable} ${vt323.variable} ${doto.variable} ${rubikPixels.variable} ${workbench.variable} h-full antialiased`}
    >
      <body className="site-root">{children}</body>
    </html>
  );
}
