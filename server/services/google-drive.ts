import { getUserGoogleToken } from './google-oauth';
import { db } from '../db';
import { accounts, companySettings } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const GOOGLE_UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  webViewLink?: string;
}

async function makeAuthenticatedRequest(
  userId: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const tokenData = await getUserGoogleToken(userId);
  if (!tokenData) {
    throw new Error('User not connected to Google Drive');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${tokenData.accessToken}`,
    },
  });

  return response;
}

export async function listFilesInFolder(
  userId: string,
  folderId: string,
  pageSize: number = 50
): Promise<DriveFile[]> {
  const query = `'${folderId}' in parents and trashed = false`;
  const fields = 'files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink,thumbnailLink)';
  
  const url = `${GOOGLE_DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&pageSize=${pageSize}&orderBy=modifiedTime desc`;
  
  const response = await makeAuthenticatedRequest(userId, url);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list files: ${error}`);
  }
  
  const data = await response.json();
  return data.files || [];
}

export async function createFolder(
  userId: string,
  folderName: string,
  parentFolderId?: string
): Promise<DriveFolder> {
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }
  
  const response = await makeAuthenticatedRequest(
    userId,
    `${GOOGLE_DRIVE_API_BASE}/files?fields=id,name,webViewLink`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create folder: ${error}`);
  }
  
  return response.json();
}

export async function uploadFile(
  userId: string,
  folderId: string,
  fileName: string,
  fileContent: Buffer,
  mimeType: string
): Promise<DriveFile> {
  const metadata = {
    name: fileName,
    parents: [folderId],
  };
  
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;
  
  const multipartBody = 
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n` +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    fileContent.toString('base64') +
    closeDelim;
  
  const response = await makeAuthenticatedRequest(
    userId,
    `${GOOGLE_UPLOAD_API_BASE}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink`,
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload file: ${error}`);
  }
  
  return response.json();
}

export async function deleteFile(userId: string, fileId: string): Promise<void> {
  const response = await makeAuthenticatedRequest(
    userId,
    `${GOOGLE_DRIVE_API_BASE}/files/${fileId}`,
    {
      method: 'DELETE',
    }
  );
  
  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new Error(`Failed to delete file: ${error}`);
  }
}

export async function getCompanyDriveRootFolder(companyId: string): Promise<string | null> {
  const setting = await db.query.companySettings.findFirst({
    where: and(
      eq(companySettings.companyId, companyId),
    ),
  });
  
  const allSettings = await db
    .select()
    .from(companySettings)
    .where(eq(companySettings.companyId, companyId));
  
  const googleDriveSetting = allSettings.find(s => 
    s.settingCode === 'google_drive_integration_company_root_folder' ||
    s.settingCode === 'google_drive_root_folder_id' || 
    s.settingCode === 'googleDriveRootFolderId'
  );
  
  return googleDriveSetting?.settingValue || null;
}

export async function ensureAccountFolder(
  userId: string,
  accountId: string,
  companyId: string
): Promise<string> {
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, accountId),
  });
  
  if (!account) {
    throw new Error('Account not found');
  }
  
  if (account.googleFolderId) {
    return account.googleFolderId;
  }
  
  const rootFolderId = await getCompanyDriveRootFolder(companyId);
  if (!rootFolderId) {
    throw new Error('Google Drive root folder not configured for this company');
  }
  
  const folderName = account.name || account.companyOfficialName || `Account_${accountId}`;
  const folder = await createFolder(userId, folderName, rootFolderId);
  
  await db.update(accounts)
    .set({ googleFolderId: folder.id })
    .where(eq(accounts.id, accountId));
  
  return folder.id;
}

export async function getAccountFolderId(accountId: string): Promise<string | null> {
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, accountId),
  });
  
  return account?.googleFolderId || null;
}

export async function getFolderInfo(userId: string, folderId: string): Promise<DriveFolder | null> {
  const response = await makeAuthenticatedRequest(
    userId,
    `${GOOGLE_DRIVE_API_BASE}/files/${folderId}?fields=id,name,webViewLink`
  );
  
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.text();
    throw new Error(`Failed to get folder info: ${error}`);
  }
  
  return response.json();
}
