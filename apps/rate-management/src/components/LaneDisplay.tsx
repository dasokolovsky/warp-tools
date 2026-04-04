import { ArrowRight } from 'lucide-react';

interface LaneDisplayProps {
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LaneDisplay({
  originCity,
  originState,
  destCity,
  destState,
  size = 'md',
}: LaneDisplayProps) {
  const textSize =
    size === 'lg' ? 'text-2xl font-bold' :
    size === 'sm' ? 'text-sm font-medium' :
    'text-base font-semibold';

  const arrowSize =
    size === 'lg' ? 'h-6 w-6' :
    size === 'sm' ? 'h-3 w-3' :
    'h-4 w-4';

  return (
    <span className={`inline-flex items-center gap-2 text-white ${textSize}`}>
      <span>{originCity}, {originState}</span>
      <ArrowRight className={`${arrowSize} text-[#8B95A5] flex-shrink-0`} />
      <span>{destCity}, {destState}</span>
    </span>
  );
}
