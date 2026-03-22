import { getPrismaInstance } from "../../utils/prisma/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import { EmailHelper } from "./EmailHelper.js";
import path from "path";
import { fileURLToPath } from "url";

const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";
const REFRESH_TOKEN_COOKIE_NAME =
  process.env.REFRESH_TOKEN_COOKIE_NAME || "refreshToken";
const REFRESH_TOKEN_TTL_MS =
  Number(process.env.REFRESH_TOKEN_TTL_MS) || 7 * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || process.env.TOKEN_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const hashToken = (token) =>
  createHash("sha256").update(token).digest("hex");

const parseCookies = (cookieHeader = "") => {
  if (!cookieHeader || typeof cookieHeader !== "string") {
    return {};
  }

  return cookieHeader.split(";").reduce((acc, chunk) => {
    const [rawKey, ...rest] = chunk.trim().split("=");
    if (!rawKey) {
      return acc;
    }

    acc[rawKey] = decodeURIComponent(rest.join("=") || "");
    return acc;
  }, {});
};

const createAccessToken = (user) =>
  jwt.sign(
    {
      userid: user.id,
      username: user.username,
      role: user.role,
    },
    process.env.TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );

const createRefreshToken = (user) =>
  jwt.sign(
    {
      userid: user.id,
      role: user.role,
      type: "refresh",
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY },
  );

const getRefreshCookieBaseOptions = () => ({
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: IS_PRODUCTION ? "none" : "lax",
  path: "/api/auth",
});

const getSetRefreshCookieOptions = () => ({
  ...getRefreshCookieBaseOptions(),
  maxAge: REFRESH_TOKEN_TTL_MS,
});

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getRefreshCookieBaseOptions());
};

const updateRefreshTokenForUser = async (prisma, userId, refreshToken) => {
  await prisma.User.update({
    where: { id: userId },
    data: {
      refreshTokenHash: hashToken(refreshToken),
      refreshTokenExpiry: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
};

const clearRefreshTokenForUser = async (prisma, userId) => {
  if (!userId) return;

  await prisma.User.update({
    where: { id: userId },
    data: {
      refreshTokenHash: null,
      refreshTokenExpiry: null,
    },
  });
};

const issueAuthTokens = async (prisma, res, user) => {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  await updateRefreshTokenForUser(prisma, user.id, refreshToken);
  res.cookie(
    REFRESH_TOKEN_COOKIE_NAME,
    refreshToken,
    getSetRefreshCookieOptions(),
  );

  return { accessToken };
};

const verifyRefreshToken = (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
      return { valid: false, code: "TOKEN_EXPIRED" };
    }

    return { valid: false, code: "AUTH_TOKEN_INVALID" };
  }
};

const getVerifiedRefreshPayloadIgnoringExpiry = (token) => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET, { ignoreExpiration: true });
  } catch (error) {
    return null;
  }
};

export const UserController = () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const __messagePath = path.join(__dirname, "../../public/messages");

  const verifyEmailByToken = async (token) => {
    if (!token || typeof token !== "string") {
      return { ok: false, reason: "missing_token" };
    }

    const prisma = await getPrismaInstance();
    const user = await prisma.User.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpiry: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      return { ok: false, reason: "invalid_or_expired" };
    }

    await prisma.User.update({
      where: { id: user.id },
      data: {
        verified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    return { ok: true, reason: "verified" };
  };

  const getRefreshTokenFromRequest = (req) => {
    const cookies = parseCookies(req.headers.cookie || "");
    return cookies[REFRESH_TOKEN_COOKIE_NAME] || null;
  };

  return {
    async verifyToken(req, res) {
      try {
        const { token } = req.query;
        const result = await verifyEmailByToken(token);

        if (!result.ok) {
          res.sendFile("token_expiry.html", { root: __messagePath });
          return;
        }

        res.sendFile("token_success.html", { root: __messagePath });
      } catch (error) {
        console.error("Error in verifyToken:", error.message);
        res.sendFile("token_failure.html", { root: __messagePath });
      }
    },

    async verifyEmail(req, res) {
      try {
        const { token } = req.body;

        if (!token) {
          return res.status(200).json({
            data: {
              message: "Verification token is required.",
              type: "error",
            },
          });
        }

        const result = await verifyEmailByToken(token);

        if (!result.ok) {
          return res.status(200).json({
            data: {
              message:
                "Invalid or expired verification link. Please request a new verification email.",
              type: "error",
            },
          });
        }

        return res.status(200).json({
          data: {
            message: "Email verified successfully. You can now log in.",
            type: "success",
          },
        });
      } catch (error) {
        console.error("Error in verifyEmail:", error.message);
        return res.status(500).json({
          data: {
            message: "Error verifying email. Please try again later.",
            type: "error",
          },
        });
      }
    },

    async register(req, res) {
      const { email, username, password } = req.body;

      try {
        const prisma = await getPrismaInstance();

        const existingUser = await prisma.User.findFirst({
          where: {
            OR: [{ email }, { username }],
          },
        });

        if (existingUser) {
          const message =
            existingUser.email === email
              ? "User with this email already exists"
              : "User with this username already exists";
          return res.status(200).json({
            data: { message, type: "error" },
          });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.User.create({
          data: {
            email,
            username,
            password: hashedPassword,
            playerState: {
              songId: "",
              playListId: "",
              currentSongIndex: -1,
              Volume: 50,
              playListType: "",
            },
          },
        });

        const mailSent = await EmailHelper().sendVerificationMail(
          email,
          username,
        );

        if (!mailSent) {
          return res.status(500).json({
            data: {
              message: "Error sending verification email.",
              type: "error",
            },
          });
        }

        return res.status(201).json({
          data: {
            message: "User created successfully. Please verify your email.",
            type: "success",
          },
        });
      } catch (error) {
        console.error("Error in register:", error.message);

        return res.status(500).json({
          data: {
            message: "Error creating user. Please try again later.",
            type: "error",
          },
        });
      }
    },

    async resendVerificationMail(req, res) {
      try {
        const { email } = req.body;

        if (!email) {
          return res.status(200).json({
            data: { message: "Email is required", type: "error" },
          });
        }

        const mailSent = await EmailHelper().sendVerificationMail(email);

        if (!mailSent) {
          return res.status(200).json({
            data: {
              message: "Error sending verification email.",
              type: "error",
            },
          });
        }

        return res.status(201).json({
          data: {
            message: "Verification email sent successfully.",
            type: "success",
          },
        });
      } catch (error) {
        console.error("Error in resendVerificationMail:", error.message);
        return res.status(200).json({
          data: {
            message: "Error sending verification email.",
            type: "error",
          },
        });
      }
    },

    async login(req, res) {
      const { email, password } = req.body;

      try {
        const prisma = await getPrismaInstance();
        const user = await prisma.User.findUnique({ where: { email } });

        if (!user) {
          return res.status(200).json({
            data: { message: "User not found", type: "error" },
          });
        }

        if (user.verified !== true) {
          return res.status(200).json({
            data: {
              message: "Please verify your mail and Try Again",
              type: "error",
            },
          });
        }

        const result = await bcrypt.compare(password, user.password);
        if (!result) {
          return res.status(200).json({
            data: { message: "Wrong Username or Password", type: "error" },
          });
        }

        const { accessToken } = await issueAuthTokens(prisma, res, user);

        return res.status(200).json({
          data: {
            accessToken,
            message: "Login successful",
            type: "success",
          },
        });
      } catch (error) {
        console.error("Error in login:", error.message);
        return res.status(500).json({
          data: {
            message: "Internal Server Error",
            type: "error",
          },
        });
      }
    },

    async refreshToken(req, res) {
      try {
        const prisma = await getPrismaInstance();
        const refreshToken = getRefreshTokenFromRequest(req);

        if (!refreshToken) {
          clearRefreshCookie(res);
          return res.status(401).json({
            data: {
              type: "error",
              code: "AUTH_UNAUTHORIZED",
              message: "No refresh token found. Please log in again.",
            },
          });
        }

        const verificationResult = verifyRefreshToken(refreshToken);
        if (!verificationResult.valid) {
          if (verificationResult.code === "TOKEN_EXPIRED") {
            const verifiedPayload =
              getVerifiedRefreshPayloadIgnoringExpiry(refreshToken);
            if (verifiedPayload?.userid) {
              await clearRefreshTokenForUser(prisma, verifiedPayload.userid);
            }
          }

          clearRefreshCookie(res);
          return res.status(401).json({
            data: {
              type: "error",
              code: verificationResult.code,
              message:
                verificationResult.code === "TOKEN_EXPIRED"
                  ? "Session expired. Please log in again."
                  : "Invalid refresh token. Please log in again.",
            },
          });
        }

        const tokenPayload = verificationResult.decoded;
        if (!tokenPayload?.userid) {
          clearRefreshCookie(res);
          return res.status(401).json({
            data: {
              type: "error",
              code: "AUTH_UNAUTHORIZED",
              message: "Invalid refresh token payload.",
            },
          });
        }

        const user = await prisma.User.findUnique({
          where: { id: tokenPayload.userid },
        });

        if (!user) {
          clearRefreshCookie(res);
          return res.status(401).json({
            data: {
              type: "error",
              code: "AUTH_UNAUTHORIZED",
              message: "User not found.",
            },
          });
        }

        if (
          !user.refreshTokenHash ||
          !user.refreshTokenExpiry ||
          user.refreshTokenExpiry < new Date()
        ) {
          await clearRefreshTokenForUser(prisma, user.id);
          clearRefreshCookie(res);
          return res.status(401).json({
            data: {
              type: "error",
              code: "TOKEN_EXPIRED",
              message: "Session expired. Please log in again.",
            },
          });
        }

        const incomingRefreshTokenHash = hashToken(refreshToken);
        if (incomingRefreshTokenHash !== user.refreshTokenHash) {
          await clearRefreshTokenForUser(prisma, user.id);
          clearRefreshCookie(res);
          return res.status(401).json({
            data: {
              type: "error",
              code: "AUTH_UNAUTHORIZED",
              message: "Refresh token mismatch. Please log in again.",
            },
          });
        }

        const { accessToken } = await issueAuthTokens(prisma, res, user);

        return res.status(200).json({
          data: {
            type: "success",
            accessToken,
            message: "Session refreshed successfully.",
          },
        });
      } catch (error) {
        console.error("Error in refreshToken:", error.message);
        clearRefreshCookie(res);
        return res.status(500).json({
          data: {
            type: "error",
            code: "AUTH_REFRESH_FAILED",
            message: "Could not refresh session.",
          },
        });
      }
    },

    async logout(req, res) {
      try {
        const prisma = await getPrismaInstance();
        const refreshToken = getRefreshTokenFromRequest(req);
        const verifiedPayload = refreshToken
          ? getVerifiedRefreshPayloadIgnoringExpiry(refreshToken)
          : null;

        if (verifiedPayload?.userid) {
          await clearRefreshTokenForUser(prisma, verifiedPayload.userid);
        }

        clearRefreshCookie(res);
        return res.status(200).json({
          data: {
            type: "success",
            message: "Logged out successfully.",
          },
        });
      } catch (error) {
        console.error("Error in logout:", error.message);
        clearRefreshCookie(res);
        return res.status(500).json({
          data: {
            type: "error",
            message: "Failed to logout properly.",
          },
        });
      }
    },

    async forgotPassword(req, res) {
      const { email } = req.body;
      const prisma = await getPrismaInstance();

      try {
        const user = await prisma.User.findUnique({ where: { email } });

        if (!user) {
          return res.status(200).json({
            data: { message: "User not found", type: "error" },
          });
        }

        const mailSent = await EmailHelper().sendResetPasswordMail(
          email,
          user?.username,
        );

        if (!mailSent) {
          return res.status(200).json({
            data: {
              message: "Error sending reset password email.",
              type: "error",
            },
          });
        }

        return res.status(201).json({
          data: {
            message: "Reset password email sent successfully.",
            type: "success",
          },
        });
      } catch (error) {
        console.error("Error in forgotPassword:", error.message);
        return res.status(200).json({
          data: {
            message: "Error sending reset password email.",
            type: "error",
          },
        });
      }
    },

    async resetPassword(req, res) {
      const { token, password } = req.body;
      const prisma = await getPrismaInstance();

      try {
        const user = await prisma.User.findFirst({
          where: {
            resetToken: token,
            resetTokenExpiry: {
              gte: new Date(),
            },
          },
        });

        if (!user) {
          return res.status(200).json({
            data: { message: "Invalid or expired token", type: "error" },
          });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.User.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
            refreshTokenHash: null,
            refreshTokenExpiry: null,
          },
        });

        clearRefreshCookie(res);

        return res.status(201).json({
          data: {
            message: "Password reset successfully.",
            type: "success",
          },
        });
      } catch (error) {
        console.error("Error in resetPassword:", error.message);
        return res.status(200).json({
          data: {
            message: "Error resetting password.",
            type: "error",
          },
        });
      }
    },
  };
};
