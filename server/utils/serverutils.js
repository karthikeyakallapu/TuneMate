import jwt from "jsonwebtoken";
import { customAlphabet } from "nanoid";

/**
 * Extract and verify JWT token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {{isValid: boolean, decodedToken: object|null, code: string|null, message: string|null}}
 */
export const extractAndVerifyToken = (authHeader) => {
  if (!authHeader || typeof authHeader !== "string") {
    return {
      isValid: false,
      decodedToken: null,
      code: "AUTH_HEADER_MISSING",
      message: "Authorization header is missing.",
    };
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return {
      isValid: false,
      decodedToken: null,
      code: "AUTH_HEADER_INVALID",
      message: "Authorization header format is invalid.",
    };
  }

  const token = parts[1];

  if (!token || token.length === 0) {
    return {
      isValid: false,
      decodedToken: null,
      code: "AUTH_TOKEN_MISSING",
      message: "Authorization token is missing.",
    };
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    return {
      isValid: true,
      decodedToken: decoded,
      code: null,
      message: null,
    };
  } catch (err) {
    if (err?.name === "TokenExpiredError") {
      return {
        isValid: false,
        decodedToken: null,
        code: "TOKEN_EXPIRED",
        message: "Your session has expired. Please log in again.",
      };
    }

    return {
      isValid: false,
      decodedToken: null,
      code: "AUTH_TOKEN_INVALID",
      message: "Invalid authentication token.",
    };
  }
};

/**
 * Extract fields from data array with safe property access
 * @param {Array} data - Array containing item data
 * @returns {Object|null} Extracted fields or null if invalid
 */
export const extractFields = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return null;
  }
  
  const item = data[0];
  
  if (!item) {
    return null;
  }
  
  return {
    id: item.id || null,
    name: item.name || "Unknown",
    duration: item.duration || 0,
    imageUrl: item.image?.[1]?.url || item.image?.[0]?.url || null,
    primaryArtists: item.artists?.primary 
      ? item.artists.primary.map((artist) => artist.name).join(", ")
      : "Unknown Artist"
  };
};

/**
 * Generate a random token
 * @param {number} length - Length of the token (default: 64)
 * @returns {string} Generated token
 */
export function generateToken(length = 64) {
  const token = customAlphabet(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    length
  )();
  return token;
} 
