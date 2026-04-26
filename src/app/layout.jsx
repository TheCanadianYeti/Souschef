import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'SousChef - AI Recipe Assistant',
  description: 'AI-Powered Recipe Capture & Cooking Assistant',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <ThemeProvider>
          <Navbar />
          <main className="flex-grow pt-16">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
