import { Box } from 'lucide-react';
import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <div className="flex items-center gap-2" aria-label="SwiftStock Logo">
       <Box className="h-7 w-7 text-primary" />
      <span className="text-xl font-semibold text-primary">SwiftStock</span>
    </div>
  );
}
