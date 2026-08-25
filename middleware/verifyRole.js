/**
 * Role Verification Middleware
 * Accepts an array of allowed roles or a single role string.
 * Example usage: verifyRole(["admin", "student"]) or verifyRole("admin")
 */
const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Ensure user attached by authMiddleware exists
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized. User authentication required.",
        });
      }

      // Convert single role string input into an array for consistent checking
      const rolesArray = Array.isArray(allowedRoles)
        ? allowedRoles
        : [allowedRoles];

      // Check if user's role exists within the allowed roles
      if (!rolesArray.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: "Access denied. Insufficient permissions for this action.",
        });
      }

      next();
    } catch (error) {
      console.error("Role Verification Error:", error.message);
      return res.status(500).json({
        success: false,
        error: "Server error during authorization check.",
      });
    }
  };
};

export default verifyRole;
