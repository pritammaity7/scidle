import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SciGuess - Guess the Scientist",
  description: "A Wordle-like game where you guess famous scientists and mathematicians. Test your knowledge of scientific history!",
  keywords: ["SciGuess", "Wordle", "scientists", "mathematicians", "quiz", "puzzle", "daily game", "science", "history"],
  authors: [{ name: "SciGuess Team" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧪</text></svg>",
  },
  openGraph: {
    title: "SciGuess - Guess the Scientist",
    description: "A Wordle-like game where you guess famous scientists and mathematicians",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SciGuess - Guess the Scientist",
    description: "A Wordle-like game where you guess famous scientists and mathematicians",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
