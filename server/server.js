const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../'));

// MongoDB connection
let isMongoConnected = false;

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Connected to MongoDB successfully');
    isMongoConnected = true;
    initializeDefaultData();
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('\n🔧 To fix this issue:');
    console.log('1. Go to your MongoDB Atlas dashboard');
    console.log('2. Click on "Network Access" in the left sidebar');
    console.log('3. Click "Add IP Address"');
    console.log('4. Click "Add Current IP Address" or "Allow Access from Anywhere" (0.0.0.0/0)');
    console.log('5. Save the changes and restart the server\n');
    console.log('⚠️  Server will continue running but database features will be unavailable\n');
    isMongoConnected = false;
});

// Middleware to check MongoDB connection
const requireMongo = (req, res, next) => {
    if (!isMongoConnected) {
        return res.status(503).json({ 
            error: 'Database unavailable. Please check MongoDB Atlas IP whitelist settings.',
            details: 'Your IP address needs to be added to the MongoDB Atlas whitelist.'
        });
    }
    next();
};

// College Schema
const collegeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    address: String,
    phone: String,
    email: String,
    createdAt: { type: Date, default: Date.now }
});

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
    email: String,
    fullName: String,
    createdAt: { type: Date, default: Date.now }
});

// Student Schema
const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rollNumber: String,
    email: String,
    phone: String,
    course: String,
    year: String,
    section: String,
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    category: { type: String, default: 'participation' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

// Create indexes for better performance
userSchema.index({ username: 1, college: 1 }, { unique: true });
studentSchema.index({ rollNumber: 1, college: 1 }, { unique: true });

const College = mongoose.model('College', collegeSchema);
const User = mongoose.model('User', userSchema);
const Student = mongoose.model('Student', studentSchema);

// Multer configuration for CSV uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Initialize default data
async function initializeDefaultData() {
    try {
        const collegeCount = await College.countDocuments();
        if (collegeCount === 0) {
            console.log('Creating default colleges and users...');

            // Create sample colleges
            const colleges = await College.insertMany([
                {
                    name: "ABC Engineering College",
                    code: "ABC",
                    url: "https://abc-engineering.edu",
                    address: "123 Tech Street, Engineering City",
                    phone: "+1234567890",
                    email: "admin@abc-engineering.edu"
                },
                {
                    name: "XYZ University",
                    code: "XYZ",
                    url: "https://xyz-university.edu",
                    address: "456 University Avenue, Academic Town",
                    phone: "+1234567891",
                    email: "admin@xyz-university.edu"
                },
                {
                    name: "Tech Institute of Technology",
                    code: "TIT",
                    url: "https://tech-institute.edu",
                    address: "789 Innovation Drive, Tech Valley",
                    phone: "+1234567892",
                    email: "admin@tech-institute.edu"
                }
            ]);

            // Create sample users for each college
            const users = [];
            for (const college of colleges) {
                const hashedPassword = await bcrypt.hash('password123', 10);
                users.push(
                    {
                        username: 'admin',
                        password: hashedPassword,
                        college: college._id,
                        role: 'admin',
                        email: `admin@${college.code.toLowerCase()}.edu`,
                        fullName: `${college.name} Administrator`
                    },
                    {
                        username: 'staff1',
                        password: hashedPassword,
                        college: college._id,
                        role: 'staff',
                        email: `staff1@${college.code.toLowerCase()}.edu`,
                        fullName: `${college.name} Staff Member`
                    }
                );
            }

            await User.insertMany(users);

            // Create sample students
            const students = [];
            for (const college of colleges) {
                const sampleStudents = [
                    {
                        name: "John Doe",
                        rollNumber: "2021001",
                        email: "john.doe@student.edu",
                        phone: "+1234567800",
                        course: "Computer Science",
                        year: "3rd Year",
                        section: "A",
                        college: college._id,
                        category: "participation"
                    },
                    {
                        name: "Jane Smith",
                        rollNumber: "2021002",
                        email: "jane.smith@student.edu",
                        phone: "+1234567801",
                        course: "Computer Science",
                        year: "3rd Year",
                        section: "A",
                        college: college._id,
                        category: "merit"
                    },
                    {
                        name: "Mike Johnson",
                        rollNumber: "2021003",
                        email: "mike.johnson@student.edu",
                        phone: "+1234567802",
                        course: "Electronics",
                        year: "2nd Year",
                        section: "B",
                        college: college._id,
                        category: "excellence"
                    }
                ];
                students.push(...sampleStudents);
            }

            await Student.insertMany(students);

            console.log('Default data created successfully!');
            console.log('Sample login credentials:');
            console.log('Username: admin, Password: password123');
            console.log('Username: staff1, Password: password123');
        }
    } catch (error) {
        console.error('Error initializing default data:', error);
    }
}

// Routes

// Get all colleges
app.get('/api/colleges', requireMongo, async (req, res) => {
    try {
        const colleges = await College.find().select('name code url');
        res.json(colleges);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
app.post('/api/login', requireMongo, async (req, res) => {
    try {
        const { username, password, collegeId } = req.body;

        // Find user
        const user = await User.findOne({ username, college: collegeId }).populate('college');
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                username: user.username, 
                college: user.college._id,
                collegeName: user.college.name,
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                college: {
                    id: user.college._id,
                    name: user.college.name,
                    code: user.college.code
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get students for the logged-in user's college
app.get('/api/students', requireMongo, authenticateToken, async (req, res) => {
    try {
        const students = await Student.find({ college: req.user.college })
            .populate('addedBy', 'username fullName')
            .sort({ createdAt: -1 });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add single student
app.post('/api/students', requireMongo, authenticateToken, async (req, res) => {
    try {
        // Check if roll number already exists in the college
        if (req.body.rollNumber) {
            const existingStudent = await Student.findOne({
                rollNumber: req.body.rollNumber,
                college: req.user.college
            });
            
            if (existingStudent) {
                return res.status(400).json({ 
                    error: `Student with roll number "${req.body.rollNumber}" already exists` 
                });
            }
        }

        const studentData = {
            ...req.body,
            college: req.user.college,
            addedBy: req.user.userId
        };

        const student = new Student(studentData);
        await student.save();
        
        const populatedStudent = await Student.findById(student._id)
            .populate('addedBy', 'username fullName');
        
        res.status(201).json(populatedStudent);
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ error: 'Student with this roll number already exists' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Bulk add students via CSV
app.post('/api/students/bulk', requireMongo, authenticateToken, upload.single('csvFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No CSV file uploaded' });
        }

        const students = [];
        const errors = [];

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (row) => {
                try {
                    const student = {
                        name: row.name || row.Name,
                        rollNumber: row.rollNumber || row['Roll Number'] || row.roll_number,
                        email: row.email || row.Email,
                        phone: row.phone || row.Phone,
                        course: row.course || row.Course,
                        year: row.year || row.Year,
                        section: row.section || row.Section,
                        college: req.user.college,
                        addedBy: req.user.userId
                    };

                    if (student.name) {
                        students.push(student);
                    }
                } catch (error) {
                    errors.push(`Error processing row: ${error.message}`);
                }
            })
            .on('end', async () => {
                try {
                    // Check for existing roll numbers
                    const rollNumbers = students
                        .filter(s => s.rollNumber)
                        .map(s => s.rollNumber);
                    
                    const existingStudents = await Student.find({
                        rollNumber: { $in: rollNumbers },
                        college: req.user.college
                    }).select('rollNumber');
                    
                    const existingRollNumbers = existingStudents.map(s => s.rollNumber);
                    const duplicateRollNumbers = [];
                    
                    // Filter out students with duplicate roll numbers
                    const validStudents = students.filter(student => {
                        if (student.rollNumber && existingRollNumbers.includes(student.rollNumber)) {
                            duplicateRollNumbers.push(student.rollNumber);
                            return false;
                        }
                        return true;
                    });
                    
                    // Save valid students
                    let savedStudents = [];
                    if (validStudents.length > 0) {
                        savedStudents = await Student.insertMany(validStudents, { ordered: false });
                    }
                    
                    // Clean up uploaded file
                    fs.unlinkSync(req.file.path);
                    
                    const result = {
                        message: `Successfully added ${savedStudents.length} students`,
                        count: savedStudents.length,
                        total: students.length,
                        errors: errors
                    };
                    
                    if (duplicateRollNumbers.length > 0) {
                        result.duplicates = {
                            count: duplicateRollNumbers.length,
                            rollNumbers: duplicateRollNumbers
                        };
                        result.message += `. ${duplicateRollNumbers.length} students were skipped due to duplicate roll numbers.`;
                    }
                    
                    res.json(result);
                } catch (error) {
                    // Clean up uploaded file
                    fs.unlinkSync(req.file.path);
                    res.status(500).json({ error: error.message });
                }
            });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update student
app.put('/api/students/:id', requireMongo, authenticateToken, async (req, res) => {
    try {
        const student = await Student.findOneAndUpdate(
            { _id: req.params.id, college: req.user.college },
            req.body,
            { new: true }
        ).populate('addedBy', 'username fullName');

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json(student);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete student
app.delete('/api/students/:id', requireMongo, authenticateToken, async (req, res) => {
    try {
        const student = await Student.findOneAndDelete({
            _id: req.params.id,
            college: req.user.college
        });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get student CSV template
app.get('/api/students/template', (req, res) => {
    const csvContent = 'name,rollNumber,email,phone,course,year,section\n' +
                      'John Doe,2021001,john@student.edu,+1234567890,Computer Science,3rd Year,A\n' +
                      'Jane Smith,2021002,jane@student.edu,+1234567891,Electronics,2nd Year,B\n' +
                      'Mike Johnson,2021003,mike@student.edu,+1234567892,Mechanical,1st Year,C';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students_template.csv');
    res.send(csvContent);
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the main app
app.get('/', (req, res) => {
    // If MongoDB is not connected, redirect to offline mode
    if (!isMongoConnected) {
        res.sendFile(__dirname + '/../offline.html');
    } else {
        res.sendFile(__dirname + '/../login.html');
    }
});

// Serve other pages
app.get('/login.html', (req, res) => {
    res.sendFile(__dirname + '/../login.html');
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(__dirname + '/../dashboard.html');
});

app.get('/offline.html', (req, res) => {
    res.sendFile(__dirname + '/../offline.html');
});

app.get('/index.html', (req, res) => {
    res.sendFile(__dirname + '/../index.html');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the app at: http://localhost:${PORT}`);
});
