import { Building2, Cpu, MapPin, Truck, type LucideIcon } from 'lucide-react';
import type { EntityStatus, EntityType } from './schema';

export const ENTITY_TYPES: Record<EntityType, { label: string; icon: LucideIcon }> = {
  vehicle: { label: 'Kendaraan', icon: Truck },
  iot_device: { label: 'Perangkat IoT', icon: Cpu },
  facility: { label: 'Fasilitas', icon: Building2 },
  other: { label: 'Lainnya', icon: MapPin },
};

export const ENTITY_STATUSES: Record<EntityStatus, { label: string; markerClassName: string }> = {
  active: { label: 'Aktif', markerClassName: 'bg-status-active' },
  maintenance: { label: 'Pemeliharaan', markerClassName: 'bg-status-maintenance' },
  inactive: { label: 'Nonaktif', markerClassName: 'bg-status-inactive' },
};
