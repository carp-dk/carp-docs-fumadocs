import { baseOptions } from '@/lib/layout.shared';
import { HomeLayout } from './m3e/layout';
import { Button } from './ui/button';
import { useAppLink } from './m3e/link';

export function NotFound() {
  const onClick = useAppLink('/docs');
  return (
    <HomeLayout {...baseOptions()}>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <h1 className="docs-hero-title m3-display-small">Page not found</h1>
        <p className="text-fd-muted-foreground">The documentation page you requested could not be found.</p>
        <Button href="/docs" role="link" variant="filled" onClickCapture={onClick}>Back to documentation</Button>
      </main>
    </HomeLayout>
  );
}
