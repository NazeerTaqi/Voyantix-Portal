// Product Recall Module
let recallFiles = [];

document.addEventListener('DOMContentLoaded', function() {
    loadRecallData();
    setupFileUpload();
    setupFilters();
});

function loadRecallData() {
    const data = JSON.parse(localStorage.getItem('product-recall_data') || '[]');
    const tbody = document.getElementById('recallTableBody');
    
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No records found</td></tr>';
        return;
    }

    tbody.innerHTML = data.map((recall, index) => `
        <tr>
            <td><strong>${recall.recallNumber}</strong></td>
            <td><span class="badge bg-${getTypeColor(recall.recallType)}">${recall.recallType}</span></td>
            <td>${recall.productName}</td>
            <td>${recall.batchNumber}</td>
            <td><span class="badge bg-${getStatusColor(recall.status)}">${recall.status}</span></td>
            <td>${recall.initiatedBy}</td>
            <td>${Utils.formatDate(recall.initiatedDate)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewRecall(${index})">
                    <i class="bi bi-eye"></i>
                </button>
                ${canEdit(recall) ? `<button class="btn btn-sm btn-warning" onclick="editRecall(${index})"><i class="bi bi-pencil"></i></button>` : ''}
            </td>
        </tr>
    `).join('');
}

function getTypeColor(type) {
    const colors = {
        'Class I': 'danger',
        'Class II': 'warning',
        'Class III': 'info'
    };
    return colors[type] || 'secondary';
}

function getStatusColor(status) {
    const colors = {
        'Open': 'primary',
        'PIRC Scheduled': 'info',
        'In Progress': 'warning',
        'Closed': 'success'
    };
    return colors[status] || 'secondary';
}

function canEdit(recall) {
    const user = authManager.getCurrentUser();
    if (!user) return false;
    
    if (recall.status === 'Open' && recall.initiatorRole === user.role) return true;
    if (['PIRC Scheduled', 'In Progress'].includes(recall.status) && authManager.hasAccess('product-recall', 'approve')) return true;
    
    return false;
}

function setupFileUpload() {
    const fileUpload = document.getElementById('recallFileUpload');
    const fileInput = document.getElementById('recallFileInput');
    
    if (fileUpload && fileInput) {
        fileUpload.addEventListener('click', () => fileInput.click());
        
        fileUpload.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUpload.classList.add('dragover');
        });
        
        fileUpload.addEventListener('dragleave', () => {
            fileUpload.classList.remove('dragover');
        });
        
        fileUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUpload.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });
        
        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });
    }
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        recallFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            file: file
        });
    });
    updateFilesList();
}

function updateFilesList() {
    const filesList = document.getElementById('recallFilesList');
    if (!filesList) return;
    
    if (recallFiles.length === 0) {
        filesList.innerHTML = '';
        return;
    }
    
    filesList.innerHTML = recallFiles.map((file, index) => `
        <div class="d-flex justify-content-between align-items-center p-2 bg-light rounded mb-2">
            <span><i class="bi bi-file-earmark me-2"></i>${file.name}</span>
            <button class="btn btn-sm btn-danger" onclick="removeRecallFile(${index})">
                <i class="bi bi-x"></i>
            </button>
        </div>
    `).join('');
}

function removeRecallFile(index) {
    recallFiles.splice(index, 1);
    updateFilesList();
}

function submitRecall() {
    const form = document.getElementById('recallForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const recallData = {
        recallNumber: Utils.generateNumber('PR'),
        recallType: document.getElementById('recallType').value,
        productName: document.getElementById('productName').value,
        batchNumber: document.getElementById('batchNumber').value,
        manufacturingDate: document.getElementById('manufacturingDate').value || null,
        expiryDate: document.getElementById('expiryDate').value || null,
        quantityRecalled: document.getElementById('quantityRecalled').value || 0,
        reason: document.getElementById('recallReason').value,
        distributionDetails: document.getElementById('distributionDetails').value,
        pircMeetingDate: document.getElementById('pircMeetingDate').value || null,
        attachments: recallFiles.map(f => f.name),
        status: 'Open',
        workflow: {
            currentStep: 'QA Manager',
            steps: [
                { step: 'QA Manager', status: 'Completed', user: authManager.getCurrentUser().name, date: new Date().toISOString() },
                { step: 'Head QA', status: 'Pending', user: '', date: null },
                { step: 'Site Quality Head', status: 'Pending', user: '', date: null }
            ]
        },
        initiatedBy: authManager.getCurrentUser().name,
        initiatorRole: authManager.getCurrentUser().role,
        initiatedDate: new Date().toISOString(),
        effectivenessCheck: {
            status: 'Pending',
            comments: '',
            date: null
        },
        closureChecklist: [],
        comments: [],
        auditTrail: [{
            action: 'Created',
            user: authManager.getCurrentUser().name,
            role: authManager.getCurrentUser().role,
            date: new Date().toISOString()
        }]
    };

    // Save to localStorage
    const allData = JSON.parse(localStorage.getItem('product-recall_data') || '[]');
    allData.push(recallData);
    localStorage.setItem('product-recall_data', JSON.stringify(allData));

    // Reset form
    form.reset();
    recallFiles = [];
    updateFilesList();

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('newRecallModal'));
    modal.hide();

    Utils.showNotification('Product Recall created successfully', 'success');
    loadRecallData();
}

function viewRecall(index) {
    const data = JSON.parse(localStorage.getItem('product-recall_data') || '[]');
    const recall = data[index];
    
    if (!recall) return;

    const content = `
        <div class="row">
            <div class="col-md-12 mb-3">
                <h6>Recall Number: <strong>${recall.recallNumber}</strong></h6>
                <p class="mb-0">Status: <span class="badge bg-${getStatusColor(recall.status)}">${recall.status}</span></p>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label"><strong>Recall Type</strong></label>
                <p><span class="badge bg-${getTypeColor(recall.recallType)}">${recall.recallType}</span></p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label"><strong>Product Name</strong></label>
                <p>${recall.productName}</p>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label"><strong>Batch Number</strong></label>
                <p>${recall.batchNumber}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label"><strong>Quantity Recalled</strong></label>
                <p>${recall.quantityRecalled || 'N/A'}</p>
            </div>
        </div>
        
        ${recall.manufacturingDate ? `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label"><strong>Manufacturing Date</strong></label>
                    <p>${Utils.formatDate(recall.manufacturingDate)}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label"><strong>Expiry Date</strong></label>
                    <p>${recall.expiryDate ? Utils.formatDate(recall.expiryDate) : 'N/A'}</p>
                </div>
            </div>
        ` : ''}
        
        <div class="mb-3">
            <label class="form-label"><strong>Reason for Recall</strong></label>
            <p>${recall.reason}</p>
        </div>
        
        ${recall.distributionDetails ? `
            <div class="mb-3">
                <label class="form-label"><strong>Distribution Details</strong></label>
                <p>${recall.distributionDetails}</p>
            </div>
        ` : ''}
        
        ${recall.pircMeetingDate ? `
            <div class="mb-3">
                <label class="form-label"><strong>PIRC Meeting Scheduled</strong></label>
                <p>${new Date(recall.pircMeetingDate).toLocaleString()}</p>
            </div>
        ` : ''}
        
        <div class="mb-3">
            <label class="form-label"><strong>Workflow</strong></label>
            <div class="workflow-steps">
                ${recall.workflow.steps.map((step, i) => `
                    <div class="workflow-step ${step.status === 'Completed' ? 'completed' : step.status === 'Pending' && i === recall.workflow.steps.findIndex(s => s.status === 'Pending') ? 'active' : ''}">
                        <div class="step-circle">
                            ${step.status === 'Completed' ? '<i class="bi bi-check"></i>' : i + 1}
                        </div>
                        <div class="step-label">${step.step}</div>
                        ${step.user ? `<small>${step.user}</small>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        
        ${recall.attachments.length > 0 ? `
            <div class="mb-3">
                <label class="form-label"><strong>Attachments</strong></label>
                <ul>
                    ${recall.attachments.map(file => `<li>${file}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
        
        ${canApprove(recall) ? `
            <div class="mt-3">
                <button class="btn btn-success me-2" onclick="approveRecall(${index})">
                    <i class="bi bi-check-circle me-2"></i>Approve
                </button>
                <button class="btn btn-info me-2" onclick="schedulePIRC(${index})">
                    <i class="bi bi-calendar-event me-2"></i>Schedule PIRC Meeting
                </button>
                ${authManager.hasAccess('product-recall', 'final_approve') ? `
                    <button class="btn btn-secondary" onclick="closeRecall(${index})">
                        <i class="bi bi-check-all me-2"></i>Close Recall
                    </button>
                ` : ''}
            </div>
        ` : ''}
        
        <div class="mt-4">
            <h6>Comments</h6>
            <div id="recallComments">
                ${recall.comments.length > 0 ? recall.comments.map(c => `
                    <div class="comment-item mb-2">
                        <strong>${c.user}</strong> (${c.date})<br>
                        ${c.comment}
                    </div>
                `).join('') : '<p>No comments yet</p>'}
            </div>
            <div class="mt-3">
                <textarea class="form-control" id="newRecallComment" rows="2" placeholder="Add a comment..."></textarea>
                <button class="btn btn-primary mt-2" onclick="addRecallComment(${index})">Add Comment</button>
            </div>
        </div>
    `;

    document.getElementById('viewRecallContent').innerHTML = content;
    const modal = new bootstrap.Modal(document.getElementById('viewRecallModal'));
    modal.show();
}

function canApprove(recall) {
    const user = authManager.getCurrentUser();
    if (!user) return false;
    
    const currentStep = recall.workflow.steps.find(s => s.status === 'Pending');
    if (!currentStep) return false;
    
    const roleMap = {
        'Head QA': ['Head QA'],
        'Site Quality Head': ['Site Quality Head']
    };
    
    return roleMap[currentStep.step]?.includes(user.role);
}

function approveRecall(index) {
    if (!Utils.confirmAction('Are you sure you want to approve this Product Recall?')) return;
    
    const data = JSON.parse(localStorage.getItem('product-recall_data') || '[]');
    const recall = data[index];
    
    const currentStepIndex = recall.workflow.steps.findIndex(s => s.status === 'Pending');
    if (currentStepIndex !== -1) {
        recall.workflow.steps[currentStepIndex].status = 'Completed';
        recall.workflow.steps[currentStepIndex].user = authManager.getCurrentUser().name;
        recall.workflow.steps[currentStepIndex].date = new Date().toISOString();
        
        if (currentStepIndex < recall.workflow.steps.length - 1) {
            recall.workflow.steps[currentStepIndex + 1].status = 'Pending';
            recall.status = 'In Progress';
        } else {
            recall.status = 'Closed';
        }
    }
    
    recall.auditTrail.push({
        action: 'Approved',
        user: authManager.getCurrentUser().name,
        role: authManager.getCurrentUser().role,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('product-recall_data', JSON.stringify(data));
    Utils.showNotification('Product Recall approved successfully', 'success');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('viewRecallModal'));
    modal.hide();
    loadRecallData();
}

function schedulePIRC(index) {
    const meetingDate = prompt('Enter PIRC Meeting Date and Time (YYYY-MM-DDTHH:mm):');
    if (!meetingDate) return;
    
    const data = JSON.parse(localStorage.getItem('product-recall_data') || '[]');
    const recall = data[index];
    
    recall.pircMeetingDate = meetingDate;
    recall.status = 'PIRC Scheduled';
    recall.auditTrail.push({
        action: 'PIRC Meeting Scheduled',
        user: authManager.getCurrentUser().name,
        role: authManager.getCurrentUser().role,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('product-recall_data', JSON.stringify(data));
    Utils.showNotification('PIRC Meeting scheduled successfully', 'success');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('viewRecallModal'));
    modal.hide();
    loadRecallData();
}

function closeRecall(index) {
    if (!Utils.confirmAction('Are you sure you want to close this Product Recall?')) return;
    
    const data = JSON.parse(localStorage.getItem('product-recall_data') || '[]');
    const recall = data[index];
    
    recall.status = 'Closed';
    recall.auditTrail.push({
        action: 'Closed',
        user: authManager.getCurrentUser().name,
        role: authManager.getCurrentUser().role,
        date: new Date().toISOString()
    });
    
    // Auto-generate closure checklist
    recall.closureChecklist = [
        { item: 'All recalled products collected', status: 'Pending' },
        { item: 'Regulatory notification completed', status: 'Pending' },
        { item: 'Customer notification completed', status: 'Pending' },
        { item: 'Effectiveness check completed', status: 'Pending' },
        { item: 'Root cause analysis completed', status: 'Pending' }
    ];
    
    localStorage.setItem('product-recall_data', JSON.stringify(data));
    Utils.showNotification('Product Recall closed successfully', 'success');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('viewRecallModal'));
    modal.hide();
    loadRecallData();
}

function addRecallComment(index) {
    const comment = document.getElementById('newRecallComment').value.trim();
    if (!comment) return;
    
    const data = JSON.parse(localStorage.getItem('product-recall_data') || '[]');
    const recall = data[index];
    
    recall.comments.push({
        user: authManager.getCurrentUser().name,
        role: authManager.getCurrentUser().role,
        comment: comment,
        date: Utils.formatDate(new Date())
    });
    
    localStorage.setItem('product-recall_data', JSON.stringify(data));
    document.getElementById('newRecallComment').value = '';
    viewRecall(index);
}

function setupFilters() {
    const searchInput = document.getElementById('searchRecall');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterTable);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterTable);
    }
}

function filterTable() {
    const searchTerm = document.getElementById('searchRecall').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const data = JSON.parse(localStorage.getItem('product-recall_data') || '[]');
    
    const filtered = data.filter(recall => {
        const matchesSearch = !searchTerm || 
            recall.recallNumber.toLowerCase().includes(searchTerm) ||
            recall.productName.toLowerCase().includes(searchTerm) ||
            recall.batchNumber.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || recall.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    
    const tbody = document.getElementById('recallTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No records found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map((recall, index) => {
        const originalIndex = data.indexOf(recall);
        return `
            <tr>
                <td><strong>${recall.recallNumber}</strong></td>
                <td><span class="badge bg-${getTypeColor(recall.recallType)}">${recall.recallType}</span></td>
                <td>${recall.productName}</td>
                <td>${recall.batchNumber}</td>
                <td><span class="badge bg-${getStatusColor(recall.status)}">${recall.status}</span></td>
                <td>${recall.initiatedBy}</td>
                <td>${Utils.formatDate(recall.initiatedDate)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewRecall(${originalIndex})">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function generateRecallReport() {
    const fromDate = document.getElementById('reportFromDate').value;
    const toDate = document.getElementById('reportToDate').value;
    const recallType = document.getElementById('reportRecallType').value;
    
    let data = JSON.parse(localStorage.getItem('product-recall_data') || '[]');
    
    // Filter data
    if (fromDate) {
        data = data.filter(recall => new Date(recall.initiatedDate) >= new Date(fromDate));
    }
    if (toDate) {
        data = data.filter(recall => new Date(recall.initiatedDate) <= new Date(toDate));
    }
    if (recallType) {
        data = data.filter(recall => recall.recallType === recallType);
    }
    
    const reportContent = `
        <div class="table-responsive">
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Recall Number</th>
                        <th>Recall Type</th>
                        <th>Product Name</th>
                        <th>Batch Number</th>
                        <th>Quantity Recalled</th>
                        <th>Status</th>
                        <th>Initiated Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(recall => `
                        <tr>
                            <td>${recall.recallNumber}</td>
                            <td>${recall.recallType}</td>
                            <td>${recall.productName}</td>
                            <td>${recall.batchNumber}</td>
                            <td>${recall.quantityRecalled || 'N/A'}</td>
                            <td>${recall.status}</td>
                            <td>${Utils.formatDate(recall.initiatedDate)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="mt-3">
            <button class="btn btn-primary" onclick="Utils.exportToCSV(${JSON.stringify(data.map(recall => ({
                'Recall Number': recall.recallNumber,
                'Recall Type': recall.recallType,
                'Product Name': recall.productName,
                'Batch Number': recall.batchNumber,
                'Quantity Recalled': recall.quantityRecalled || 'N/A',
                'Status': recall.status,
                'Initiated Date': Utils.formatDate(recall.initiatedDate)
            })))}, 'product-recall-report.csv')">
                <i class="bi bi-file-earmark-spreadsheet me-2"></i>Export to CSV
            </button>
        </div>
    `;
    
    document.getElementById('reportContent').innerHTML = reportContent;
}

