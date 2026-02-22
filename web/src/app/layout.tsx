import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const fustat = localFont({
  src: '../../../assets/fonts/Fustat-Variable.ttf',
  variable: '--font-fustat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Doorstep — Property Move Management',
  description: 'Manage move-ins and move-outs for your properties.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fustat.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
