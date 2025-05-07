import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/pos');
  // Important: A component that calls `redirect` must be a server component.
  // If you need to return JSX, ensure redirect is called before any JSX is returned.
  // For a simple redirect, returning null or nothing after redirect is fine.
  return null;
}
