import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Souschef - AI Recipe Assistant',
  description: 'AI-Powered Recipe Capture & Cooking Assistant',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
