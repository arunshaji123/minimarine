export const Role = {
  ADMIN: 'admin',
  SHIP_MGMT: 'ship_management',
  OWNER: 'owner',
  SURVEYOR: 'surveyor',
  CARGO_MANAGER: 'cargo_manager',
  USER: 'user',
};

export const getDashboardPathByRole = (role) => {
  switch (role) {
    case Role.ADMIN:
      return '/dashboard/admin';
    case Role.SHIP_MGMT:
      return '/dashboard/ship';
    case Role.OWNER:
      return '/dashboard/owner';
    case Role.SURVEYOR:
      return '/dashboard/surveyor';
    case Role.CARGO_MANAGER:
      return '/dashboard/cargo';
    case Role.USER:
    default:
      return '/dashboard/owner';
  }
};