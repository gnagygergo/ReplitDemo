import {
  type Company,
  type InsertCompany,
  type User,
  type UpsertUser,
  type Release,
  type InsertRelease,
  type Language,
  type InsertLanguage,
  type Translation,
  type InsertTranslation,
  type DevPattern,
  type InsertDevPattern,
  type Licence,
  type InsertLicence,
  type LicenceAgreementTemplate,
  type InsertLicenceAgreementTemplate,
  type LicenceAgreementTemplateWithLicence,
  type LicenceAgreement,
  type InsertLicenceAgreement,
  type LicenceAgreementWithDetails,
  type KnowledgeArticle,
  type InsertKnowledgeArticle,
  type KnowledgeArticleWithAuthor,
  type CompanySettingMasterDomain,
  type InsertCompanySettingMasterDomain,
  type CompanySettingMasterFunctionality,
  type InsertCompanySettingMasterFunctionality,
  type CompanySettingsMaster,
  type InsertCompanySettingsMaster,
  companies,
  users,
  releases,
  languages,
  translations,
  devPatterns,
  licences,
  licenceAgreementTemplates,
  licenceAgreements,
  knowledgeArticles,
  companySettingMasterDomains,
  companySettingMasterFunctionalities,
  companySettingsMaster,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, sql, lte, gte } from "drizzle-orm";
import * as bcrypt from "bcrypt";

export interface ISetupStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUsers(companyContext?: string): Promise<User[]>;
  getUsersByCompany(req: any, companyId?: string): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  verifyUserPassword(email: string, password: string): Promise<User | null>;
  verifyGlobalAdmin(req: any): Promise<boolean>;
  verifyCompanyAdmin(req: any): Promise<boolean>;

  // Company methods
  getCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  getCompanyByRegistrationId(registrationId: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<boolean>;

  // Release methods
  getReleases(companyContext?: string): Promise<Release[]>;
  getRelease(id: string, companyContext?: string): Promise<Release | undefined>;
  createRelease(release: InsertRelease): Promise<Release>;
  updateRelease(id: string, release: Partial<InsertRelease>, companyContext?: string): Promise<Release | undefined>;
  deleteRelease(id: string, companyContext?: string): Promise<boolean>;

  // Knowledge Article methods (Global - no company context)
  getKnowledgeArticles(): Promise<Omit<KnowledgeArticleWithAuthor, 'articleContent'>[]>;
  getKnowledgeArticle(id: string): Promise<KnowledgeArticleWithAuthor | undefined>;
  createKnowledgeArticle(article: InsertKnowledgeArticle): Promise<KnowledgeArticle>;
  updateKnowledgeArticle(id: string, article: Partial<InsertKnowledgeArticle>): Promise<KnowledgeArticle | undefined>;
  deleteKnowledgeArticle(id: string): Promise<boolean>;

  // Language methods (Global - no company context)
  getLanguages(): Promise<Language[]>;
  getLanguage(id: string): Promise<Language | undefined>;
  createLanguage(language: InsertLanguage): Promise<Language>;
  updateLanguage(id: string, language: Partial<InsertLanguage>): Promise<Language | undefined>;
  deleteLanguage(id: string): Promise<boolean>;

  // Translation methods (Global - no company context)
  getTranslations(): Promise<Translation[]>;
  getTranslation(id: string): Promise<Translation | undefined>;
  createTranslation(translation: InsertTranslation): Promise<Translation>;
  updateTranslation(id: string, translation: Partial<InsertTranslation>): Promise<Translation | undefined>;
  deleteTranslation(id: string): Promise<boolean>;

  // Dev Pattern methods (Global - no company context)
  getDevPatterns(): Promise<DevPattern[]>;
  getDevPattern(id: string): Promise<DevPattern | undefined>;
  createDevPattern(devPattern: InsertDevPattern): Promise<DevPattern>;
  updateDevPattern(id: string, devPattern: Partial<InsertDevPattern>): Promise<DevPattern | undefined>;
  deleteDevPattern(id: string): Promise<boolean>;

  // Licence methods (Global - no company context)
  getLicences(): Promise<Licence[]>;
  getLicence(id: string): Promise<Licence | undefined>;
  createLicence(licence: InsertLicence): Promise<Licence>;
  updateLicence(id: string, licence: Partial<InsertLicence>): Promise<Licence | undefined>;
  deleteLicence(id: string): Promise<boolean>;

  // Licence Agreement Template methods (Global - no company context)
  getLicenceAgreementTemplates(): Promise<LicenceAgreementTemplateWithLicence[]>;
  getLicenceAgreementTemplate(id: string): Promise<LicenceAgreementTemplateWithLicence | undefined>;
  getActiveOnlineRegistrationTemplate(): Promise<LicenceAgreementTemplateWithLicence | undefined>;
  createLicenceAgreementTemplate(template: InsertLicenceAgreementTemplate): Promise<LicenceAgreementTemplate>;
  updateLicenceAgreementTemplate(id: string, template: Partial<InsertLicenceAgreementTemplate>): Promise<LicenceAgreementTemplate | undefined>;
  deleteLicenceAgreementTemplate(id: string): Promise<boolean>;

  // Licence Agreement methods
  getLicenceAgreements(): Promise<LicenceAgreementWithDetails[]>;
  getLicenceAgreement(id: string): Promise<LicenceAgreementWithDetails | undefined>;
  getLicenceAgreementsByCompany(companyId: string): Promise<LicenceAgreementWithDetails[]>;
  createLicenceAgreement(agreement: InsertLicenceAgreement): Promise<LicenceAgreement>;
  updateLicenceAgreement(id: string, agreement: Partial<InsertLicenceAgreement>): Promise<LicenceAgreement | undefined>;
  deleteLicenceAgreement(id: string): Promise<boolean>;
  actualizeLicenceAgreementSeatsUsed(licenceAgreementId: string): Promise<LicenceAgreement | undefined>;
  createLicenceAgreementAutomated(licenceAgreementTemplateId: string, companyId: string): Promise<LicenceAgreement>;

  // Company Setting Master Domain methods (Global - no company context)
  getCompanySettingMasterDomains(): Promise<CompanySettingMasterDomain[]>;
  getCompanySettingMasterDomain(id: string): Promise<CompanySettingMasterDomain | undefined>;
  createCompanySettingMasterDomain(domain: InsertCompanySettingMasterDomain): Promise<CompanySettingMasterDomain>;
  updateCompanySettingMasterDomain(id: string, domain: Partial<InsertCompanySettingMasterDomain>): Promise<CompanySettingMasterDomain | undefined>;
  deleteCompanySettingMasterDomain(id: string): Promise<boolean>;

  // Company Setting Master Functionality methods (Global - no company context)
  getCompanySettingMasterFunctionalities(): Promise<CompanySettingMasterFunctionality[]>;
  getCompanySettingMasterFunctionality(id: string): Promise<CompanySettingMasterFunctionality | undefined>;
  createCompanySettingMasterFunctionality(functionality: InsertCompanySettingMasterFunctionality): Promise<CompanySettingMasterFunctionality>;
  updateCompanySettingMasterFunctionality(id: string, functionality: Partial<InsertCompanySettingMasterFunctionality>): Promise<CompanySettingMasterFunctionality | undefined>;
  deleteCompanySettingMasterFunctionality(id: string): Promise<boolean>;

  // Company Settings Master methods (Global - no company context)
  getCompanySettingsMasters(): Promise<CompanySettingsMaster[]>;
  getCompanySettingsMaster(id: string): Promise<CompanySettingsMaster | undefined>;
  createCompanySettingsMaster(settingMaster: InsertCompanySettingsMaster): Promise<CompanySettingsMaster>;
  updateCompanySettingsMaster(id: string, settingMaster: Partial<InsertCompanySettingsMaster>): Promise<CompanySettingsMaster | undefined>;
  deleteCompanySettingsMaster(id: string): Promise<boolean>;

  // Helper methods
  GetCompanyContext(req: any): Promise<string | null>;
  GetCompanyNameBasedOnContext(req: any): Promise<string | null>;
  setCompanyContext(userId: string): Promise<void>;
  clearCompanyContext(userId: string): Promise<void>;
  switchCompanyContext(userId: string, newCompanyId: string): Promise<void>;
}

export class SetupDatabaseStorage implements ISetupStorage {
  // Helper methods
  async GetCompanyContext(req: any): Promise<string | null> {
    try {
      const sessionUser = (req.session as any).user;
      let userId;

      if (sessionUser && sessionUser.isDbUser) {
        userId = sessionUser.id;
      } else {
        userId = req.user?.claims?.sub;
      }
      if (!userId) return null;
      const user = await this.getUser(userId);
      return user?.companyContext || null;
    } catch (error) {
      console.error("Error getting company context:", error);
      return null;
    }
  }

  async GetCompanyNameBasedOnContext(req: any): Promise<string | null> {
    try {
      const companyId = await this.GetCompanyContext(req);
      if (!companyId) return null;

      const company = await db
        .select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .limit(1);

      return company[0]?.companyOfficialName || null;
    } catch (error) {
      console.error("Error getting company name:", error);
      return null;
    }
  }

  async verifyGlobalAdmin(req: any): Promise<boolean> {
    try {
      const sessionUser = (req.session as any).user;
      let userId;
      if (sessionUser && sessionUser.isDbUser) {
        userId = sessionUser.id;
      } else {
        userId = req.user?.claims?.sub;
      }

      if (!userId) return false;

      const user = await this.getUser(userId);
      return user?.isGlobalAdmin || false;
    } catch (error) {
      console.error("Error verifying global admin:", error);
      return false;
    }
  }

  async verifyCompanyAdmin(req: any): Promise<boolean> {
    try {
      const sessionUser = (req.session as any).user;
      let userId;
      if (sessionUser && sessionUser.isDbUser) {
        userId = sessionUser.id;
      } else {
        userId = req.user?.claims?.sub;
      }

      if (!userId) return false;

      const user = await this.getUser(userId);
      return user?.isAdmin || false;
    } catch (error) {
      console.error("Error verifying company admin:", error);
      return false;
    }
  }

  async setCompanyContext(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user || !user.companyId) {
      throw new Error("User not found or has no company association");
    }

    await db
      .update(users)
      .set({
        companyContext: user.companyId,
      })
      .where(eq(users.id, userId));

    await pool.query(`SET LOCAL app.current_user_id = '${userId}'`);

    console.log(
      "[RLS DEBUG] Set company context for user:",
      userId,
      "to company:",
      user.companyId,
    );
  }

  async clearCompanyContext(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        companyContext: null,
      })
      .where(eq(users.id, userId));

    console.log("[RLS DEBUG] Cleared company context for user:", userId);
  }

  async switchCompanyContext(userId: string, newCompanyId: string): Promise<void> {
    await db
      .update(users)
      .set({
        companyContext: newCompanyId,
      })
      .where(eq(users.id, userId));

    console.log(
      "[RLS DEBUG] Switched company context for user:",
      userId,
      "to company:",
      newCompanyId,
    );
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUsers(companyContext?: string): Promise<User[]> {
    if (!companyContext) {
      return [];
    }
    return await db
      .select()
      .from(users)
      .where(eq(users.companyId, companyContext));
  }

  async getUsersByCompany(req: any, companyId?: string): Promise<User[]> {
    const isGlobalAdmin = await this.verifyGlobalAdmin(req);
    if (!isGlobalAdmin) {
      return [];
    }
    if (!companyId) {
      return [];
    }
    return await db.select().from(users).where(eq(users.companyId, companyId));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async verifyUserPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.password) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    if (!userData.licenceAgreementId || userData.licenceAgreementId.trim() === '') {
      throw new Error('Licence Agreement is required. Please select a Licence Agreement.');
    }

    const saltRounds = 10;
    const hashedUserData = { ...userData };

    if (userData.password) {
      hashedUserData.password = await bcrypt.hash(userData.password, saltRounds);
    }

    const [user] = await db.insert(users).values(hashedUserData).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined> {
    if ('licenceAgreementId' in updates) {
      if (!updates.licenceAgreementId || updates.licenceAgreementId.trim() === '') {
        throw new Error('Licence Agreement is required. Please select a Licence Agreement.');
      }
    }

    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Company methods
  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id));

    return company || undefined;
  }

  async getCompanyByRegistrationId(registrationId: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.companyRegistrationId, registrationId));

    return company || undefined;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(insertCompany)
      .returning();
    return company;
  }

  async updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set(updates)
      .where(eq(companies.id, id))
      .returning();
    return company || undefined;
  }

  async deleteCompany(id: string): Promise<boolean> {
    const result = await db.delete(companies).where(eq(companies.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Release methods
  async getReleases(companyContext?: string): Promise<Release[]> {
    if (!companyContext) {
      return [];
    }

    return await db
      .select()
      .from(releases)
      .where(eq(releases.companyId, companyContext))
      .orderBy(releases.order);
  }

  async getRelease(id: string, companyContext?: string): Promise<Release | undefined> {
    if (!companyContext) {
      return undefined;
    }

    const [release] = await db
      .select()
      .from(releases)
      .where(and(eq(releases.id, id), eq(releases.companyId, companyContext)));
    return release || undefined;
  }

  async createRelease(insertRelease: InsertRelease): Promise<Release> {
    const [release] = await db
      .insert(releases)
      .values(insertRelease)
      .returning();
    return release;
  }

  async updateRelease(id: string, updates: Partial<InsertRelease>, companyContext?: string): Promise<Release | undefined> {
    if (!companyContext) {
      return undefined;
    }

    const { companyId, ...allowedUpdates } = updates as any;

    const [release] = await db
      .update(releases)
      .set(allowedUpdates)
      .where(and(eq(releases.id, id), eq(releases.companyId, companyContext)))
      .returning();
    return release || undefined;
  }

  async deleteRelease(id: string, companyContext?: string): Promise<boolean> {
    if (!companyContext) {
      return false;
    }

    const result = await db
      .delete(releases)
      .where(and(eq(releases.id, id), eq(releases.companyId, companyContext)));
    return (result.rowCount ?? 0) > 0;
  }

  // Language methods (Global - no company context filtering)
  async getLanguages(): Promise<Language[]> {
    return await db
      .select()
      .from(languages)
      .orderBy(languages.languageName);
  }

  async getLanguage(id: string): Promise<Language | undefined> {
    const [language] = await db
      .select()
      .from(languages)
      .where(eq(languages.id, id));
    return language || undefined;
  }

  async createLanguage(insertLanguage: InsertLanguage): Promise<Language> {
    const [language] = await db
      .insert(languages)
      .values(insertLanguage)
      .returning();
    return language;
  }

  async updateLanguage(id: string, updates: Partial<InsertLanguage>): Promise<Language | undefined> {
    const [language] = await db
      .update(languages)
      .set(updates)
      .where(eq(languages.id, id))
      .returning();
    return language || undefined;
  }

  async deleteLanguage(id: string): Promise<boolean> {
    const result = await db
      .delete(languages)
      .where(eq(languages.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Translation methods (Global - no company context filtering)
  async getTranslations(): Promise<Translation[]> {
    return await db
      .select()
      .from(translations)
      .orderBy(translations.labelCode);
  }

  async getTranslation(id: string): Promise<Translation | undefined> {
    const [translation] = await db
      .select()
      .from(translations)
      .where(eq(translations.id, id));
    return translation || undefined;
  }

  async createTranslation(insertTranslation: InsertTranslation): Promise<Translation> {
    const [translation] = await db
      .insert(translations)
      .values(insertTranslation)
      .returning();
    return translation;
  }

  async updateTranslation(id: string, updates: Partial<InsertTranslation>): Promise<Translation | undefined> {
    const [translation] = await db
      .update(translations)
      .set(updates)
      .where(eq(translations.id, id))
      .returning();
    return translation || undefined;
  }

  async deleteTranslation(id: string): Promise<boolean> {
    const result = await db
      .delete(translations)
      .where(eq(translations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Dev Pattern methods (Global - no company context filtering)
  async getDevPatterns(): Promise<DevPattern[]> {
    return await db
      .select()
      .from(devPatterns)
      .orderBy(devPatterns.name);
  }

  async getDevPattern(id: string): Promise<DevPattern | undefined> {
    const [devPattern] = await db
      .select()
      .from(devPatterns)
      .where(eq(devPatterns.id, id));
    return devPattern || undefined;
  }

  async createDevPattern(insertDevPattern: InsertDevPattern): Promise<DevPattern> {
    const [devPattern] = await db
      .insert(devPatterns)
      .values(insertDevPattern)
      .returning();
    return devPattern;
  }

  async updateDevPattern(id: string, updates: Partial<InsertDevPattern>): Promise<DevPattern | undefined> {
    const [devPattern] = await db
      .update(devPatterns)
      .set(updates)
      .where(eq(devPatterns.id, id))
      .returning();
    return devPattern || undefined;
  }

  async deleteDevPattern(id: string): Promise<boolean> {
    const result = await db
      .delete(devPatterns)
      .where(eq(devPatterns.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Licence methods (Global - no company context filtering)
  async getLicences(): Promise<Licence[]> {
    return await db
      .select()
      .from(licences)
      .orderBy(licences.name);
  }

  async getLicence(id: string): Promise<Licence | undefined> {
    const [licence] = await db
      .select()
      .from(licences)
      .where(eq(licences.id, id));
    return licence || undefined;
  }

  async createLicence(insertLicence: InsertLicence): Promise<Licence> {
    const [licence] = await db
      .insert(licences)
      .values(insertLicence)
      .returning();
    return licence;
  }

  async updateLicence(id: string, updates: Partial<InsertLicence>): Promise<Licence | undefined> {
    const [licence] = await db
      .update(licences)
      .set(updates)
      .where(eq(licences.id, id))
      .returning();
    return licence || undefined;
  }

  async deleteLicence(id: string): Promise<boolean> {
    const result = await db
      .delete(licences)
      .where(eq(licences.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Licence Agreement Template methods (Global - no company context filtering)
  async getLicenceAgreementTemplates(): Promise<LicenceAgreementTemplateWithLicence[]> {
    const results = await db
      .select()
      .from(licenceAgreementTemplates)
      .leftJoin(licences, eq(licenceAgreementTemplates.licenceId, licences.id))
      .orderBy(licenceAgreementTemplates.name);
    
    return results.map(row => ({
      ...row.licence_agreement_templates,
      licence: row.licences!,
    }));
  }

  async getLicenceAgreementTemplate(id: string): Promise<LicenceAgreementTemplateWithLicence | undefined> {
    const [result] = await db
      .select()
      .from(licenceAgreementTemplates)
      .leftJoin(licences, eq(licenceAgreementTemplates.licenceId, licences.id))
      .where(eq(licenceAgreementTemplates.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.licence_agreement_templates,
      licence: result.licences!,
    };
  }

  async getActiveOnlineRegistrationTemplate(): Promise<LicenceAgreementTemplateWithLicence | undefined> {
    const currentDate = new Date().toISOString().split('T')[0];
    
    const [result] = await db
      .select()
      .from(licenceAgreementTemplates)
      .leftJoin(licences, eq(licenceAgreementTemplates.licenceId, licences.id))
      .where(
        and(
          eq(licenceAgreementTemplates.templateCode, "Online_Registration_Free"),
          lte(licenceAgreementTemplates.ValidFrom, currentDate),
          gte(licenceAgreementTemplates.ValidTo, currentDate)
        )
      );
    
    if (!result) return undefined;
    
    return {
      ...result.licence_agreement_templates,
      licence: result.licences!,
    };
  }

  async createLicenceAgreementTemplate(insertTemplate: InsertLicenceAgreementTemplate): Promise<LicenceAgreementTemplate> {
    const [template] = await db
      .insert(licenceAgreementTemplates)
      .values([insertTemplate])
      .returning();
    return template;
  }

  async updateLicenceAgreementTemplate(id: string, updates: Partial<InsertLicenceAgreementTemplate>): Promise<LicenceAgreementTemplate | undefined> {
    const [template] = await db
      .update(licenceAgreementTemplates)
      .set(updates)
      .where(eq(licenceAgreementTemplates.id, id))
      .returning();
    return template || undefined;
  }

  async deleteLicenceAgreementTemplate(id: string): Promise<boolean> {
    const result = await db
      .delete(licenceAgreementTemplates)
      .where(eq(licenceAgreementTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Licence Agreement methods
  async getLicenceAgreements(): Promise<LicenceAgreementWithDetails[]> {
    const results = await db
      .select()
      .from(licenceAgreements)
      .leftJoin(licenceAgreementTemplates, eq(licenceAgreements.licenceAgreementTemplateId, licenceAgreementTemplates.id))
      .leftJoin(companies, eq(licenceAgreements.companyId, companies.id))
      .orderBy(licenceAgreements.id);
    
    return results.map(row => ({
      ...row.licence_agreements,
      licenceAgreementTemplate: row.licence_agreement_templates!,
      company: row.companies!,
    }));
  }

  async getLicenceAgreement(id: string): Promise<LicenceAgreementWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(licenceAgreements)
      .leftJoin(licenceAgreementTemplates, eq(licenceAgreements.licenceAgreementTemplateId, licenceAgreementTemplates.id))
      .leftJoin(companies, eq(licenceAgreements.companyId, companies.id))
      .where(eq(licenceAgreements.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.licence_agreements,
      licenceAgreementTemplate: result.licence_agreement_templates!,
      company: result.companies!,
    };
  }

  async getLicenceAgreementsByCompany(companyId: string): Promise<LicenceAgreementWithDetails[]> {
    const results = await db
      .select()
      .from(licenceAgreements)
      .leftJoin(licenceAgreementTemplates, eq(licenceAgreements.licenceAgreementTemplateId, licenceAgreementTemplates.id))
      .leftJoin(companies, eq(licenceAgreements.companyId, companies.id))
      .where(eq(licenceAgreements.companyId, companyId))
      .orderBy(licenceAgreements.id);
    
    return results.map(row => ({
      ...row.licence_agreements,
      licenceAgreementTemplate: row.licence_agreement_templates!,
      company: row.companies!,
    }));
  }

  async createLicenceAgreement(insertAgreement: InsertLicenceAgreement): Promise<LicenceAgreement> {
    const [agreement] = await db
      .insert(licenceAgreements)
      .values([insertAgreement])
      .returning();
    
    const actualizedAgreement = await this.actualizeLicenceAgreementSeatsUsed(agreement.id);
    
    return actualizedAgreement || agreement;
  }

  async updateLicenceAgreement(id: string, updates: Partial<InsertLicenceAgreement>): Promise<LicenceAgreement | undefined> {
    const [agreement] = await db
      .update(licenceAgreements)
      .set(updates)
      .where(eq(licenceAgreements.id, id))
      .returning();
    
    if (agreement) {
      const actualizedAgreement = await this.actualizeLicenceAgreementSeatsUsed(agreement.id);
      return actualizedAgreement || agreement;
    }
    
    return undefined;
  }

  async deleteLicenceAgreement(id: string): Promise<boolean> {
    const result = await db
      .delete(licenceAgreements)
      .where(eq(licenceAgreements.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async actualizeLicenceAgreementSeatsUsed(licenceAgreementId: string): Promise<LicenceAgreement | undefined> {
    const agreement = await this.getLicenceAgreement(licenceAgreementId);
    if (!agreement) {
      return undefined;
    }

    const userCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.licenceAgreementId, licenceAgreementId));
    
    const seatsUsed = userCount[0]?.count || 0;
    const licenceSeats = agreement.licenceSeats || 0;
    const seatsRemaining = licenceSeats - seatsUsed;

    const [updatedAgreement] = await db
      .update(licenceAgreements)
      .set({
        licenceSeatsUsed: seatsUsed,
        licenceSeatsRemaining: seatsRemaining,
      })
      .where(eq(licenceAgreements.id, licenceAgreementId))
      .returning();

    return updatedAgreement || undefined;
  }

  async createLicenceAgreementAutomated(licenceAgreementTemplateId: string, companyId: string): Promise<LicenceAgreement> {
    const template = await this.getLicenceAgreementTemplate(licenceAgreementTemplateId);
    if (!template) {
      throw new Error("Licence agreement template not found");
    }

    const validFrom = new Date();
    const templateValidFrom = template.ValidFrom ? new Date(template.ValidFrom) : new Date();
    const validTo = new Date(templateValidFrom);
    validTo.setMonth(validTo.getMonth() + (template.agreementBaseDurationMonths || 0));

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const [agreement] = await db
      .insert(licenceAgreements)
      .values({
        licenceAgreementTemplateId,
        companyId,
        validFrom: formatDate(validFrom),
        validTo: formatDate(validTo),
        price: template.price,
        currency: template.currency,
        licenceSeats: 1,
        licenceSeatsRemaining: null,
        licenceSeatsUsed: null,
      })
      .returning();

    const actualizedAgreement = await this.actualizeLicenceAgreementSeatsUsed(agreement.id);

    return actualizedAgreement || agreement;
  }

  // Knowledge Article methods (Global - no company context)
  async getKnowledgeArticles(): Promise<Omit<KnowledgeArticleWithAuthor, 'articleContent'>[]> {
    const results = await db
      .select({
        id: knowledgeArticles.id,
        articleTitle: knowledgeArticles.articleTitle,
        languageCode: knowledgeArticles.languageCode,
        articleFunctionalDomain: knowledgeArticles.articleFunctionalDomain,
        articleFunctionalityName: knowledgeArticles.articleFunctionalityName,
        articleTags: knowledgeArticles.articleTags,
        articleKeywords: knowledgeArticles.articleKeywords,
        isPublished: knowledgeArticles.isPublished,
        isInternal: knowledgeArticles.isInternal,
        authorId: knowledgeArticles.authorId,
        createdDate: knowledgeArticles.createdDate,
        author: users,
      })
      .from(knowledgeArticles)
      .leftJoin(users, eq(knowledgeArticles.authorId, users.id))
      .orderBy(sql`${knowledgeArticles.createdDate} DESC`);

    return results.map(r => ({
      id: r.id,
      articleTitle: r.articleTitle,
      languageCode: r.languageCode,
      articleFunctionalDomain: r.articleFunctionalDomain,
      articleFunctionalityName: r.articleFunctionalityName,
      articleTags: r.articleTags,
      articleKeywords: r.articleKeywords,
      isPublished: r.isPublished,
      isInternal: r.isInternal,
      authorId: r.authorId,
      createdDate: r.createdDate,
      author: r.author!,
    }));
  }

  async getKnowledgeArticle(id: string): Promise<KnowledgeArticleWithAuthor | undefined> {
    const [result] = await db
      .select({
        article: knowledgeArticles,
        author: users,
      })
      .from(knowledgeArticles)
      .leftJoin(users, eq(knowledgeArticles.authorId, users.id))
      .where(eq(knowledgeArticles.id, id));

    if (!result) return undefined;

    return {
      ...result.article,
      author: result.author!,
    };
  }

  async createKnowledgeArticle(article: InsertKnowledgeArticle): Promise<KnowledgeArticle> {
    const [newArticle] = await db
      .insert(knowledgeArticles)
      .values({
        ...article,
        createdDate: sql`NOW()`,
      })
      .returning();
    return newArticle;
  }

  async updateKnowledgeArticle(id: string, article: Partial<InsertKnowledgeArticle>): Promise<KnowledgeArticle | undefined> {
    const [updatedArticle] = await db
      .update(knowledgeArticles)
      .set(article)
      .where(eq(knowledgeArticles.id, id))
      .returning();
    return updatedArticle || undefined;
  }

  async deleteKnowledgeArticle(id: string): Promise<boolean> {
    const result = await db
      .delete(knowledgeArticles)
      .where(eq(knowledgeArticles.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Company Setting Master Domain methods
  async getCompanySettingMasterDomains(): Promise<CompanySettingMasterDomain[]> {
    return await db.select().from(companySettingMasterDomains);
  }

  async getCompanySettingMasterDomain(id: string): Promise<CompanySettingMasterDomain | undefined> {
    const [domain] = await db
      .select()
      .from(companySettingMasterDomains)
      .where(eq(companySettingMasterDomains.id, id));
    return domain;
  }

  async createCompanySettingMasterDomain(domain: InsertCompanySettingMasterDomain): Promise<CompanySettingMasterDomain> {
    const [newDomain] = await db
      .insert(companySettingMasterDomains)
      .values(domain)
      .returning();
    return newDomain;
  }

  async updateCompanySettingMasterDomain(id: string, domain: Partial<InsertCompanySettingMasterDomain>): Promise<CompanySettingMasterDomain | undefined> {
    const [updatedDomain] = await db
      .update(companySettingMasterDomains)
      .set(domain)
      .where(eq(companySettingMasterDomains.id, id))
      .returning();
    return updatedDomain || undefined;
  }

  async deleteCompanySettingMasterDomain(id: string): Promise<boolean> {
    const result = await db
      .delete(companySettingMasterDomains)
      .where(eq(companySettingMasterDomains.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Company Setting Master Functionality methods
  async getCompanySettingMasterFunctionalities(): Promise<CompanySettingMasterFunctionality[]> {
    return await db.select().from(companySettingMasterFunctionalities);
  }

  async getCompanySettingMasterFunctionality(id: string): Promise<CompanySettingMasterFunctionality | undefined> {
    const [functionality] = await db
      .select()
      .from(companySettingMasterFunctionalities)
      .where(eq(companySettingMasterFunctionalities.id, id));
    return functionality;
  }

  async createCompanySettingMasterFunctionality(functionality: InsertCompanySettingMasterFunctionality): Promise<CompanySettingMasterFunctionality> {
    const [newFunctionality] = await db
      .insert(companySettingMasterFunctionalities)
      .values(functionality)
      .returning();
    return newFunctionality;
  }

  async updateCompanySettingMasterFunctionality(id: string, functionality: Partial<InsertCompanySettingMasterFunctionality>): Promise<CompanySettingMasterFunctionality | undefined> {
    const [updatedFunctionality] = await db
      .update(companySettingMasterFunctionalities)
      .set(functionality)
      .where(eq(companySettingMasterFunctionalities.id, id))
      .returning();
    return updatedFunctionality || undefined;
  }

  async deleteCompanySettingMasterFunctionality(id: string): Promise<boolean> {
    const result = await db
      .delete(companySettingMasterFunctionalities)
      .where(eq(companySettingMasterFunctionalities.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Company Settings Master methods
  async getCompanySettingsMasters(): Promise<CompanySettingsMaster[]> {
    return await db.select().from(companySettingsMaster);
  }

  async getCompanySettingsMaster(id: string): Promise<CompanySettingsMaster | undefined> {
    const [settingMaster] = await db
      .select()
      .from(companySettingsMaster)
      .where(eq(companySettingsMaster.id, id));
    return settingMaster;
  }

  async createCompanySettingsMaster(settingMaster: InsertCompanySettingsMaster): Promise<CompanySettingsMaster> {
    const [newSettingMaster] = await db
      .insert(companySettingsMaster)
      .values(settingMaster)
      .returning();
    return newSettingMaster;
  }

  async updateCompanySettingsMaster(id: string, settingMaster: Partial<InsertCompanySettingsMaster>): Promise<CompanySettingsMaster | undefined> {
    const [updatedSettingMaster] = await db
      .update(companySettingsMaster)
      .set(settingMaster)
      .where(eq(companySettingsMaster.id, id))
      .returning();
    return updatedSettingMaster || undefined;
  }

  async deleteCompanySettingsMaster(id: string): Promise<boolean> {
    const result = await db
      .delete(companySettingsMaster)
      .where(eq(companySettingsMaster.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}
