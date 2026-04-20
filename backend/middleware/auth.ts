import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User, { type IUser, type UserRole } from '../models/User';

export interface AuthenticatedRequest extends Request {
  user: IUser;
}

const hasRole = (user: IUser, roles: UserRole | UserRole[]): boolean => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return allowedRoles.includes(user.role);
};

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

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
      
      const user = await User.findById(decoded.userId);
      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token - user not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

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

// TSOA passes role requirements through `scopes`; we interpret them as allowed user roles.
export async function expressAuthentication(
  request: Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  if (securityName !== 'jwt') {
    return Promise.reject(new Error('Unknown security scheme'));
  }

  const authHeader = request.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return Promise.reject(new Error('Access token is required'));
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as JwtPayload;

    if (!decoded || !decoded.userId) {
      return Promise.reject(new Error('Invalid token'));
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return Promise.reject(new Error('User not found'));
    }

    if (scopes && scopes.length > 0) {
      if (!scopes.includes(user.role)) {
        return Promise.reject(
          new Error(`Forbidden: requires one of roles [${scopes.join(', ')}]`)
        );
      }
    }

    return Promise.resolve(user);
  } catch (error: any) {
    return Promise.reject(new Error(error?.message || 'Invalid or expired token'));
  }
}

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
