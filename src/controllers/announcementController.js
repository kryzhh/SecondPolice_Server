const prisma = require('../lib/prisma');
const AppError = require('../utils/appError');

exports.getAnnouncements = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const announcements = await prisma.announcement.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        author: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(200).json({ status: 'success', data: { announcements } });
  } catch (error) {
    next(error);
  }
};

exports.createAnnouncement = async (req, res, next) => {
  try {
    // Enforce RBAC for creation
    if (req.user.role !== 'ADMIN' && req.user.permissions['Noticeboard'] !== 'Read & Write') {
      return next(new AppError('You do not have permission to post announcements', 403));
    }

    const { title, content } = req.body;
    if (!title || !content) {
      return next(new AppError('Please provide title and content', 400));
    }

    const announcement = await prisma.announcement.create({
      data: {
        tenantId: req.user.tenantId,
        title,
        content,
        authorId: req.user.id
      },
      include: {
        author: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json({ status: 'success', data: { announcement } });
  } catch (error) {
    next(error);
  }
};

exports.updateAnnouncement = async (req, res, next) => {
  try {
    // Enforce RBAC for updates
    if (req.user.role !== 'ADMIN' && req.user.permissions['Noticeboard'] !== 'Read & Write') {
      return next(new AppError('You do not have permission to edit announcements', 403));
    }

    const { id } = req.params;
    const { title, content } = req.body;

    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing || existing.tenantId !== req.user.tenantId) {
      return next(new AppError('Announcement not found', 404));
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: { title, content },
      include: {
        author: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(200).json({ status: 'success', data: { announcement } });
  } catch (error) {
    next(error);
  }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try {
    // Enforce RBAC for deletion
    if (req.user.role !== 'ADMIN' && req.user.permissions['Noticeboard'] !== 'Read & Write') {
      return next(new AppError('You do not have permission to delete announcements', 403));
    }

    const { id } = req.params;

    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing || existing.tenantId !== req.user.tenantId) {
      return next(new AppError('Announcement not found', 404));
    }

    await prisma.announcement.delete({ where: { id } });

    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};
