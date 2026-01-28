import "./globals.css";

export const metadata = {
  title: "Ministry of Good Ideas",
  description: "Swipe. Schmunzeln. Kopfschütteln. Weiter.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}