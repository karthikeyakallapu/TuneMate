import {extractAndVerifyToken} from "../utils/serverutils.js";


export const isAuthUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const authResult = extractAndVerifyToken(authHeader);
    if (!authResult.isValid) {
        return res.status(401).json({
            data: {
                type: "error",
                code: authResult.code || "AUTH_UNAUTHORIZED",
                message: authResult.message || "Unauthorized request."
            }
        });
    }
    req.authUser = authResult.decodedToken;
    next();
};


export const isAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const authResult = extractAndVerifyToken(authHeader);
    if (!authResult.isValid) {
        return res.status(401).json({
            data: {
                type: "error",
                code: authResult.code || "AUTH_UNAUTHORIZED",
                message: authResult.message || "Unauthorized request."
            }
        });
    }
    if (authResult.decodedToken.role !== "admin") {
        return res.status(403).json({
            data: {
                type: "error",
                code: "AUTH_FORBIDDEN",
                message: "You do not have permission to access this resource."
            }
        });
    }
    req.authUser = authResult.decodedToken;
    next();
};
