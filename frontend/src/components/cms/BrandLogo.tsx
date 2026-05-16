import Link from 'next/link';
import type { BrandAsset } from '@/lib/cms';

interface Props { brand: Record<string, BrandAsset>; appName: string; href?: string }

export function BrandLogo({ brand, appName, href = '/' }: Props): JSX.Element {
  const logo = brand['logo'];
  return (
    <Link href={href} className="brand" aria-label={appName}>
      {logo ? (
        <img src={logo.url} alt={appName} width={28} height={28} style={{ borderRadius: 8 }} />
      ) : (
        <span className="brand__mark" />
      )}
      <span>{appName}</span>
    </Link>
  );
}
