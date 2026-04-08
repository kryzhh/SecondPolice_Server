const authService = require('../services/authService');
const { registerSchema, loginSchema } = require('../schemas/authSchema');
const AppError = require('../utils/appError');

const register = async (req, res, next) => {
  try {
    // 1. Zod Validation
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      return next(new AppError(validationResult.error.errors[0].message, 400));
    }

    // 2. Register Tenant + Admin
    const { token, user, tenant } = await authService.registerTenant(validationResult.data);

    // 3. Send Response
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        tenant: {
          id: tenant.id,
          name: tenant.name
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    // 1. Zod Validation
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      return next(new AppError(validationResult.error.errors[0].message, 400));
    }

    const { email, password } = validationResult.data;

    // 2. Perform Login
    const { token, user } = await authService.login(email, password);

    // 3. Send Response
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    // req.user is guaranteed to be hydrated by the authenticate middleware
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      } // Exposes name, email, role, and strictly the tenantId/tenantName
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
