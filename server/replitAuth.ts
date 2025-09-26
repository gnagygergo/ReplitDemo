// Replit Auth integration - OpenID Connect authentication
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const isDevelopment = process.env.NODE_ENV === "development";
  const isReplit = !!process.env.REPL_ID; // Replit provides HTTPS even in dev

  // Use PostgreSQL session store if DATABASE_URL is available
  let sessionStore;
  if (process.env.DATABASE_URL) {
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  }

  // Explicit cookie configuration to ensure sameSite is respected
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore, // Falls back to MemoryStore if undefined
    resave: false,
    saveUninitialized: false,
    rolling: false, // Don't extend on every request
    name: "connect.sid", // Explicitly set session name
    cookie: {
      httpOnly: true,
      secure: true, // Always secure in Replit (HTTPS available)
      sameSite: "lax", // CSRF protection - prevents cross-site requests
      maxAge: sessionTtl,
      path: "/",
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  
  // Force sameSite=lax at the session level (enterprise security)
  app.use((req, res, next) => {
    if (req.session && req.session.cookie) {
      req.session.cookie.sameSite = 'lax';
      req.session.cookie.secure = true;
    }
    next();
  });
  
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, (err: any, user: any) => {
      if (err) {
        console.error("Authentication error:", err);
        return res.redirect("/api/login");
      }
      if (!user) {
        return res.redirect("/api/login");
      }

      // Regenerate session ID to prevent session fixation attacks
      req.session.regenerate((regenerateErr: any) => {
        if (regenerateErr) {
          console.error("Session regeneration error:", regenerateErr);
          return res.redirect("/api/login");
        }

        // Log in the user after session regeneration
        req.logIn(user, (loginErr: any) => {
          if (loginErr) {
            console.error("Login error:", loginErr);
            return res.redirect("/api/login");
          }

          // Save session explicitly to ensure persistence
          req.session.save((saveErr: any) => {
            if (saveErr) {
              console.error("Session save error:", saveErr);
              return res.redirect("/api/login");
            }
            res.redirect("/");
          });
        });
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    const sessionUser = (req.session as any).user;
    
    // Handle database user logout
    if (sessionUser && sessionUser.isDbUser) {
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Session destruction error on logout:", err);
        }
        
        // Clear the session cookie explicitly
        res.clearCookie("connect.sid", {
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "lax"
        });
        
        res.redirect("/");
      });
      return;
    }
    
    // Handle OIDC user logout (original Replit Auth)
    req.logout(() => {
      // Destroy session and clear session cookie
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Session destruction error on logout:", err);
        }
        
        // Clear the session cookie explicitly
        res.clearCookie("connect.sid", {
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "lax"
        });
        
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  const sessionUser = (req.session as any).user;

  // Check for database user authentication (email/password login)
  if (sessionUser && sessionUser.isDbUser) {
    return next();
  }

  // Check for OIDC authentication (original Replit Auth)
  if (!req.isAuthenticated() || !user || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    
    // Update the user session with new tokens
    updateUserSession(user, tokenResponse);
    
    // Explicitly save the session to ensure token persistence
    req.session.save((err: any) => {
      if (err) {
        console.error("Session save error during token refresh:", err);
        return res.status(401).json({ message: "Session save failed" });
      }
      return next();
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};