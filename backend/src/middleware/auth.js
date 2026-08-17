const { AppError } = require("../utils/AppError");
const { verifyAccessToken } = require("../utils/jwt");
const { User } = require("../modules/users/user.model");

function authenticate({ jwtSecret }) {
  return async (req, res, next) => {
    const header = req.headers.authorization;
    const bearer =
      header && header.startsWith("Bearer ") ? header.slice(7) : null;
    const cookieToken = req.cookies?.ql_at;
    const token = bearer || cookieToken;

    if (!token) {
      next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
      return;
    }

    try {
      const payload = verifyAccessToken(token, jwtSecret);
      // Authorization decisions must use the current database record, not
      // role/profile claims from a token that can remain valid for days.
      const account = await User.findById(payload.sub)
        .select(
          [
            "email",
            "role",
            "accountStatus",
            "emailVerified",
            "googleEmailVerified",
            "authProvider",
            "hasLocalPassword",
            "materialTypes",
            "preferredMaterialCategories",
            "requiredMaterialCategories",
            "country",
            "state",
            "location",
          ].join(" ")
        )
        .lean();
      if (!account) {
        next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
        return;
      }
      if (account.accountStatus === "suspended") {
        next(new AppError("Account suspended", 403, "ACCOUNT_SUSPENDED"));
        return;
      }
      req.user = {
        id: account._id.toString(),
        email: account.email,
        role: account.role,
      };
      req.account = account;
      next();
    } catch {
      next(new AppError("Invalid or expired token", 401, "INVALID_TOKEN"));
    }
  };
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError("Forbidden", 403, "FORBIDDEN"));
      return;
    }
    next();
  };
}

module.exports = { authenticate, authorize };
