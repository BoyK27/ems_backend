/**
 * Role Authorization Middleware
 * Example: verifyRole(["admin"]) or verifyRole(["admin", "employee"])
 */
const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized: Authentication required",
        });
      }

      // Extract and normalize role string from User model
      const userRole = String(req.user.role || "")
        .trim()
        .toLowerCase();

      // Normalize allowed roles list
      const rolesArray = Array.isArray(allowedRoles)
        ? allowedRoles
        : [allowedRoles];
      const normalizedAllowedRoles = rolesArray.map((r) =>
        String(r).trim().toLowerCase(),
      );

      // Check authorization
      if (!normalizedAllowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: `Forbidden: Access restricted to [${rolesArray.join(", ")}] roles. Current user role: '${req.user.role}'`,
        });
      }

      next();
    } catch (error) {
      console.error("Role Verification Middleware Error:", error.message);
      return res.status(500).json({
        success: false,
        error: "Internal server error during authorization check",
      });
    }
  };
};

export default verifyRole;
