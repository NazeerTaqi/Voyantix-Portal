// Change Control Module
let ccFiles = [];

document.addEventListener('DOMContentLoaded', function() {
    loadCCData();
    setupFileUpload();
    setupFilters();
});

function loadCCData() {
    const data = JSON.parse(localStorage.getItem('change-control_data') || '[]');
    const tbody = document.getElementById('ccTableBody');
    
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No records found</td></tr>';
        return;
    }

    tbody.innerHTML = data.map((cc, index) => `
        <tr>
            <td><strong>${cc.ccNumber}</strong></td>
            <td>${cc.title}</td>
            <td><span class="badge bg-info">${cc.type}</span></td>
            <td><span class="badge bg-${getStatusColor(cc.status)}">${cc.status}</span></td>
            <td>${cc.initiator}</td>
            <td>${Utils.formatDate(cc.createdDate)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewCC(${index})">
                    <i class="bi bi-eye"></i>
                </button>
                ${canEdit(cc) ? `<button class="btn btn-sm btn-warning" onclick="editCC(${index})"><i class="bi bi-pencil"></i></button>` : ''}
            </td>
        </tr>
    `).join('');
}

function getStatusColor(status) {
    const colors = {
        'Open': 'primary',
        'Pending Approval': 'warning',
        'Approved': 'success',
        'Rejected': 'danger',
        'Closed': 'secondary'
    };
    return colors[status] || 'secondary';
}

function canEdit(cc) {
    const user = authManager.getCurrentUser();
    if (!user) return false;
    
    if (cc.status === 'Open' && cc.initiatorRole === user.role) return true;
    if (cc.status === 'Pending Approval' && authManager.hasAccess('change-control', 'approve')) return true;
    
    return false;
}

function setupFileUpload() {
    const fileUpload = document.getElementById('ccFileUpload');
    const fileInput = document.getElementById('ccFileInput');
    
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
        ccFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            file: file
        });
    });
    updateFilesList();
}

function updateFilesList() {
    const filesList = document.getElementById('ccFilesList');
    if (!filesList) return;
    
    if (ccFiles.length === 0) {
        filesList.innerHTML = '';
        return;
    }
    
    filesList.innerHTML = ccFiles.map((file, index) => `
        <div class="d-flex justify-content-between align-items-center p-2 bg-light rounded mb-2">
            <span><i class="bi bi-file-earmark me-2"></i>${file.name}</span>
            <button class="btn btn-sm btn-danger" onclick="removeFile(${index})">
                <i class="bi bi-x"></i>
            </button>
        </div>
    `).join('');
}

function removeFile(index) {
    ccFiles.splice(index, 1);
    updateFilesList();
}

function submitCC() {
    const form = document.getElementById('ccForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const ccData = {
        ccNumber: Utils.generateNumber('CC'),
        title: document.getElementById('ccTitle').value,
        type: document.getElementById('ccType').value,
        existingSystem: document.getElementById('existingSystem').value,
        proposedSystem: document.getElementById('proposedSystem').value,
        reason: document.getElementById('ccReason').value,
        attachments: ccFiles.map(f => f.name),
        status: 'Open',
        workflow: {
            currentStep: 'Initiator',
            steps: [
                { step: 'Initiator', status: 'Completed', user: authManager.getCurrentUser().name, date: new Date().toISOString() },
                { step: 'HOD', status: 'Pending', user: '', date: null },
                { step: 'QA Manager', status: 'Pending', user: '', date: null },
                { step: 'Head QA', status: 'Pending', user: '', date: null }
            ]
        },
        initiator: authManager.getCurrentUser().name,
        initiatorRole: authManager.getCurrentUser().role,
        createdDate: new Date().toISOString(),
        comments: [],
        auditTrail: [{
            action: 'Created',
            user: authManager.getCurrentUser().name,
            role: authManager.getCurrentUser().role,
            date: new Date().toISOString()
        }]
    };

    // Save to localStorage
    const allData = JSON.parse(localStorage.getItem('change-control_data') || '[]');
    allData.push(ccData);
    localStorage.setItem('change-control_data', JSON.stringify(allData));

    // Reset form
    form.reset();
    ccFiles = [];
    updateFilesList();

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('newCCModal'));
    modal.hide();

    Utils.showNotification('Change Control created successfully', 'success');
    loadCCData();
}

function viewCC(index) {
    const data = JSON.parse(localStorage.getItem('change-control_data') || '[]');
    const cc = data[index];
    
    if (!cc) return;

    const content = `
        <div class="row">
            <div class="col-md-12 mb-3">
                <h6>CC Number: <strong>${cc.ccNumber}</strong></h6>
                <p class="mb-0">Status: <span class="badge bg-${getStatusColor(cc.status)}">${cc.status}</span></p>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label"><strong>Title</strong></label>
                <p>${cc.title}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label"><strong>Type of Change</strong></label>
                <p><span class="badge bg-info">${cc.type}</span></p>
            </div>
        </div>
        
        <div class="mb-3">
            <label class="form-label"><strong>Existing System</strong></label>
            <p>${cc.existingSystem}</p>
        </div>
        
        <div class="mb-3">
            <label class="form-label"><strong>Proposed System</strong></label>
            <p>${cc.proposedSystem}</p>
        </div>
        
        <div class="mb-3">
            <label class="form-label"><strong>Reason</strong></label>
            <p>${cc.reason}</p>
        </div>
        
        <div class="mb-3">
            <label class="form-label"><strong>Workflow</strong></label>
            <div class="workflow-steps">
                ${cc.workflow.steps.map((step, i) => `
                    <div class="workflow-step ${step.status === 'Completed' ? 'completed' : step.status === 'Pending' && i === cc.workflow.steps.findIndex(s => s.status === 'Pending') ? 'active' : ''}">
                        <div class="step-circle">
                            ${step.status === 'Completed' ? '<i class="bi bi-check"></i>' : i + 1}
                        </div>
                        <div class="step-label">${step.step}</div>
                        ${step.user ? `<small>${step.user}</small>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        
        ${cc.attachments.length > 0 ? `
            <div class="mb-3">
                <label class="form-label"><strong>Attachments</strong></label>
                <ul>
                    ${cc.attachments.map(file => `<li>${file}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
        
        ${canApprove(cc) ? `
            <div class="mt-3">
                <button class="btn btn-success me-2" onclick="approveCC(${index})">
                    <i class="bi bi-check-circle me-2"></i>Approve
                </button>
                <button class="btn btn-danger me-2" onclick="rejectCC(${index})">
                    <i class="bi bi-x-circle me-2"></i>Reject
                </button>
                ${authManager.hasAccess('change-control', 'final_approve') ? `
                    <button class="btn btn-secondary" onclick="closeCC(${index})">
                        <i class="bi bi-check-all me-2"></i>Close
                    </button>
                ` : ''}
            </div>
        ` : ''}
        
        <div class="mt-4">
            <h6>Comments</h6>
            <div id="ccComments">
                ${cc.comments.length > 0 ? cc.comments.map(c => `
                    <div class="comment-item mb-2">
                        <strong>${c.user}</strong> (${c.date})<br>
                        ${c.comment}
                    </div>
                `).join('') : '<p>No comments yet</p>'}
            </div>
            <div class="mt-3">
                <textarea class="form-control" id="newComment" rows="2" placeholder="Add a comment..."></textarea>
                <button class="btn btn-primary mt-2" onclick="addComment(${index})">Add Comment</button>
            </div>
        </div>
    `;

    document.getElementById('viewCCContent').innerHTML = content;
    const modal = new bootstrap.Modal(document.getElementById('viewCCModal'));
    modal.show();
}

function canApprove(cc) {
    const user = authManager.getCurrentUser();
    if (!user) return false;
    
    const currentStep = cc.workflow.steps.find(s => s.status === 'Pending');
    if (!currentStep) return false;
    
    const roleMap = {
        'HOD': ['HOD'],
        'QA Manager': ['QA Manager'],
        'Head QA': ['Head QA']
    };
    
    return roleMap[currentStep.step]?.includes(user.role);
}

function approveCC(index) {
    if (!Utils.confirmAction('Are you sure you want to approve this Change Control?')) return;
    
    const data = JSON.parse(localStorage.getItem('change-control_data') || '[]');
    const cc = data[index];
    
    const currentStepIndex = cc.workflow.steps.findIndex(s => s.status === 'Pending');
    if (currentStepIndex !== -1) {
        cc.workflow.steps[currentStepIndex].status = 'Completed';
        cc.workflow.steps[currentStepIndex].user = authManager.getCurrentUser().name;
        cc.workflow.steps[currentStepIndex].date = new Date().toISOString();
        
        if (currentStepIndex < cc.workflow.steps.length - 1) {
            cc.workflow.steps[currentStepIndex + 1].status = 'Pending';
            cc.status = 'Pending Approval';
        } else {
            cc.status = 'Approved';
        }
    }
    
    cc.auditTrail.push({
        action: 'Approved',
        user: authManager.getCurrentUser().name,
        role: authManager.getCurrentUser().role,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('change-control_data', JSON.stringify(data));
    Utils.showNotification('Change Control approved successfully', 'success');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('viewCCModal'));
    modal.hide();
    loadCCData();
}

function rejectCC(index) {
    if (!Utils.confirmAction('Are you sure you want to reject this Change Control?')) return;
    
    const data = JSON.parse(localStorage.getItem('change-control_data') || '[]');
    const cc = data[index];
    
    cc.status = 'Rejected';
    cc.auditTrail.push({
        action: 'Rejected',
        user: authManager.getCurrentUser().name,
        role: authManager.getCurrentUser().role,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('change-control_data', JSON.stringify(data));
    Utils.showNotification('Change Control rejected', 'info');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('viewCCModal'));
    modal.hide();
    loadCCData();
}

function closeCC(index) {
    if (!Utils.confirmAction('Are you sure you want to close this Change Control?')) return;
    
    const data = JSON.parse(localStorage.getItem('change-control_data') || '[]');
    const cc = data[index];
    
    cc.status = 'Closed';
    cc.auditTrail.push({
        action: 'Closed',
        user: authManager.getCurrentUser().name,
        role: authManager.getCurrentUser().role,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('change-control_data', JSON.stringify(data));
    Utils.showNotification('Change Control closed successfully', 'success');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('viewCCModal'));
    modal.hide();
    loadCCData();
}

function addComment(index) {
    const comment = document.getElementById('newComment').value.trim();
    if (!comment) return;
    
    const data = JSON.parse(localStorage.getItem('change-control_data') || '[]');
    const cc = data[index];
    
    cc.comments.push({
        user: authManager.getCurrentUser().name,
        role: authManager.getCurrentUser().role,
        comment: comment,
        date: Utils.formatDate(new Date())
    });
    
    localStorage.setItem('change-control_data', JSON.stringify(data));
    document.getElementById('newComment').value = '';
    viewCC(index);
}

function setupFilters() {
    const searchInput = document.getElementById('searchCC');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterTable);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterTable);
    }
}

function filterTable() {
    const searchTerm = document.getElementById('searchCC').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const data = JSON.parse(localStorage.getItem('change-control_data') || '[]');
    
    const filtered = data.filter(cc => {
        const matchesSearch = !searchTerm || 
            cc.ccNumber.toLowerCase().includes(searchTerm) ||
            cc.title.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || cc.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    
    const tbody = document.getElementById('ccTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No records found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map((cc, index) => {
        const originalIndex = data.indexOf(cc);
        return `
            <tr>
                <td><strong>${cc.ccNumber}</strong></td>
                <td>${cc.title}</td>
                <td><span class="badge bg-info">${cc.type}</span></td>
                <td><span class="badge bg-${getStatusColor(cc.status)}">${cc.status}</span></td>
                <td>${cc.initiator}</td>
                <td>${Utils.formatDate(cc.createdDate)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewCC(${originalIndex})">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function generateReport() {
    const fromDate = document.getElementById('reportFromDate').value;
    const toDate = document.getElementById('reportToDate').value;
    const status = document.getElementById('reportStatus').value;
    
    let data = JSON.parse(localStorage.getItem('change-control_data') || '[]');
    
    // Filter data
    if (fromDate) {
        data = data.filter(cc => new Date(cc.createdDate) >= new Date(fromDate));
    }
    if (toDate) {
        data = data.filter(cc => new Date(cc.createdDate) <= new Date(toDate));
    }
    if (status) {
        data = data.filter(cc => cc.status === status);
    }
    
    const reportContent = `
        <div class="table-responsive">
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>CC Number</th>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Initiator</th>
                        <th>Created Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(cc => `
                        <tr>
                            <td>${cc.ccNumber}</td>
                            <td>${cc.title}</td>
                            <td>${cc.type}</td>
                            <td>${cc.status}</td>
                            <td>${cc.initiator}</td>
                            <td>${Utils.formatDate(cc.createdDate)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="mt-3">
            <button class="btn btn-primary" onclick="Utils.exportToCSV(${JSON.stringify(data.map(cc => ({
                'CC Number': cc.ccNumber,
                'Title': cc.title,
                'Type': cc.type,
                'Status': cc.status,
                'Initiator': cc.initiator,
                'Created Date': Utils.formatDate(cc.createdDate)
            })))}, 'change-control-report.csv')">
                <i class="bi bi-file-earmark-spreadsheet me-2"></i>Export to CSV
            </button>
        </div>
    `;
    
    document.getElementById('reportContent').innerHTML = reportContent;
}

