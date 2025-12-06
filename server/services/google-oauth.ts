import { encrypt, decrypt, encryptTokens, decryptTokens } from '../lib/crypto';
import { db } from '../db';
import { userGoogleTokens } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const STATE_SECRET = process.env.TOKEN_ENCRYPTION_KEY || process.env.SESSION_SECRET || 'fallback-secret';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

interface OAuthState {
  userId: string;
  returnUrl: string;
  nonce: string;
  timestamp: number;
}

function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  const codeChallenge = hash.toString('base64url');
  return { codeVerifier, codeChallenge };
}

function signState(stateData: OAuthState): string {
  const payload = JSON.stringify(stateData);
  const signature = crypto
    .createHmac('sha256', STATE_SECRET)
    .update(payload)
    .digest('hex');
  return Buffer.from(`${payload}|${signature}`).toString('base64url');
}

export function verifyAndParseState(signedState: string): OAuthState | null {
  try {
    const decoded = Buffer.from(signedState, 'base64url').toString('utf8');
    const separatorIndex = decoded.lastIndexOf('|');
    if (separatorIndex === -1) return null;
    
    const payload = decoded.substring(0, separatorIndex);
    const signature = decoded.substring(separatorIndex + 1);
    
    const expectedSignature = crypto
      .createHmac('sha256', STATE_SECRET)
      .update(payload)
      .digest('hex');
    
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }
    
    const stateData = JSON.parse(payload) as OAuthState;
    
    if (Date.now() - stateData.timestamp > STATE_EXPIRY_MS) {
      return null;
    }
    
    return stateData;
  } catch {
    return null;
  }
}

export function createAuthSession(userId: string, returnUrl: string): { authUrl: string; codeVerifier: string } {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    throw new Error('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI.');
  }
  
  const { codeVerifier, codeChallenge } = generatePKCE();
  
  const stateData: OAuthState = {
    userId,
    returnUrl,
    nonce: crypto.randomBytes(16).toString('hex'),
    timestamp: Date.now(),
  };
  
  const state = signState(stateData);
  
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  
  return {
    authUrl: `${GOOGLE_AUTH_URL}?${params.toString()}`,
    codeVerifier,
  };
}

export function getAuthUrl(state: string): string {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    throw new Error('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI.');
  }
  
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string, codeVerifier?: string): Promise<GoogleTokenResponse> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error('Google OAuth not configured.');
  }
  
  const bodyParams: Record<string, string> = {
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: GOOGLE_REDIRECT_URI,
  };
  
  if (codeVerifier) {
    bodyParams.code_verifier = codeVerifier;
  }
  
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(bodyParams),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }
  
  return response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth not configured.');
  }
  
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }
  
  return response.json();
}

export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get user info');
  }
  
  return response.json();
}

export async function saveUserTokens(
  userId: string,
  tokens: GoogleTokenResponse,
  userInfo: GoogleUserInfo
): Promise<void> {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  const { accessTokenCiphertext, refreshTokenCiphertext } = encryptTokens(
    tokens.access_token,
    tokens.refresh_token
  );
  
  const existingToken = await db.query.userGoogleTokens.findFirst({
    where: and(
      eq(userGoogleTokens.userId, userId),
      eq(userGoogleTokens.provider, 'google'),
      eq(userGoogleTokens.providerAccountId, userInfo.id)
    ),
  });
  
  if (existingToken) {
    await db.update(userGoogleTokens)
      .set({
        accessTokenCiphertext,
        refreshTokenCiphertext: refreshTokenCiphertext || existingToken.refreshTokenCiphertext,
        accessTokenExpiresAt: expiresAt,
        scopes: tokens.scope.split(' '),
        providerAccountEmail: userInfo.email,
        latestError: null,
        updatedAt: new Date(),
      })
      .where(eq(userGoogleTokens.id, existingToken.id));
  } else {
    await db.insert(userGoogleTokens).values({
      userId,
      provider: 'google',
      providerAccountId: userInfo.id,
      providerAccountEmail: userInfo.email,
      accessTokenCiphertext,
      refreshTokenCiphertext,
      accessTokenExpiresAt: expiresAt,
      scopes: tokens.scope.split(' '),
      tokenType: tokens.token_type,
    });
  }
}

export async function getUserGoogleToken(userId: string): Promise<{
  accessToken: string;
  providerAccountEmail: string | null;
} | null> {
  const tokenRecord = await db.query.userGoogleTokens.findFirst({
    where: and(
      eq(userGoogleTokens.userId, userId),
      eq(userGoogleTokens.provider, 'google')
    ),
  });
  
  if (!tokenRecord) {
    return null;
  }
  
  const isExpired = tokenRecord.accessTokenExpiresAt && 
    new Date(tokenRecord.accessTokenExpiresAt) < new Date();
  
  if (isExpired && tokenRecord.refreshTokenCiphertext) {
    try {
      const { refreshToken } = decryptTokens(
        tokenRecord.accessTokenCiphertext,
        tokenRecord.refreshTokenCiphertext
      );
      
      if (refreshToken) {
        const newTokens = await refreshAccessToken(refreshToken);
        const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
        const { accessTokenCiphertext, refreshTokenCiphertext } = encryptTokens(
          newTokens.access_token,
          newTokens.refresh_token
        );
        
        await db.update(userGoogleTokens)
          .set({
            accessTokenCiphertext,
            refreshTokenCiphertext: refreshTokenCiphertext || tokenRecord.refreshTokenCiphertext,
            accessTokenExpiresAt: expiresAt,
            latestError: null,
            updatedAt: new Date(),
          })
          .where(eq(userGoogleTokens.id, tokenRecord.id));
        
        return {
          accessToken: newTokens.access_token,
          providerAccountEmail: tokenRecord.providerAccountEmail,
        };
      }
    } catch (error) {
      await db.update(userGoogleTokens)
        .set({
          latestError: error instanceof Error ? error.message : 'Token refresh failed',
          updatedAt: new Date(),
        })
        .where(eq(userGoogleTokens.id, tokenRecord.id));
      throw error;
    }
  }
  
  const { accessToken } = decryptTokens(
    tokenRecord.accessTokenCiphertext,
    tokenRecord.refreshTokenCiphertext
  );
  
  return {
    accessToken,
    providerAccountEmail: tokenRecord.providerAccountEmail,
  };
}

export async function disconnectGoogleAccount(userId: string): Promise<void> {
  await db.delete(userGoogleTokens)
    .where(and(
      eq(userGoogleTokens.userId, userId),
      eq(userGoogleTokens.provider, 'google')
    ));
}

export async function isUserConnectedToGoogle(userId: string): Promise<boolean> {
  const token = await db.query.userGoogleTokens.findFirst({
    where: and(
      eq(userGoogleTokens.userId, userId),
      eq(userGoogleTokens.provider, 'google')
    ),
  });
  return !!token;
}
