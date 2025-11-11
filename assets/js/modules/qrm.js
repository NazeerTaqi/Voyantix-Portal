// Quality Risk Management Module
let qrmFiles = [];

document.addEventListener('DOMContentLoaded', function() {
    loadQRMData();
    setupFileUpload();
    setupFilters();
});

function loadQRMData() {
    const data = JSON.parse(localStorage.getItem('qrm_data') || '[]');
    const tbody = document.getElementById('qrmTableBody');
    
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No records found</td></tr>';
        return;
    }

    tbody.innerHTML = data.map((qrm, index) => {
        const riskScore = parseInt(qrm.severity) * parseInt(qrm.probability);
        const riskLevel = getRiskLevel(riskScore);
        return `
            <tr>
                <td><strong>${qrm.qrmNumber}</strong></td>
                <td>${qrm.title}</td>
                <td>${qrm.objective.substring(0, 50)}...</td>
                <td><span class="badge bg-${getRiskColor(riskLevel)}">${riskLevel}</span></td>
                <td><span class="badge bg-${getStatusColor(qrm.status)}">${qrm.status}</span></td>
                <td>${qrm.initiator}</td>
                <td>${Utils.formatDate(qrm.createdDate)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewQRM(${index})">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${canEdit(qrm) ? `<button class="btn btn-sm btn-warning" onclick="editQRM(${index})"><i class="bi bi-pencil"></i></button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function getRiskLevel(score) {
    if (score <= 5) return 'Low';
    if (score <= 12) return 'Medium';
    if (score <= 20) return 'High';
    return 'Critical';
}

function getRiskColor(level) {
    const colors = {
        'Low': 'success',
        'Medium': 'warning',
        'High': 'danger',
        'Critical': 'dark'
    };
    return colors[level] || 'secondary';
}

function getStatusColor(status) {
    const colors = {
        'Open': 'primary',
        'Pending Approval': 'warning',
        'Approved': 'success',
        'Closed': 'secondary'
    };
    return colors[status] || 'secondary';
}

function canEdit(qrm) {
    const user = authManager.getCurrentUser();
    if (!user) return false;
    
    if (qrm.status === 'Open' && qrm.initiatorRole === user.role) return true;
    if (qrm.status === 'Pending Approval' && authManager.hasAccess('qrm', 'approve')) return true;
    
    return false;
}

function setupFileUpload() {
    const fileUpload = document.getElementById('qrmFileUpload');
    const fileInput = document.getElementById('qrmFileInput');
    
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
        qrmFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            file: file
        });
    });
    updateFilesList();
}

function updateFilesList() {
    const filesList = document.getElementById('qrmFilesList');
    if (!filesList) return;
    
    if (qrmFiles.length === 0) {
        filesList.innerHTML = '';
        return;
    }
    
    filesList.innerHTML = qrmFiles.map((file, index) => `
        <div class="d-flex justify-content-between align-items-center p-2 bg-light rounded mb-2">
            <span><i class="bi bi-file-earmark me-2"></i>${file.name}</span>
            <button class="btn btn-sm btn-danger" onclick="removeQRMFile(${index})">
                <i class="bi bi-x"></i>
            </button>
        </div>
    `).join('');
}

function removeQRMFile(index) {
    qrmFiles.splice(index, 1);
    updateFilesList();
}

function submitQRM() {
    const form = document.getElementById('qrmForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const severity = parseInt(document.getElementById('qrmSeverity').value);
    const probability = parseInt(document.getElementById('qrmProbability').value);
    const riskScore = severity * probability;
    const riskLevel = getRiskLevel(riskScore);

    const qrmData = {
        qrmNumber: Utils.generateNumber('QRM'),
        title: document.getElementById('qrmTitle').value,
        objective: document.getElementById('qrmObjective').value,
        scope: document.getElementById('qrmScope').value,
        severity: severity,
        probability: probability,
        riskScore: riskScore,
        riskLevel: riskLevel,
        assessment: document.getElementById('qrmAssessment').value,
        mitigation: document.getElementById('qrmMitigation').value,
        attachments: qrmFiles.map(f => f.name),
        status: 'Open',
        workflow: {
            currentStep: 'Initiator',
            steps: [
                { step: 'Initiator', status: 'Completed', user: authManager.getCurrentUser().name, date: new Date().toISOString() },
                { step: 'Dept. HOD', status: 'Pending', user: '', date: null },
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
    const allData = JSON.parse(localStorage.getItem('qrm_data') || '[]');
    allData.push(qrmData);
    localStorage.setItem('qrm_data', JSON.stringify(allData));

    // Reset form
    form.reset();
    qrmFiles = [];
    updateFilesList();

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('newQRMModal'));
    modal.hide();

    Utils.showNotification('Quality Risk Management record created successfully', 'success');
    loadQRMData();
}

function viewQRM(index) {
    const data = JSON.parse(localStorage.getItem('qrm_data') || '[]');
    const qrm = data[index];
    
    if (!qrm) return;

    const content = `
        <div class="row">
            <div class="col-md-12 mb-3">
                <h6>QRM Number: <strong>${qrm.qrmNumber}</strong></h6>
                <p class="mb-0">Status: <span class="badge bg-${getStatusColor(qrm.status)}">${qrm.status}</span></p>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-12 mb-3">
                <label class="form-label"><strong>Title</strong></label>
                <p>${qrm.title}</p>
            </div>
        </div>
        
        <div class="mb-3">
            <label class="form-label"><strong>Objective</strong></label>
            <p>${qrm.objective}</p>
        </div>
        
        <div class="mb-3">
            <label class="form-label"><strong>Scope</strong></label>
            <p>${qrm.scope}</p>
        </div>
        
        <div class="row mb-3">
            <div class="col-md-6">
                <label class="form-label"><strong>Severity</strong></label>
                <p>${qrm.severity}/5</p>
            </div>
            <div class="col-md-6">
                <label class="form-label"><strong>Probability</strong></label>
                <p>${qrm.probability}/5</p>
            </div>
        </div>
        
        <div class="mb-3">
            <label class="form-label"><strong>Risk Score</strong></label>
            <p><span class="badge bg-${getRiskColor(qrm.riskLevel)} fs-6">${qrm.riskScore} - ${qrm.riskLevel} Risk</span></p>
        </div>
        
        <div class="mb-3">
            <label class="form-label"><strong>Risk Assessment Details</strong></label>
            <p>${qrm.assessment}</p>
        </div>
        
        ${qrm.mitigation ? `
            <div class="mb-3">
                <label class="form-label"><strong>Mitigation Plan</strong></label>
                <p>${qrm.mitigation}</p>
            </div>
        ` : ''}
        
        <div class="mb-3">
            <label class="form-label"><strong>Workflow</strong></label>
            <div class="workflow-steps">
                ${qrm.workflow.steps.map((step, i) => `
                    <div class="workflow-step ${step.status === 'Completed' ? 'completed' : step.status === 'Pending' && i === qrm.workflow.steps.findIndex(s => s.status === 'Pending') ? 'active' : ''}">
                        <div class="step-circle">
                            ${step.status === 'Completed' ? '<i class="bi bi-check"></i>' : i + 1}
                        </div>
                        <div class="step-label">${step.step}</div>
                        ${step.user ? `<small>${step.user}</small>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        
        ${qrm.attachments.length > 0 ? `
            <div class="mb-3">
                <label class="form-label"><strong>Attachments</strong></label>
                <ul>
                    ${qrm.attachments.map(file => `<li>${file}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
        
        ${canApprove(qrm) ? `
            <div class="mt-3">
                <button class="btn btn-success me-2" onclick="approveQRM(${index})">
                    <i class="bi bi-check-circle me-2"></i>Approve
                </button>
                <button class="btn btn-danger me-2" onclick="rejectQRM(${index})">
                    <i class="bi bi-x-circle me-2"></i>Reject
                </button>
                ${authManager.hasAccess('qrm', 'final_approve') ? `
                    <button class="btn btn-secondary" onclick="closeQRM(${index})">
                        <i class="bi bi-check-all me-2"></i>Close
                    </button>
                ` : ''}
            </div>
        ` : ''}
        
        <div class="mt-4">
            <h6>Comments</h6>
            <div id="qrmComments">
                ${qrm.comments.length > 0 ? qrm.comments.map(c => `
                    <div class="comment-item mb-2">
                        <strong>${c.user}</strong> (${c.date})<br>
                        ${c.comment}
                    </div>
                `).join('') : '<p>No comments yet</p>'}
            </div>
            <div class="mt-3">
                <textarea class="form-control" id="newQRMComment" rows="2" placeholder="Add a comment..."></textarea>
                <button class="btn btn-primary mt-2" onclick="addQRMComment(${index})">Add Comment</button>
            </div>
        </div>
    `;

    document.getElementById('viewQRMContent').innerHTML = content;
    const modal = new bootstrap.Modal(document.getElementById('viewQRMModal'));
    modal.show();
}

function canApprove(qrm) {
    const user = authManager.getCurrentUser();
    if (!user) return false;
    
    const currentStep = qrm.workflow.steps.find(s => s.status === 'Pending');
    if (!currentStep) return false;
    
    const roleMap = {
        'Dept. HOD': ['HOD'],
        'QA Manager': ['QA Manager'],
        'Head QA': ['Head QA']
    };
    
    return roleMap[currentStep.step]?.includes(user.role);
}

function approveQRM(index) {
    if (!Utils.confirmAction('Are you sure you want to approve this QRM?')) return;
    
    const data = JSON.parse(localStorage.getItem('qrm_data') || '[]');
    const qrm = data[index];
    
    const currentStepIndex = qrm.workflow.steps.findIndex(s => s.status === 'Pending');
    if (currentStepIndex !== -1) {
        qrm.workflow.steps[currentStepIndex].status = 'Completed';
        qrm.workflow.steps[currentStepIndex].user = authManager.getCurrentUser().name;
        qrm.workflow.steps[currentStepIndex].date = new Date().toISOString();
        
        if (currentStepIndex < qrm.workflow.steps.length - 1) {
            qrm.workflow.steps[currentStepIndex + 1].status = 'Pending';
            qrm.status = 'Pending Approval';
        } else {
            qrm.status = 'Approved';
        }
    }
    
    qrm.auditTrail.push({
        action: 'Approved',
        user: authManager.getCurrentUser().name,
        role: authManager.getCurrentUser().role,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('qrm_data', JSON.stringify(data));
    Utils.showNotification('QRM approved successfully', 'success');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('viewQRMModal'));
    modal.hide();
    loadQRMData();
}

function rejectQRM(index) {
    if (!Utils.confirmAction('Are you sure you want to reject this QRM?')) return;
    
    const data = JSON.parse(localStorage.getItem('qrm_data') || '[]');
    const qrm = data[index];
    
    qrm.status = 'Rejected';
    qrm.auditTrail.push({
        action: 'Rejected',
        user: authManager.getCurrentUser().name,
        role: authManager.getCurrentUser().role,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('qrm_data', JSON.stringify(data));
    Utils.showNotification('QRM rejected', 'info');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('viewQRMModal'));
    modal.hide();
    loadQRMData();
}

function closeQRM(index) {
    if (!Utils.confirmAction('Are you sure you want to close this QRM?')) return;
    
    const data = JSON.parse(localStorage.getItem('qrm_data') || '[]');
    const qrm = data[index];
    
    qrm.status = 'Closed';
    qrm.auditTrail.push({
        action: 'Closed',
        user: authManager.getCurrentUser().name,
        role: authManager.getCurrentUser().role,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('qrm_data', JSON.stringify(data));
    Utils.showNotification('QRM closed successfully', 'success');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('viewQRMModal'));
    modal.hide();
    loadQRMData();
}

function addQRMComment(index) {
    const comment = document.getElementById('newQRMComment').value.trim();
    if (!comment) return;
    
    const data = JSON.parse(localStorage.getItem('qrm_data') || '[]');
    const qrm = data[index];
    
    qrm.comments.push({
        user: authManager.getCurrentUser().name,
        role: authManager.getCurrentUser().role,
        comment: comment,
        date: Utils.formatDate(new Date())
    });
    
    localStorage.setItem('qrm_data', JSON.stringify(data));
    document.getElementById('newQRMComment').value = '';
    viewQRM(index);
}

function setupFilters() {
    const searchInput = document.getElementById('searchQRM');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterTable);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterTable);
    }
}

function filterTable() {
    const searchTerm = document.getElementById('searchQRM').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const data = JSON.parse(localStorage.getItem('qrm_data') || '[]');
    
    const filtered = data.filter(qrm => {
        const matchesSearch = !searchTerm || 
            qrm.qrmNumber.toLowerCase().includes(searchTerm) ||
            qrm.title.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || qrm.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    
    const tbody = document.getElementById('qrmTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No records found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map((qrm, index) => {
        const originalIndex = data.indexOf(qrm);
        const riskScore = parseInt(qrm.severity) * parseInt(qrm.probability);
        const riskLevel = getRiskLevel(riskScore);
        return `
            <tr>
                <td><strong>${qrm.qrmNumber}</strong></td>
                <td>${qrm.title}</td>
                <td>${qrm.objective.substring(0, 50)}...</td>
                <td><span class="badge bg-${getRiskColor(riskLevel)}">${riskLevel}</span></td>
                <td><span class="badge bg-${getStatusColor(qrm.status)}">${qrm.status}</span></td>
                <td>${qrm.initiator}</td>
                <td>${Utils.formatDate(qrm.createdDate)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewQRM(${originalIndex})">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function generateQRMReport() {
    const fromDate = document.getElementById('reportFromDate').value;
    const toDate = document.getElementById('reportToDate').value;
    const riskLevel = document.getElementById('reportRiskLevel').value;
    
    let data = JSON.parse(localStorage.getItem('qrm_data') || '[]');
    
    // Filter data
    if (fromDate) {
        data = data.filter(qrm => new Date(qrm.createdDate) >= new Date(fromDate));
    }
    if (toDate) {
        data = data.filter(qrm => new Date(qrm.createdDate) <= new Date(toDate));
    }
    if (riskLevel) {
        data = data.filter(qrm => qrm.riskLevel === riskLevel);
    }
    
    const reportContent = `
        <div class="table-responsive">
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>QRM Number</th>
                        <th>Title</th>
                        <th>Risk Score</th>
                        <th>Risk Level</th>
                        <th>Status</th>
                        <th>Initiator</th>
                        <th>Created Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(qrm => `
                        <tr>
                            <td>${qrm.qrmNumber}</td>
                            <td>${qrm.title}</td>
                            <td>${qrm.riskScore}</td>
                            <td>${qrm.riskLevel}</td>
                            <td>${qrm.status}</td>
                            <td>${qrm.initiator}</td>
                            <td>${Utils.formatDate(qrm.createdDate)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="mt-3">
            <button class="btn btn-primary" onclick="Utils.exportToCSV(${JSON.stringify(data.map(qrm => ({
                'QRM Number': qrm.qrmNumber,
                'Title': qrm.title,
                'Risk Score': qrm.riskScore,
                'Risk Level': qrm.riskLevel,
                'Status': qrm.status,
                'Initiator': qrm.initiator,
                'Created Date': Utils.formatDate(qrm.createdDate)
            })))}, 'qrm-report.csv')">
                <i class="bi bi-file-earmark-spreadsheet me-2"></i>Export to CSV
            </button>
        </div>
    `;
    
    document.getElementById('reportContent').innerHTML = reportContent;
}

