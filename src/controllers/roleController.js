const prisma = require('../lib/prisma');
const AppError = require('../utils/appError');

/**
 * Get all roles for the tenant
 */
exports.getRoles = async (req, res, next) => {
  try {
    const roles = await prisma.customRole.findMany({
      where: { tenantId: req.user.tenantId },
      include: {
        _count: { select: { users: true } },
        users: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ status: 'success', data: { roles } });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific role
 */
exports.getRole = async (req, res, next) => {
  try {
    const role = await prisma.customRole.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.user.tenantId
      },
      include: { users: { select: { id: true } } }
    });

    if (!role) {
      return next(new AppError('No role found with that ID', 404));
    }

    res.status(200).json({ status: 'success', data: { role } });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new role
 */
exports.createRole = async (req, res, next) => {
  try {
    const { name, permissions, userIds } = req.body;

    if (!name) {
      return next(new AppError('Please provide a role name', 400));
    }

    const data = {
      name,
      permissions: permissions || {},
      tenantId: req.user.tenantId
    };

    if (Array.isArray(userIds)) {
      data.users = { connect: userIds.map(id => ({ id })) };
    }

    const role = await prisma.customRole.create({
      data,
      include: { users: { select: { id: true, name: true } } }
    });

    res.status(201).json({ status: 'success', data: { role } });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing role
 */
exports.updateRole = async (req, res, next) => {
  try {
    const { name, permissions, userIds } = req.body;

    const role = await prisma.customRole.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });

    if (!role) {
      return next(new AppError('No role found with that ID', 404));
    }

    const data = {
      name: name !== undefined ? name : role.name,
      permissions: permissions !== undefined ? permissions : role.permissions
    };

    if (Array.isArray(userIds)) {
      data.users = { set: userIds.map(id => ({ id })) };
    }

    const updatedRole = await prisma.customRole.update({
      where: { id: req.params.id },
      data,
      include: { users: { select: { id: true, name: true } } }
    });

    res.status(200).json({ status: 'success', data: { role: updatedRole } });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a role
 */
exports.deleteRole = async (req, res, next) => {
  try {
    const role = await prisma.customRole.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });

    if (!role) {
      return next(new AppError('No role found with that ID', 404));
    }

    await prisma.customRole.delete({
      where: { id: req.params.id }
    });

    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};
