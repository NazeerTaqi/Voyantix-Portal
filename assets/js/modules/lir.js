// Lab Incident Report Module
document.addEventListener('DOMContentLoaded', function() {
    loadLIRData();
    setupFilters();
});

function loadLIRData() {
    const data = JSON.parse(localStorage.getItem('lir_data') || '[]');
    const tbody = document.getElementById('lirTableBody');
    if (!tbody) return;
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No records found</td></tr>';
        return;
    }
    tbody.innerHTML = data.map((lir, index) => `
        <tr>
            <td><strong>${lir.lirNumber}</strong></td>
            <td>${lir.batchNumber}</td>
            <td>${lir.description.substring(0, 50)}...</td>
            <td><span class="badge bg-${getStatusColor(lir.status)}">${lir.status}</span></td>
            <td>${lir.initiator}</td>
            <td>${Utils.formatDate(lir.createdDate)}</td>
            <td><button class="btn btn-sm btn-primary" onclick="viewLIR(${index})"><i class="bi bi-eye"></i></button></td>
        </tr>
    `).join('');
}

function getStatusColor(status) {
    const colors = { 'Open': 'primary', 'Under Investigation': 'warning', 'Closed': 'success', 'Overdue': 'danger' };
    return colors[status] || 'secondary';
}

function submitLIR() {
    const form = document.getElementById('lirForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    
    const lirData = {
        lirNumber: Utils.generateNumber('LIR'),
        batchNumber: document.getElementById('lirBatch').value,
        productName: document.getElementById('lirProduct').value,
        description: document.getElementById('lirDescription').value,
        rootCause: document.getElementById('lirRootCause').value,
        immediateAction: document.getElementById('lirImmediateAction').value,
        status: 'Open',
        targetCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        extensionRequested: false,
        workflow: {
            currentStep: 'QC Initiator',
            steps: [
                { step: 'QC Initiator', status: 'Completed', user: authManager.getCurrentUser().name, date: new Date().toISOString() },
                { step: 'Section Incharge', status: 'Pending', user: '', date: null },
                { step: 'Head QC', status: 'Pending', user: '', date: null },
                { step: 'Analytical QA Incharge', status: 'Pending', user: '', date: null },
                { step: 'Head QA', status: 'Pending', user: '', date: null }
            ]
        },
        initiator: authManager.getCurrentUser().name,
        initiatorRole: authManager.getCurrentUser().role,
        createdDate: new Date().toISOString(),
        comments: [],
        auditTrail: [{ action: 'Created', user: authManager.getCurrentUser().name, role: authManager.getCurrentUser().role, date: new Date().toISOString() }]
    };
    
    const allData = JSON.parse(localStorage.getItem('lir_data') || '[]');
    allData.push(lirData);
    localStorage.setItem('lir_data', JSON.stringify(allData));
    
    form.reset();
    const modal = bootstrap.Modal.getInstance(document.getElementById('newLIRModal'));
    modal.hide();
    Utils.showNotification('LIR created successfully', 'success');
    loadLIRData();
}

function viewLIR(index) {
    const data = JSON.parse(localStorage.getItem('lir_data') || '[]');
    const lir = data[index];
    if (!lir) return;
    
    const content = `
        <div class="row mb-3"><div class="col-md-12"><h6>LIR Number: <strong>${lir.lirNumber}</strong></h6><p class="mb-0">Status: <span class="badge bg-${getStatusColor(lir.status)}">${lir.status}</span></p></div></div>
        <div class="row"><div class="col-md-6 mb-3"><label class="form-label"><strong>Batch Number</strong></label><p>${lir.batchNumber}</p></div><div class="col-md-6 mb-3"><label class="form-label"><strong>Product Name</strong></label><p>${lir.productName}</p></div></div>
        <div class="mb-3"><label class="form-label"><strong>Description</strong></label><p>${lir.description}</p></div>
        ${lir.rootCause ? `<div class="mb-3"><label class="form-label"><strong>Root Cause</strong></label><p>${lir.rootCause}</p></div>` : ''}
        <div class="mb-3"><label class="form-label"><strong>Immediate Action</strong></label><p>${lir.immediateAction}</p></div>
        <div class="mb-3"><label class="form-label"><strong>Target Close Date</strong></label><p>${Utils.formatDate(lir.targetCloseDate)}</p></div>
        <div class="mb-3"><label class="form-label"><strong>Workflow</strong></label><div class="workflow-steps">${lir.workflow.steps.map((step, i) => `<div class="workflow-step ${step.status === 'Completed' ? 'completed' : step.status === 'Pending' && i === lir.workflow.steps.findIndex(s => s.status === 'Pending') ? 'active' : ''}"><div class="step-circle">${step.status === 'Completed' ? '<i class="bi bi-check"></i>' : i + 1}</div><div class="step-label">${step.step}</div>${step.user ? `<small>${step.user}</small>` : ''}</div>`).join('')}</div></div>
        ${canApproveLIR(lir) ? `<div class="mt-3"><button class="btn btn-success me-2" onclick="approveLIR(${index})"><i class="bi bi-check-circle me-2"></i>Approve</button><button class="btn btn-warning me-2" onclick="requestExtension(${index})"><i class="bi bi-clock-history me-2"></i>Request Extension</button></div>` : ''}
        <div class="mt-4"><h6>Comments</h6><div id="lirComments">${lir.comments.length > 0 ? lir.comments.map(c => `<div class="comment-item mb-2"><strong>${c.user}</strong> (${c.date})<br>${c.comment}</div>`).join('') : '<p>No comments yet</p>'}</div><div class="mt-3"><textarea class="form-control" id="newComment" rows="2" placeholder="Add a comment..."></textarea><button class="btn btn-primary mt-2" onclick="addLIRComment(${index})">Add Comment</button></div></div>
    `;
    
    document.getElementById('viewLIRContent').innerHTML = content;
    new bootstrap.Modal(document.getElementById('viewLIRModal')).show();
}

function canApproveLIR(lir) {
    const user = authManager.getCurrentUser();
    if (!user) return false;
    const currentStep = lir.workflow.steps.find(s => s.status === 'Pending');
    if (!currentStep) return false;
    const roleMap = { 'Section Incharge': ['Head QC'], 'Head QC': ['Head QC'], 'Analytical QA Incharge': ['Analytical QA Incharge'], 'Head QA': ['Head QA'] };
    return roleMap[currentStep.step]?.includes(user.role);
}

function approveLIR(index) {
    if (!Utils.confirmAction('Are you sure you want to approve this LIR?')) return;
    const data = JSON.parse(localStorage.getItem('lir_data') || '[]');
    const lir = data[index];
    const currentStepIndex = lir.workflow.steps.findIndex(s => s.status === 'Pending');
    if (currentStepIndex !== -1) {
        lir.workflow.steps[currentStepIndex].status = 'Completed';
        lir.workflow.steps[currentStepIndex].user = authManager.getCurrentUser().name;
        lir.workflow.steps[currentStepIndex].date = new Date().toISOString();
        if (currentStepIndex < lir.workflow.steps.length - 1) {
            lir.workflow.steps[currentStepIndex + 1].status = 'Pending';
            lir.status = 'Under Investigation';
        } else { lir.status = 'Closed'; }
    }
    lir.auditTrail.push({ action: 'Approved', user: authManager.getCurrentUser().name, role: authManager.getCurrentUser().role, date: new Date().toISOString() });
    localStorage.setItem('lir_data', JSON.stringify(data));
    Utils.showNotification('LIR approved successfully', 'success');
    bootstrap.Modal.getInstance(document.getElementById('viewLIRModal')).hide();
    loadLIRData();
}

function requestExtension(index) {
    const reason = prompt('Enter reason for extension:');
    if (!reason) return;
    const data = JSON.parse(localStorage.getItem('lir_data') || '[]');
    const lir = data[index];
    lir.extensionRequested = true;
    lir.extensionReason = reason;
    lir.targetCloseDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem('lir_data', JSON.stringify(data));
    Utils.showNotification('Extension requested', 'info');
    viewLIR(index);
}

function addLIRComment(index) {
    const comment = document.getElementById('newComment').value.trim();
    if (!comment) return;
    const data = JSON.parse(localStorage.getItem('lir_data') || '[]');
    const lir = data[index];
    lir.comments.push({ user: authManager.getCurrentUser().name, role: authManager.getCurrentUser().role, comment: comment, date: Utils.formatDate(new Date()) });
    localStorage.setItem('lir_data', JSON.stringify(data));
    document.getElementById('newComment').value = '';
    viewLIR(index);
}

function setupFilters() {
    const searchInput = document.getElementById('searchLIR');
    const statusFilter = document.getElementById('statusFilter');
    if (searchInput) searchInput.addEventListener('input', filterLIRTable);
    if (statusFilter) statusFilter.addEventListener('change', filterLIRTable);
}

function filterLIRTable() {
    const searchTerm = document.getElementById('searchLIR').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const data = JSON.parse(localStorage.getItem('lir_data') || '[]');
    const filtered = data.filter(lir => {
        const matchesSearch = !searchTerm || lir.lirNumber.toLowerCase().includes(searchTerm) || lir.description.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || lir.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    const tbody = document.getElementById('lirTableBody');
    if (filtered.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="text-center">No records found</td></tr>'; return; }
    tbody.innerHTML = filtered.map((lir, index) => {
        const originalIndex = data.indexOf(lir);
        return `<tr><td><strong>${lir.lirNumber}</strong></td><td>${lir.batchNumber}</td><td>${lir.description.substring(0, 50)}...</td><td><span class="badge bg-${getStatusColor(lir.status)}">${lir.status}</span></td><td>${lir.initiator}</td><td>${Utils.formatDate(lir.createdDate)}</td><td><button class="btn btn-sm btn-primary" onclick="viewLIR(${originalIndex})"><i class="bi bi-eye"></i></button></td></tr>`;
    }).join('');
}

function generateLIRReport() {
    const fromDate = document.getElementById('reportFromDate').value;
    const toDate = document.getElementById('reportToDate').value;
    const department = document.getElementById('reportDepartment').value;
    let data = JSON.parse(localStorage.getItem('lir_data') || '[]');
    if (fromDate) data = data.filter(lir => new Date(lir.createdDate) >= new Date(fromDate));
    if (toDate) data = data.filter(lir => new Date(lir.createdDate) <= new Date(toDate));
    const reportContent = `<div class="table-responsive"><table class="table table-bordered"><thead><tr><th>LIR Number</th><th>Batch</th><th>Product</th><th>Status</th><th>Created Date</th></tr></thead><tbody>${data.map(lir => `<tr><td>${lir.lirNumber}</td><td>${lir.batchNumber}</td><td>${lir.productName}</td><td>${lir.status}</td><td>${Utils.formatDate(lir.createdDate)}</td></tr>`).join('')}</tbody></table></div><div class="mt-3"><button class="btn btn-primary" onclick="Utils.exportToCSV(${JSON.stringify(data.map(lir => ({ 'LIR Number': lir.lirNumber, 'Batch': lir.batchNumber, 'Product': lir.productName, 'Status': lir.status, 'Created Date': Utils.formatDate(lir.createdDate) })))}, 'lir-report.csv')"><i class="bi bi-file-earmark-spreadsheet me-2"></i>Export to CSV</button></div>`;
    document.getElementById('reportContent').innerHTML = reportContent;
}

