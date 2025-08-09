import jwt from "jsonwebtoken";
import ApiError from "../helpers/ApiError.js";
export function verifyUserAccessToken(token) {
    try {
        const payload = jwt.verify(token, process.env.USER_ACCESS_TOKEN_SECRET);
        return payload;
    }
    catch (error) {
        throw new Error("Invalid jwt token");
    }
}
//# sourceMappingURL=verifyToken.js.map