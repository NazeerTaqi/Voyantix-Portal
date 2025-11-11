# QMS Portal - Quality Management System

A comprehensive Quality Management System web application built with HTML, CSS, JavaScript, and Bootstrap 5. This application is designed for pharmaceutical and manufacturing companies, following GMP and regulatory compliance principles.

## 🚀 Features

### Authentication & Security
- Secure login with role-based access control
- Password policy enforcement (min 8 chars, alphanumeric + special)
- Auto logout after inactivity (30 minutes)
- Session management with multiple login prevention
- Last login timestamp display
- Account lockout after failed attempts

### Modules

1. **Change Control (CC)**
   - Form fields: Title, Type of Change, Existing System, Proposed System, Reason, Attachments
   - Workflow: Initiator → HOD → QA Manager → Head QA
   - Auto-generate unique CC numbers
   - Effectiveness check option
   - Summary reports

2. **CAPA (Corrective and Preventive Action)**
   - Source tracking: Deviations, Market Complaints, Audit Observations
   - Workflow: Initiator → HOD → QA Manager → Head QA
   - Action plan, timeline, delay justification
   - Auto-generate CAPA numbers
   - CAPA reports

3. **Deviation**
   - Capture: Description, Related to, Impact on, Actions Taken
   - Roles: Initiator, HOD, QA Manager, Plant Head, Head QA, Investigator
   - Investigation and risk assessment
   - Auto-close target: 30 days
   - Department-wise summary reports

4. **Market Complaint**
   - Product details, complaint type, batch, investigation
   - Roles: QA Manager, HOD, Head QA, Plant Head
   - Field Alert Report and Investigation Report
   - Option to trigger CAPA
   - Auto follow-up tasks every 7 days

5. **Lab Incident Report (LIR)**
   - Batch details, description, root cause, immediate action
   - Roles: QC Initiator, Section Incharge, Head QC, Analytical QA Incharge, Head QA
   - Auto closure target: 30 days
   - Extension request workflow
   - Department-wise logs and LIR reports

6. **Audit Management**
   - Add auditors, schedule audits (internal/external)
   - Roles: QA Manager, Head QA
   - Record findings, action items, compliance closure
   - Audit summary and compliance status dashboard

7. **Vendor Qualification (VQ)**
   - Roles: QA Manager, Purchase HOD, Head QA
   - Vendor registration, questionnaire, samples, documents
   - Vendor evaluation and re-audit workflow
   - Auto rating and vendor performance log

8. **Quality Risk Management (QRM)**
   - Fields: Title, Objective, Scope, Risk Assessment details
   - Workflow: Initiator → Dept. HOD → QA Manager → Head QA
   - Risk ranking (severity × probability matrix)
   - Risk reports and mitigation summaries

9. **Product Recall**
   - Recall type, product details, meeting schedules
   - Workflow: QA Manager → Head QA → Site Quality Head
   - PIRC Meeting flow and Recall effectiveness tracking
   - Auto-generate closure checklist

10. **OOS/OOT Management**
    - Product details, sample info, observed results
    - Multi-phase investigation: Phase-I, IB, II
    - Roles: QC Initiator, Operating Manager QC, Head QC, Analytical QA, Head QA
    - Hypothesis, retesting, and closure comments
    - OOS/OOT trend reports

### Common Features Across All Modules
- File attachments (upload + preview)
- E-signature (modal-based confirmation)
- Comment history thread
- Change request and state transition logs
- Date auto-format: dd-MMM-yyyy
- Local time display per user
- Notification simulation via Bootstrap toasts
- Dashboard widgets: total open/closed records per module
- Reports with CSV/PDF export
- Sortable and filterable tables

## 👥 User Roles

The system supports the following roles with specific access levels:

- **Initiator** - Can create and view records
- **HOD** - Can approve, view, and reject
- **QA Manager** - Can approve, view, reject, and close
- **Head QA** - Full access including final approval
- **Plant Head** - Can approve and view
- **Analytical QA Incharge** - Can approve, view, and investigate
- **Head QC** - Can approve, view, and investigate
- **Operating Manager CQA** - Can approve and view
- **Site Quality Head** - Can approve, view, and final approve
- **Purchase HOD** - Can approve and view
- **Head CQA** - Can approve, view, and final approve

## 🔐 Default Login Credentials

The system comes with pre-configured users for testing:

| Username | Password | Role |
|----------|----------|------|
| initiator | Initiator@123 | Initiator |
| hod | HOD@123 | HOD |
| qa_manager | QAManager@123 | QA Manager |
| head_qa | HeadQA@123 | Head QA |
| plant_head | PlantHead@123 | Plant Head |
| analytical_qa | AnalyticalQA@123 | Analytical QA Incharge |
| head_qc | HeadQC@123 | Head QC |
| operating_manager | OpManager@123 | Operating Manager CQA |
| site_quality | SiteQuality@123 | Site Quality Head |
| purchase_hod | PurchaseHOD@123 | Purchase HOD |
| head_cqa | HeadCQA@123 | Head CQA |

## 📋 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari)
- No server required - runs entirely in the browser

### Installation
1. Clone or download this repository
2. Open `index.html` in your web browser
3. Login with any of the default credentials above

### File Structure
```
QMS Portal/
├── index.html              # Login page
├── dashboard.html          # Main dashboard
├── modules/                # Module HTML pages
│   ├── change-control.html
│   ├── capa.html
│   ├── deviation.html
│   ├── market-complaint.html
│   ├── lir.html
│   ├── audit.html
│   ├── vendor-qualification.html
│   ├── qrm.html
│   ├── product-recall.html
│   └── oos-oot.html
├── assets/
│   ├── css/
│   │   └── style.css       # Main stylesheet
│   └── js/
│       ├── app.js          # Main application logic
│       ├── auth.js         # Authentication module
│       ├── dashboard.js    # Dashboard functionality
│       └── modules/        # Module-specific JavaScript
│           ├── change-control.js
│           ├── capa.js
│           ├── deviation.js
│           ├── market-complaint.js
│           ├── lir.js
│           ├── audit.js
│           ├── vendor-qualification.js
│           ├── qrm.js
│           ├── product-recall.js
│           └── oos-oot.js
└── README.md              # This file
```

## 🎨 UI Features

- **Bootstrap 5** with custom CSS for theme consistency
- **Corporate blue & white theme** with modern gradients
- **Fully responsive** layout for desktop and tablet
- **Cards, modals, and step-progress indicators** for workflows
- **Bootstrap icons** for each module
- **Collapsible sidebar navigation** with module links
- **Top navbar** with user info and logout

## 📊 Reports & Logs

Each module includes:
- **Summary tables** (sortable, filterable)
- **Export to CSV** (client-side JavaScript)
- **Department-wise** and status-wise dashboards
- **Bootstrap progress bars** for visual status tracking

## 🔧 Technical Details

### Technologies Used
- **HTML5** - Structure
- **CSS3** - Styling (with Bootstrap 5)
- **JavaScript (ES6+)** - Functionality
- **Bootstrap 5.3.0** - UI framework
- **Bootstrap Icons 1.10.0** - Icons
- **localStorage** - Data persistence

### Data Storage
- All data is stored in browser's `localStorage`
- Data persists across browser sessions
- Each module has its own data storage key
- Audit trails are maintained for all actions

### Browser Compatibility
- Chrome (recommended)
- Firefox
- Edge
- Safari
- Opera

## 📝 Usage Instructions

### Creating a New Record
1. Navigate to the desired module from the dashboard or sidebar
2. Click "New [Module Name]" button
3. Fill in the required fields (marked with *)
4. Upload attachments if needed
5. Click "Submit" to create the record

### Viewing Records
1. Go to the module page
2. Use the search and filter options to find specific records
3. Click the eye icon to view details
4. View workflow status, comments, and attachments

### Approving/Rejecting Records
1. Open the record details
2. If you have permission, approve/reject buttons will be visible
3. Click the appropriate action button
4. Confirm the action in the prompt

### Generating Reports
1. Navigate to the "Reports" tab in any module
2. Set date range and filters
3. Click "Generate Report"
4. Export to CSV if needed

## 🔒 Security Features

- **Password Policy**: Enforced on login
- **Session Timeout**: 30 minutes of inactivity
- **Multiple Login Prevention**: One session per user
- **Account Lockout**: After 5 failed attempts
- **Role-Based Access**: Users only see authorized actions
- **Audit Trail**: All actions are logged with user and timestamp

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers (1920px and above)
- Laptops (1366px - 1920px)
- Tablets (768px - 1366px)
- Mobile devices (with some limitations)

## 🐛 Troubleshooting

### Data Not Persisting
- Ensure cookies and localStorage are enabled in your browser
- Check browser console for any errors

### Login Issues
- Verify you're using the correct username and password
- Check if account is locked (too many failed attempts)
- Clear browser cache and try again

### Module Not Loading
- Check browser console for JavaScript errors
- Ensure all files are in the correct directory structure
- Verify Bootstrap and Bootstrap Icons are loading correctly

## 🔄 Future Enhancements

Potential improvements for production use:
- Backend integration with database
- Real file upload to server
- Email notifications
- Advanced reporting with charts
- Mobile app version
- Multi-language support
- Advanced search and filtering
- Export to PDF with proper formatting

## 📄 License

This is a prototype application for demonstration purposes.

## 👨‍💻 Support

For issues or questions:
1. Check the browser console for errors
2. Verify all files are present
3. Ensure you're using a modern browser
4. Clear browser cache and localStorage if needed

## 🎯 Key Features Summary

✅ **10 Complete Modules** - All QMS modules fully functional  
✅ **Role-Based Access Control** - 11 different user roles  
✅ **Workflow Management** - Complete approval workflows  
✅ **File Attachments** - Upload and manage documents  
✅ **Comments & Audit Trail** - Full history tracking  
✅ **Reports & Export** - CSV export functionality  
✅ **Responsive Design** - Works on all devices  
✅ **Modern UI** - Professional Bootstrap 5 design  
✅ **Data Persistence** - localStorage for data storage  
✅ **Security Features** - Password policy, session management  

---

**Note**: This is a prototype application. For production use, consider implementing a backend server, database, and enhanced security measures.

