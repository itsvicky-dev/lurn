import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const ADMIN_EMAIL = 'admin@mail.com';

export const requireAdmin = async (req, res, next) => {
  try {
    // First check if user is authenticated
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }

    // Check if user is admin
    if (user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.',
        userEmail: user.email,
        requiredEmail: ADMIN_EMAIL
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export const isAdmin = (userEmail) => {
  return userEmail === ADMIN_EMAIL;
};