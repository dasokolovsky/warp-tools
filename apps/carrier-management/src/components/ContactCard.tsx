import { Phone, Mail, Star } from 'lucide-react';
import type { CarrierContact } from '@/db/schema';
import { cn } from '@/lib/utils';

const roleLabels: Record<string, string> = {
  dispatch: 'Dispatch',
  billing: 'Billing',
  operations: 'Operations',
  owner: 'Owner',
  sales: 'Sales',
  other: 'Other',
};

interface ContactCardProps {
  contact: CarrierContact;
}

export function ContactCard({ contact }: ContactCardProps) {
  const initials = contact.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-[#0C1528] border border-[#1A2235] hover:border-[#2A3347] transition-colors">
      {/* Avatar */}
      <div className="flex-shrink-0 h-9 w-9 rounded-full bg-[#00C650]/10 border border-[#00C650]/20 flex items-center justify-center">
        <span className="text-xs font-semibold text-[#00C650]">{initials}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{contact.name}</span>
          {contact.isPrimary && (
            <Star className="h-3 w-3 text-[#FFAA00] fill-[#FFAA00] flex-shrink-0" />
          )}
        </div>
        <div className="text-xs text-[#8B95A5] mt-0.5">
          {roleLabels[contact.role ?? 'other'] ?? contact.role}
        </div>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className={cn(
                'flex items-center gap-1.5 text-xs text-[#8B95A5] hover:text-[#00C650] transition-colors'
              )}
            >
              <Phone className="h-3 w-3" />
              {contact.phone}
            </a>
          )}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-1.5 text-xs text-[#8B95A5] hover:text-[#00C650] transition-colors truncate"
            >
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{contact.email}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
