import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { companySettings, companySettingsMaster } from "@shared/schema";

// Type for the flattened result
export type CompanySettingWithMaster = {
  id: string;
  companySettingsMasterId: string;
  settingCode: string | null;
  settingName: string | null;
  settingValue: string | null;
  companyId: string | null;
  createdDate: Date | null;
  lastUpdatedDate: Date | null;
  lastUpdatedBy: string | null;
  settingFunctionalDomain: string | null;
  settingDescription: string | null;
  settingValues: string | null;
  defaultValue: string | null;
};

export class BusinessObjectsManagerStorage {
  /**
   * Get company settings by functional domain
   * @param settingFunctionalDomain - The functional domain to filter by
   * @param companyId - The company ID to filter by
   * @returns Array of company settings with master data
   */
  async GetCompanySettingsByFunctionalDomain(
    settingFunctionalDomain: string,
    companyId: string
  ): Promise<CompanySettingWithMaster[]> {
    const results = await db
      .select({
        id: companySettings.id,
        companySettingsMasterId: companySettings.companySettingsMasterId,
        settingCode: companySettings.settingCode,
        settingName: companySettings.settingName,
        settingValue: companySettings.settingValue,
        companyId: companySettings.companyId,
        createdDate: companySettings.createdDate,
        lastUpdatedDate: companySettings.lastUpdatedDate,
        lastUpdatedBy: companySettings.lastUpdatedBy,
        settingFunctionalDomain: companySettingsMaster.settingFunctionalDomain,
        settingDescription: companySettingsMaster.settingDescription,
        settingValues: companySettingsMaster.settingValues,
        defaultValue: companySettingsMaster.defaultValue,
      })
      .from(companySettings)
      .innerJoin(
        companySettingsMaster,
        eq(companySettings.companySettingsMasterId, companySettingsMaster.id)
      )
      .where(
        and(
          eq(companySettingsMaster.settingFunctionalDomain, settingFunctionalDomain),
          eq(companySettings.companyId, companyId)
        )
      );

    return results as CompanySettingWithMaster[];
  }
}

// Export singleton instance
export const businessObjectsManagerStorage = new BusinessObjectsManagerStorage();
