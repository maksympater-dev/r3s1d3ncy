import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const spotifyMixUI = localFont({
  src: [
    {
      path: "./fonts/spotify_mix_ui_regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/spotify_mix_ui_bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-spotify-ui",
  display: "swap",
});

const spotifyMixTitle = localFont({
  src: [
    {
      path: "./fonts/spotify_mix_ui_title_bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/spotify_mix_ui_title_extrabold.otf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-spotify-title",
  display: "swap",
});

export const metadata: Metadata = {
  title: "R3S1D3NCY",
  description: "Phygital luxury retailtainment experience",
  icons: {
    icon: "/R3.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spotifyMixUI.variable} ${spotifyMixTitle.variable} h-full antialiased`}
    >
      {/* Добавляем bg-black для черного фона и text-white для светлого текста по умолчанию */}
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
        {children}
      </body>
    </html>
  );
}
