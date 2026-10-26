import { createFileRoute, redirect } from '@tanstack/react-router';

// The site opens straight on the docs; there is no landing page, so the redirect is permanent.
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ href: '/docs', statusCode: 308 });
  },
});
