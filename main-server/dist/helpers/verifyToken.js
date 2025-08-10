import jwt from "jsonwebtoken";
import ApiError from "./ApiError.js";
export function verifyUserAccessToken(token) {
    try {
        const payload = jwt.verify(token, process.env.USER_ACCESS_TOKEN_SECRET);
        return payload;
    }
    catch (error) {
        throw new Error("Invalid jwt token");
    }
}
export function verifyInstanceAccessToken(API_KEY) {
    try {
        const payload = jwt.verify(API_KEY, process.env.USER_ACCESS_TOKEN_SECRET);
        return payload;
    }
    catch (error) {
        throw new Error("Invalid API_KEY");
    }
}
//# sourceMappingURL=verifyToken.js.map