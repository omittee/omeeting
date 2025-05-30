import type { Route } from './+types/root'

import {
  isRouteErrorResponse,
  Links,
  Meta,
  Navigate,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from 'react-router'
import { Toaster } from 'sonner'
import { authTokenKey, userIdKey } from './constants'
import stylesheet from './index.css?url'
import '@livekit/components-styles'

export const links: Route.LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />

        <script src="/app-vad-asr.js"></script>
        <script src="/sherpa-onnx-wasm-main-vad-asr.js"></script>
        <script src="/sherpa-onnx-asr.js"></script>
        <script src="/sherpa-onnx-vad.js"></script>
      </body>
    </html>
  )
}

export default function App() {
  const location = useLocation()
  if (!localStorage.getItem(authTokenKey) && location.pathname !== '/auth') {
    return <Navigate to="/auth" replace />
  }
  return (
    <div className="w-screen h-screen bg-muted/50">
      {' '}
      <Outlet />
      <Toaster></Toaster>
    </div>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details
      = error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details
  }
  else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
