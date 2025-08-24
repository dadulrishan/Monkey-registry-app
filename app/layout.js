import './globals.css'
import 'bootstrap/dist/css/bootstrap.min.css'

export const metadata = {
  title: '🐒 Monkey Registry - Track & Discover Primates',
  description: 'A comprehensive monkey registry with AI-powered descriptions and elegant management tools',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐒</text></svg>" />
      </head>
      <body className="bg-background">
        {children}
      </body>
    </html>
  )
}