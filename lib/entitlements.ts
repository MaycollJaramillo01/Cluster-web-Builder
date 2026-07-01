type CommercialUser = {
  role: string;
  planStatus: string;
};

export function hasProAccess(user: CommercialUser | null | undefined) {
  return Boolean(user && (user.role === "ADMIN" || user.planStatus === "ACTIVE"));
}

export const proRequiredResponse = {
  error: "Activa Cluster Pro para completar esta acción.",
  upgradeRequired: true,
};
