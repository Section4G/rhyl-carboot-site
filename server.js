const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// File paths
const DATA_FILE = path.join(__dirname, 'status.json');
const GALLERY_FILE = path.join(__dirname, 'gallery.json');
const HERO_BG_FILE = path.join(__dirname, 'hero-background.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const GALLERY_UPLOADS_DIR = path.join(UPLOADS_DIR, 'gallery');
const HERO_UPLOADS_DIR = path.join(UPLOADS_DIR, 'hero');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'noblesrhyl1121';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Create upload directories
async function createUploadDirectories() {
    try {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
        await fs.mkdir(GALLERY_UPLOADS_DIR, { recursive: true });
        await fs.mkdir(HERO_UPLOADS_DIR, { recursive: true });
        console.log('✅ Upload directories created');
    } catch (error) {
        console.error('❌ Error creating upload directories:', error);
    }
}

// Multer configuration
const galleryStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, GALLERY_UPLOADS_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'gallery-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const heroStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, HERO_UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, 'hero-background' + path.extname(file.originalname))
});

const uploadGallery = multer({
    storage: galleryStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files allowed'));
    }
});

const uploadHero = multer({
    storage: heroStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files allowed'));
    }
});

// Serve static files
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOADS_DIR));

// Initialize data files
async function initializeDataFiles() {
    try {
        // Status file
        try {
            await fs.access(DATA_FILE);
        } catch {
            const defaultData = { status: false, notice: '', lastUpdated: new Date().toISOString() };
            await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2));
            console.log('✅ Created status.json');
        }

        // Gallery file
        try {
            await fs.access(GALLERY_FILE);
        } catch {
            const defaultGallery = { images: [] };
            await fs.writeFile(GALLERY_FILE, JSON.stringify(defaultGallery, null, 2));
            console.log('✅ Created gallery.json');
        }

        // Hero background file
        try {
            await fs.access(HERO_BG_FILE);
        } catch {
            const defaultHero = { filename: null, uploadedAt: null };
            await fs.writeFile(HERO_BG_FILE, JSON.stringify(defaultHero, null, 2));
            console.log('✅ Created hero-background.json');
        }
    } catch (error) {
        console.error('❌ Error initializing data files:', error);
    }
}

// Helper functions
async function readStatus() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return { status: false, notice: '', lastUpdated: new Date().toISOString() };
    }
}

async function writeStatus(data) {
    const statusData = { ...data, lastUpdated: new Date().toISOString() };
    await fs.writeFile(DATA_FILE, JSON.stringify(statusData, null, 2));
    return statusData;
}

async function readGallery() {
    try {
        const data = await fs.readFile(GALLERY_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return { images: [] };
    }
}

async function writeGallery(data) {
    await fs.writeFile(GALLERY_FILE, JSON.stringify(data, null, 2));
    return data;
}

async function readHeroBackground() {
    try {
        const data = await fs.readFile(HERO_BG_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return { filename: null, uploadedAt: null };
    }
}

async function writeHeroBackground(data) {
    await fs.writeFile(HERO_BG_FILE, JSON.stringify(data, null, 2));
    return data;
}

// API Routes
app.get('/api/status', async (req, res) => {
    try {
        const statusData = await readStatus();
        res.json(statusData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get status' });
    }
});

app.get('/api/gallery', async (req, res) => {
    try {
        const galleryData = await readGallery();
        res.json(galleryData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get gallery' });
    }
});

app.get('/api/hero-background', async (req, res) => {
    try {
        const heroData = await readHeroBackground();
        res.json(heroData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get hero background' });
    }
});

// Upload routes
app.post('/admin/upload-gallery', uploadGallery.single('image'), async (req, res) => {
    try {
        if (req.body.password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const galleryData = await readGallery();
        
        if (galleryData.images.length >= 10) {
            await fs.unlink(req.file.path);
            return res.status(400).json({ error: 'Gallery full (10 max)' });
        }

        const imageData = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            description: req.body.description || '',
            uploadedAt: new Date().toISOString()
        };

        galleryData.images.push(imageData);
        await writeGallery(galleryData);

        res.json({ success: true, image: imageData });
    } catch (error) {
        res.status(500).json({ error: 'Upload failed' });
    }
});

app.post('/admin/upload-hero', uploadHero.single('image'), async (req, res) => {
    try {
        if (req.body.password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const heroData = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            uploadedAt: new Date().toISOString()
        };

        await writeHeroBackground(heroData);
        res.json({ success: true, hero: heroData });
    } catch (error) {
        res.status(500).json({ error: 'Upload failed' });
    }
});

app.post('/admin/update-status', async (req, res) => {
    try {
        if (req.body.password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { status, notice } = req.body;
        const statusData = await writeStatus({ 
            status: status === 'true' || status === true, 
            notice: notice || '' 
        });
        
        res.json({ success: true, data: statusData });
    } catch (error) {
        res.status(500).json({ error: 'Update failed' });
    }
});

// Admin page
app.get('/admin', async (req, res) => {
    try {
        const statusData = await readStatus();
        const galleryData = await readGallery();
        const heroData = await readHeroBackground();
        
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Rhyl Car Boot</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #21808D; text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; background: #fafafa; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, textarea, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        button { background: #21808D; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #1d6f7a; }
        .status-current { font-size: 18px; padding: 10px; text-align: center; border-radius: 4px; margin-bottom: 15px; }
        .status-open { background: #d4edda; color: #155724; }
        .status-closed { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚗 Rhyl Car Boot - Admin Panel</h1>
        
        <div class="section">
            <h2>Current Status</h2>
            <div class="status-current ${statusData.status ? 'status-open' : 'status-closed'}">
                Currently: ${statusData.status ? 'OPEN' : 'CLOSED'}
                ${statusData.notice ? `<br>Notice: "${statusData.notice}"` : ''}
            </div>
        </div>

        <div class="section">
            <h2>Update Status</h2>
            <form method="POST" action="/admin/update-status">
                <div class="form-group">
                    <label>Password:</label>
                    <input type="password" name="password" required>
                </div>
                <div class="form-group">
                    <label>Status:</label>
                    <select name="status" required>
                        <option value="true" ${statusData.status ? 'selected' : ''}>Open</option>
                        <option value="false" ${!statusData.status ? 'selected' : ''}>Closed</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Notice (optional):</label>
                    <textarea name="notice">${statusData.notice || ''}</textarea>
                </div>
                <button type="submit">Update Status</button>
            </form>
        </div>

        <div class="section">
            <h2>Gallery (${galleryData.images.length}/10)</h2>
            ${galleryData.images.length < 10 ? `
                <form method="POST" action="/admin/upload-gallery" enctype="multipart/form-data">
                    <div class="form-group">
                        <label>Password:</label>
                        <input type="password" name="password" required>
                    </div>
                    <div class="form-group">
                        <label>Image:</label>
                        <input type="file" name="image" accept="image/*" required>
                    </div>
                    <div class="form-group">
                        <label>Description:</label>
                        <input type="text" name="description">
                    </div>
                    <button type="submit">Upload Image</button>
                </form>
            ` : '<p>Gallery Full</p>'}
        </div>

        <div class="section">
            <h2>Hero Background</h2>
            <form method="POST" action="/admin/upload-hero" enctype="multipart/form-data">
                <div class="form-group">
                    <label>Password:</label>
                    <input type="password" name="password" required>
                </div>
                <div class="form-group">
                    <label>Background Image:</label>
                    <input type="file" name="image" accept="image/*" required>
                </div>
                <button type="submit">Upload Background</button>
            </form>
        </div>

        <p><a href="/">← Back to Site</a></p>
    </div>
</body>
</html>`;
        
        res.send(html);
    } catch (error) {
        res.status(500).send('Admin error');
    }
});

// Health check for Render
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
    try {
        await createUploadDirectories();
        await initializeDataFiles();
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌐 Health check: http://localhost:${PORT}/health`);
            console.log(`⚙️ Admin panel: http://localhost:${PORT}/admin`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
