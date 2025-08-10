import jwt from "jsonwebtoken";
export function generateUserAccessToken(payload, expiresIn = "1d") {
    const token = jwt.sign(payload, process.env.USER_ACCESS_TOKEN_SECRET, {
        expiresIn
    });
    return token;
}
export function generateInstanceAccessToken(payload, expiresIn = '30d') {
    const token = jwt.sign(payload, process.env.USER_ACCESS_TOKEN_SECRET, {
        expiresIn
    });
    return token;
}
//# sourceMappingURL=token.js.map