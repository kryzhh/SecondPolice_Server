const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');
const AppError = require('../utils/appError');

/**
 * Signs a JWT with user and tenant details
 */
const signToken = (userId, tenantId, role) => {
  return jwt.sign(
    { userId, tenantId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE_IN || '90d' }
  );
};

/**
 * Register a new Tenant AND the initial ADMIN user
 */
const registerTenant = async (data) => {
  const { companyName, name, email, password } = data;

  // 1. Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('An account with this email already exists.', 400);
  }

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // 3. Database Transaction: Create Tenant + Admin User
  // IMPORTANT: Multi-tenant safety starts here by creating both in one go.
  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { name: companyName }
    });

    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: 'ADMIN',
        tenantId: tenant.id
      }
    });

    return { user, tenant };
  });

  const token = signToken(result.user.id, result.tenant.id, result.user.role);

  return { token, user: result.user, tenant: result.tenant };
};

/**
 * Login logic
 */
const login = async (email, password) => {
  // 1. Find user and include tenant details
  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true }
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError('Incorrect email or password!', 401);
  }

  // 2. Sign token
  const token = signToken(user.id, user.tenantId, user.role);

  return { token, user };
};

module.exports = { registerTenant, login };
