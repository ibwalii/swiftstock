import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/login'); // Changed to redirect to login page
  return null;
}
