import { Building, User as UserIcon } from "lucide-react";
import { type AccountWithOwner } from "@shared/schema";

export const getAccountIcon = (account: AccountWithOwner) => {
  const isPerson =
    account.isPersonAccount ||
    account.isCompanyContact ||
    account.isSelfEmployed;
  const isEntity = account.isLegalEntity || account.isShippingAddress;

  if (isPerson) {
    return UserIcon;
  }
  if (isEntity) {
    return Building;
  }
  return Building; // Default to Building
};

export const getAccountTypeLabel = (account: AccountWithOwner) => {
  const labels: string[] = [];

  if (account.isPersonAccount) labels.push("Person Account");
  if (account.isCompanyContact) labels.push("Company Contact");
  if (account.isSelfEmployed) labels.push("Self Employed");
  if (account.isLegalEntity) labels.push("Legal Entity");
  if (account.isShippingAddress) labels.push("Shipping Address");

  return labels.length > 0 ? labels.join(" | ") : "Account Details";
};
