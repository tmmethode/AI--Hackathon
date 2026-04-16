import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User, { type IUser, type UserRole } from '../models/User';

// Create a custom request interface to avoid conflicts with Passport
export interface AuthenticatedRequest extends Request {
  user: IUser;
}

// Helper function to check if user has required role
const hasRole = (user: IUser, roles: UserRole | UserRole[]): boolean => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return allowedRoles.includes(user.role);
};

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Access token is required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;
      
      // Find user in database
      const user = await User.findById(decoded.userId);
      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token - user not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Attach user to request object
      (req as any).user = user;
      next();
    } catch (error) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
      timestamp: new Date().toISOString()
    });
  }
};

// Export for TSOA authentication
export const expressAuthentication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  return authenticateToken(req, res, next);
};

export const requireRole = (roles: UserRole | UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!hasRole(req.user, roles)) {
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      // No token provided, continue without user
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;
      
      // Find user in database
      const user = await User.findById(decoded.userId);
      if (user) {
        // Attach user to request object if found
        (req as any).user = user;
      }
      
      next();
    } catch (error) {
      // Invalid token, but continue without user for optional auth
      next();
    }
  } catch (error) {
    // Optional auth should not fail the request
    next();
  }
};

// Check if user owns resource or is admin
export const requireOwnershipOrAdmin = (resourceUserIdField: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Admins can access everything
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Check if user owns the resource
    const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField];
    
    if (req.user._id.toString() !== resourceUserId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied. You can only access your own resources.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};
