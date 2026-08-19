import { Cormorant, IBM_Plex_Sans } from "next/font/google";

const cormorant = Cormorant({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-cormorant",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

export default function RamadanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${cormorant.variable} ${plexSans.variable} contents`}>
      {children}
    </div>
  );
}
