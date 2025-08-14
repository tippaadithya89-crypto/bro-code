# Certificate Generator Web App

A modern web application that generates instant event participation certificates from CSV data. This solution eliminates manual certificate preparation delays and provides a seamless experience for event organizers.

# Certificate Generator Web App

A comprehensive web application that generates instant event participation certificates with MongoDB authentication and student management. This solution eliminates manual certificate preparation delays and provides a seamless experience for event organizers with multi-college support.

## 🌟 Features

### Authentication & Multi-College Support
- **College-based Authentication**: Secure login system with college selection
- **Multi-tenant Architecture**: Support for multiple colleges in single system
- **User Roles**: Admin and staff roles with appropriate permissions
- **JWT Authentication**: Secure token-based authentication
- **Demo Data**: Pre-populated colleges and users for testing

### Student Management
- **Student Database**: Comprehensive student management for each college
- **Bulk Import**: CSV upload for adding multiple students
- **Student Profiles**: Detailed student information (name, roll number, course, etc.)
- **Category Assignment**: Assign merit categories to students
- **Search & Filter**: Advanced filtering by name, course, category
- **CRUD Operations**: Add, edit, delete student records

### Certificate Generation
- **CSV Upload**: Easy drag-and-drop or click-to-upload CSV files
- **College Integration**: Generate certificates directly from student database
- **Template Download**: Downloadable CSV template for users without existing data
- **Participant Review**: Display and verify participant information before generation
- **Merit Categories**: Assign different certificate categories to participants:
  - **Participation** - Standard participation certificates
  - **Merit** - Recognition for meritorious performance
  - **Excellence** - Awards for excellent achievement
  - **Outstanding** - Certificates for outstanding performance
  - **Custom Categories** - Add your own custom certificate categories
- **Category Management**: 
  - Select multiple participants and assign categories in bulk
  - Add custom categories with text input
  - Visual category badges on participant list
- **Template Previews**: See actual certificate previews before selection
- **Multiple Templates**: Choose from 4 professionally designed certificate templates:
  - Modern Certificate (Clean and professional)
  - Classic Certificate (Traditional formal design)
  - Colorful Certificate (Vibrant and energetic)
  - Minimalist Certificate (Simple and clean)
- **Category-Specific Certificates**: Different certificate titles and text based on category
- **Batch Generation**: Generate certificates for all participants at once
- **ZIP Download**: Download all certificates in a single ZIP file
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Progress Tracking**: Visual progress indicator and step-by-step workflow

## 🚀 Getting Started

### Prerequisites

- **Node.js** (version 14 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone or download this repository**
2. **Run the setup script**:
   - **Windows**: Double-click `setup.bat` or run in command prompt
   - **Linux/Mac**: Run `chmod +x setup.sh && ./setup.sh`
3. **Start the server**:
   ```bash
   cd server
   npm start
   ```
4. **Open your browser** and visit `http://localhost:3000`

### Quick Setup Commands

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Start the server
npm start
```

### Demo Credentials

The system comes with pre-populated demo data:

**Colleges Available:**
- ABC Engineering College
- XYZ University  
- Tech Institute of Technology

**Login Credentials (for any college):**
- **Username**: `admin` | **Password**: `password123`
- **Username**: `staff1` | **Password**: `password123`

## 📋 How to Use

### Step 1: Login
1. **Open the application** at `http://localhost:3000`
2. **Select your college** from the dropdown
3. **Enter credentials**:
   - Username: `admin` or `staff1`
   - Password: `password123`
4. **Click Login** to access the dashboard

### Step 2: Choose Your Path
After login, you have two main options:

#### Option A: Generate Certificates
- Choose "Generate Certificates" for immediate certificate creation
- Option 1: **Use College Students** - Generate from your student database
- Option 2: **Upload Custom CSV** - Use external participant data

#### Option B: Manage Students
- Choose "Manage Students" to handle your college's student database
- View, add, edit, or delete student records
- Bulk upload students via CSV
- Assign categories to students

### Step 3A: Student Management Workflow
1. **View Students**: See all students in your college with filtering options
2. **Add Individual Student**: Use the "Add Student" button for single entries
3. **Bulk Upload**: 
   - Click "Bulk Upload" 
   - Download the CSV template if needed
   - Upload your CSV file with student data
4. **Manage Categories**: Assign merit categories to students
5. **Search & Filter**: Use search bar and category filters

### Step 3B: Certificate Generation Workflow  
1. **Upload Participant Data** (if using custom CSV)
   - Have a CSV file? Drag and drop it or click to browse
   - Don't have a CSV? Click "Download CSV Template" to get a sample file
   - Fill out the template with your participant information

2. **Review Participants & Assign Categories**
   - Verify all participant information is correct
   - **Assign Categories**: 
     - Select participants using checkboxes
     - Choose from existing categories (Participation, Merit, Excellence, Outstanding)
     - Click "Assign to Selected" to apply the category
   - **Add Custom Categories**:
     - Type a new category name in the text field
     - Click "Add Category" to create it
     - The new category will be available for assignment
   - Check the participant count and category assignments
   - Click "Next: Choose Template" to proceed

3. **Select Certificate Template**
   - Browse through 4 beautiful template options with **live previews**
   - See exactly how your certificates will look
   - Click on your preferred template to select it
   - Click "Generate Certificates" to start the process

4. **Download Certificates**
   - Watch the progress bar as certificates are generated
   - Click "Download All Certificates" to get a ZIP file
   - All certificates are automatically saved as individual PDF files

## 📊 CSV Format

Your CSV file should include the following columns (minimum requirements):

| Column | Description | Required |
|--------|-------------|----------|
| name | Participant's full name | ✅ Yes |
| event | Event name | ⚡ Recommended |
| date | Event date | ⚡ Recommended |
| email | Email address | ❌ Optional |
| position | Role/Position | ❌ Optional |
| category | Certificate category | ❌ Optional |

### Sample CSV Content:
```csv
name,event,date,email,position,category
John Doe,Annual Conference 2024,2024-08-14,john@email.com,Attendee,participation
Jane Smith,Annual Conference 2024,2024-08-14,jane@email.com,Speaker,merit
Mike Johnson,Annual Conference 2024,2024-08-14,mike@email.com,Volunteer,excellence
Sarah Wilson,Annual Conference 2024,2024-08-14,sarah@email.com,Organizer,outstanding
```

### Certificate Categories

The app supports different certificate categories that change the certificate title and content:

- **participation** → "Certificate of Participation"
- **merit** → "Certificate of Merit"  
- **excellence** → "Certificate of Excellence"
- **outstanding** → "Certificate of Outstanding Performance"
- **custom** → "Certificate of [Custom Category Name]"

If no category is specified, "participation" is used as default.

## 🎨 Certificate Templates

### 1. Modern Certificate
- Clean, professional design
- Blue and purple gradient colors
- Perfect for corporate events

### 2. Classic Certificate
- Traditional formal layout
- Brown and gold color scheme
- Ideal for academic events

### 3. Colorful Certificate
- Vibrant and energetic design
- Orange and red color palette
- Great for creative events

### 4. Minimalist Certificate
- Simple, clean aesthetic
- Gray and blue tones
- Suitable for any event type

## 🛠️ Technical Details

### Architecture
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer for CSV processing
- **PDF Generation**: jsPDF library
- **File Compression**: JSZip library

### Built With
- **Frontend Libraries**:
  - jsPDF - PDF generation
  - JSZip - ZIP file creation
  - Font Awesome - Icons
- **Backend Libraries**:
  - Express.js - Web framework
  - Mongoose - MongoDB object modeling
  - bcryptjs - Password hashing
  - jsonwebtoken - JWT authentication
  - multer - File upload handling
  - csv-parser - CSV file processing
  - cors - Cross-origin resource sharing

### Database Schema

#### Colleges Collection
```javascript
{
  name: String,
  code: String,
  url: String,
  address: String,
  phone: String,
  email: String
}
```

#### Users Collection
```javascript
{
  username: String,
  password: String (hashed),
  college: ObjectId (ref: College),
  role: String (admin/staff),
  email: String,
  fullName: String
}
```

#### Students Collection
```javascript
{
  name: String,
  rollNumber: String,
  email: String,
  phone: String,
  course: String,
  year: String,
  section: String,
  college: ObjectId (ref: College),
  category: String,
  addedBy: ObjectId (ref: User)
}
```

### API Endpoints

#### Authentication
- `GET /api/colleges` - Get all colleges
- `POST /api/login` - User login

#### Student Management
- `GET /api/students` - Get students for logged-in user's college
- `POST /api/students` - Add single student
- `POST /api/students/bulk` - Bulk upload students via CSV
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/template` - Download CSV template

### Browser Compatibility
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

### File Structure
```
├── server/                 # Backend server files
│   ├── package.json       # Server dependencies
│   ├── server.js          # Main server file
│   ├── .env              # Environment variables
│   └── uploads/          # Temporary CSV uploads
├── css/
│   ├── styles.css        # Main app styles
│   ├── login.css         # Login page styles
│   └── dashboard.css     # Dashboard styles
├── js/
│   ├── app.js           # Main certificate generator
│   ├── login.js         # Login functionality
│   └── dashboard.js     # Dashboard functionality
├── login.html           # Login page
├── dashboard.html       # Main dashboard
├── index.html          # Certificate generator
├── setup.bat           # Windows setup script
├── setup.sh            # Linux/Mac setup script
└── README.md           # This file
```

## 🔧 Customization

### Adding New Templates
To add a new certificate template:

1. Open `js/app.js`
2. Add your template to the `templates` array in `setupTemplates()`
3. Add the template styling in the `templates` object in `generateCertificatePDF()`
4. Customize colors, fonts, and layout as needed

### Modifying CSV Columns
The app automatically detects CSV columns. To add support for new fields:

1. Update the CSV template in `downloadTemplate()`
2. Modify the `generateCertificatePDF()` function to include new fields
3. Update the README with the new column information

## 📱 Mobile Support

The application is fully responsive and works on:
- Desktop computers
- Tablets (portrait and landscape)
- Mobile phones
- Touch devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Troubleshooting

### Common Issues

**CSV file not uploading:**
- Ensure the file has a .csv extension
- Check that the file is not corrupted
- Verify the CSV has at least a header row and one data row

**Certificates not generating:**
- Ensure you have selected a template
- Check that participant data is loaded
- Try refreshing the page and starting over

**Download not working:**
- Check if your browser blocks pop-ups
- Ensure you have sufficient storage space
- Try using a different browser

**Mobile display issues:**
- Rotate your device to landscape mode for better viewing
- Zoom out if the interface appears too large
- Clear your browser cache

## 🎯 Future Enhancements

- [ ] Custom template upload
- [ ] Email integration for direct certificate sending
- [ ] QR code verification system
- [ ] Multi-language support
- [ ] Advanced styling options
- [ ] Integration with event management platforms
- [ ] Certificate analytics and tracking

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the [Issues](https://github.com/your-repo/issues) page
3. Create a new issue with detailed information

---

**Made with ❤️ for event organizers worldwide**
