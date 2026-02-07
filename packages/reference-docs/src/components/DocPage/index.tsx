import { useParams } from '@tanstack/react-router';
import { slugToModule } from '../../lib/docs';

export function DocPage() {
  const { slug } = useParams({ strict: false });
  const mod = slugToModule[slug as string];
  if (!mod) return <div>Not found</div>;
  const Doc = mod.default;
  return <Doc />;
}
