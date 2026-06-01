const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage: storage });

// POST /documents
// Expects: file, uploadedById, (allocationId or projectId)
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { uploadedById, allocationId, projectId } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (!uploadedById) {
      return res.status(400).json({ error: 'uploadedById is required' });
    }

    const uploader = await prisma.user.findUnique({ where: { id: uploadedById } });
    if (!uploader) {
      return res.status(400).json({ error: 'Uploader not found' });
    }

    let initialStatus = 'Information';
    if (uploader.role === 'STUDENT') {
      initialStatus = 'Pending Faculty Review';
    } else if (uploader.role === 'MENTOR') {
      initialStatus = 'Pending Coordinator Review';
    }

    const document = await prisma.document.create({
      data: {
        filename: req.file.originalname,
        filepath: `/uploads/${req.file.filename}`,
        fileType: req.file.mimetype,
        uploadedById,
        allocationId: allocationId || null,
        projectId: projectId || null,
        status: initialStatus
      }
    });
    
    res.status(201).json(document);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// GET /documents - get all accessible documents
// Query params: userId (optional, for filtering by uploader), allocationId, projectId
router.get('/', async (req, res) => {
  try {
    const { userId, allocationId, projectId } = req.query;
    
    let whereClause = {};
    if (allocationId) whereClause.allocationId = allocationId;
    if (projectId) whereClause.projectId = projectId;
    if (userId) whereClause.uploadedById = userId;

    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        uploadedBy: {
          select: { id: true, name: true, role: true }
        },
        project: {
          select: { title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(documents);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// PUT /documents/:id/review
router.put('/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;
    
    const document = await prisma.document.update({
      where: { id },
      data: {
        status,
        feedback
      }
    });
    
    res.json(document);
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ error: 'Failed to review document' });
  }
});

// DELETE /documents/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const document = await prisma.document.findUnique({ where: { id } });
        if (!document) return res.status(404).json({ error: 'Not found' });
        
        // Remove file from disk
        const filePath = path.join(__dirname, '..', document.filepath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await prisma.document.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

module.exports = router;
