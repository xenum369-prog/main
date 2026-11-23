import { Role } from "@prisma/client";
import { NO_LOCATION_ID, type AuthUser } from "@/lib/auth";

export function canAccessLocation(user: AuthUser, locationId: string) {
  return user.role === Role.ADMIN || user.locationId === locationId;
}

export function scopedLocation(user: AuthUser) {
  return user.role === Role.ADMIN ? undefined : user.locationId ?? NO_LOCATION_ID;
}
