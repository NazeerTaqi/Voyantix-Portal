// Market Complaint Module
document.addEventListener('DOMContentLoaded', function() {
    loadComplaintData();
    setupFilters();
});

function loadComplaintData() {
    const data = JSON.parse(localStorage.getItem('market-complaint_data') || '[]');
    const tbody = document.getElementById('complaintTableBody');
    if (!tbody) return;
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No records found</td></tr>';
        return;
    }
    tbody.innerHTML = data.map((complaint, index) => `
        <tr>
            <td><strong>${complaint.complaintNumber}</strong></td>
            <td>${complaint.productName}</td>
            <td>${complaint.batchNumber}</td>
            <td><span class="badge bg-info">${complaint.complaintType}</span></td>
            <td><span class="badge bg-${getStatusColor(complaint.status)}">${complaint.status}</span></td>
            <td>${Utils.formatDate(complaint.createdDate)}</td>
            <td><button class="btn btn-sm btn-primary" onclick="viewComplaint(${index})"><i class="bi bi-eye"></i></button></td>
        </tr>
    `).join('');
}

function getStatusColor(status) {
    const colors = { 'Open': 'primary', 'Under Investigation': 'warning', 'Closed': 'success' };
    return colors[status] || 'secondary';
}

function submitComplaint() {
    const form = document.getElementById('complaintForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    
    const complaintData = {
        complaintNumber: Utils.generateNumber('MC'),
        productName: document.getElementById('complaintProduct').value,
        batchNumber: document.getElementById('complaintBatch').value,
        complaintType: document.getElementById('complaintType').value,
        description: document.getElementById('complaintDescription').value,
        customer: document.getElementById('complaintCustomer').value,
        status: 'Open',
        investigation: '',
        fieldAlertReport: false,
        investigationReport: false,
        capaTriggered: false,
        nextFollowUp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        workflow: {
            currentStep: 'QA Manager',
            steps: [
                { step: 'QA Manager', status: 'Completed', user: authManager.getCurrentUser().name, date: new Date().toISOString() },
                { step: 'HOD', status: 'Pending', user: '', date: null },
                { step: 'Head QA', status: 'Pending', user: '', date: null },
                { step: 'Plant Head', status: 'Pending', user: '', date: null }
            ]
        },
        initiator: authManager.getCurrentUser().name,
        initiatorRole: authManager.getCurrentUser().role,
        createdDate: new Date().toISOString(),
        comments: [],
        auditTrail: [{ action: 'Created', user: authManager.getCurrentUser().name, role: authManager.getCurrentUser().role, date: new Date().toISOString() }]
    };
    
    const allData = JSON.parse(localStorage.getItem('market-complaint_data') || '[]');
    allData.push(complaintData);
    localStorage.setItem('market-complaint_data', JSON.stringify(allData));
    
    form.reset();
    const modal = bootstrap.Modal.getInstance(document.getElementById('newComplaintModal'));
    modal.hide();
    Utils.showNotification('Market Complaint created successfully', 'success');
    loadComplaintData();
}

function viewComplaint(index) {
    const data = JSON.parse(localStorage.getItem('market-complaint_data') || '[]');
    const complaint = data[index];
    if (!complaint) return;
    
    const content = `
        <div class="row mb-3"><div class="col-md-12"><h6>Complaint Number: <strong>${complaint.complaintNumber}</strong></h6><p class="mb-0">Status: <span class="badge bg-${getStatusColor(complaint.status)}">${complaint.status}</span></p></div></div>
        <div class="row"><div class="col-md-6 mb-3"><label class="form-label"><strong>Product Name</strong></label><p>${complaint.productName}</p></div><div class="col-md-6 mb-3"><label class="form-label"><strong>Batch Number</strong></label><p>${complaint.batchNumber}</p></div></div>
        <div class="row"><div class="col-md-6 mb-3"><label class="form-label"><strong>Complaint Type</strong></label><p><span class="badge bg-info">${complaint.complaintType}</span></p></div><div class="col-md-6 mb-3"><label class="form-label"><strong>Customer</strong></label><p>${complaint.customer}</p></div></div>
        <div class="mb-3"><label class="form-label"><strong>Description</strong></label><p>${complaint.description}</p></div>
        ${complaint.investigation ? `<div class="mb-3"><label class="form-label"><strong>Investigation</strong></label><p>${complaint.investigation}</p></div>` : ''}
        <div class="mb-3"><label class="form-label"><strong>Workflow</strong></label><div class="workflow-steps">${complaint.workflow.steps.map((step, i) => `<div class="workflow-step ${step.status === 'Completed' ? 'completed' : step.status === 'Pending' && i === complaint.workflow.steps.findIndex(s => s.status === 'Pending') ? 'active' : ''}"><div class="step-circle">${step.status === 'Completed' ? '<i class="bi bi-check"></i>' : i + 1}</div><div class="step-label">${step.step}</div>${step.user ? `<small>${step.user}</small>` : ''}</div>`).join('')}</div></div>
        ${canApproveComplaint(complaint) ? `<div class="mt-3"><button class="btn btn-success me-2" onclick="approveComplaint(${index})"><i class="bi bi-check-circle me-2"></i>Approve</button><button class="btn btn-info me-2" onclick="triggerCAPA(${index})"><i class="bi bi-arrow-right-circle me-2"></i>Trigger CAPA</button></div>` : ''}
        <div class="mt-4"><h6>Comments</h6><div id="complaintComments">${complaint.comments.length > 0 ? complaint.comments.map(c => `<div class="comment-item mb-2"><strong>${c.user}</strong> (${c.date})<br>${c.comment}</div>`).join('') : '<p>No comments yet</p>'}</div><div class="mt-3"><textarea class="form-control" id="newComment" rows="2" placeholder="Add a comment..."></textarea><button class="btn btn-primary mt-2" onclick="addComplaintComment(${index})">Add Comment</button></div></div>
    `;
    
    document.getElementById('viewComplaintContent').innerHTML = content;
    new bootstrap.Modal(document.getElementById('viewComplaintModal')).show();
}

function canApproveComplaint(complaint) {
    const user = authManager.getCurrentUser();
    if (!user) return false;
    const currentStep = complaint.workflow.steps.find(s => s.status === 'Pending');
    if (!currentStep) return false;
    const roleMap = { 'HOD': ['HOD'], 'Head QA': ['Head QA'], 'Plant Head': ['Plant Head'] };
    return roleMap[currentStep.step]?.includes(user.role);
}

function approveComplaint(index) {
    if (!Utils.confirmAction('Are you sure you want to approve this Market Complaint?')) return;
    const data = JSON.parse(localStorage.getItem('market-complaint_data') || '[]');
    const complaint = data[index];
    const currentStepIndex = complaint.workflow.steps.findIndex(s => s.status === 'Pending');
    if (currentStepIndex !== -1) {
        complaint.workflow.steps[currentStepIndex].status = 'Completed';
        complaint.workflow.steps[currentStepIndex].user = authManager.getCurrentUser().name;
        complaint.workflow.steps[currentStepIndex].date = new Date().toISOString();
        if (currentStepIndex < complaint.workflow.steps.length - 1) {
            complaint.workflow.steps[currentStepIndex + 1].status = 'Pending';
        } else { complaint.status = 'Closed'; }
    }
    complaint.auditTrail.push({ action: 'Approved', user: authManager.getCurrentUser().name, role: authManager.getCurrentUser().role, date: new Date().toISOString() });
    localStorage.setItem('market-complaint_data', JSON.stringify(data));
    Utils.showNotification('Market Complaint approved successfully', 'success');
    bootstrap.Modal.getInstance(document.getElementById('viewComplaintModal')).hide();
    loadComplaintData();
}

function triggerCAPA(index) {
    if (!Utils.confirmAction('Do you want to trigger a CAPA for this complaint?')) return;
    const data = JSON.parse(localStorage.getItem('market-complaint_data') || '[]');
    const complaint = data[index];
    complaint.capaTriggered = true;
    localStorage.setItem('market-complaint_data', JSON.stringify(data));
    Utils.showNotification('CAPA triggered. You can create a new CAPA from the CAPA module.', 'info');
    viewComplaint(index);
}

function addComplaintComment(index) {
    const comment = document.getElementById('newComment').value.trim();
    if (!comment) return;
    const data = JSON.parse(localStorage.getItem('market-complaint_data') || '[]');
    const complaint = data[index];
    complaint.comments.push({ user: authManager.getCurrentUser().name, role: authManager.getCurrentUser().role, comment: comment, date: Utils.formatDate(new Date()) });
    localStorage.setItem('market-complaint_data', JSON.stringify(data));
    document.getElementById('newComment').value = '';
    viewComplaint(index);
}

function setupFilters() {
    const searchInput = document.getElementById('searchComplaint');
    const statusFilter = document.getElementById('statusFilter');
    if (searchInput) searchInput.addEventListener('input', filterComplaintTable);
    if (statusFilter) statusFilter.addEventListener('change', filterComplaintTable);
}

function filterComplaintTable() {
    const searchTerm = document.getElementById('searchComplaint').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const data = JSON.parse(localStorage.getItem('market-complaint_data') || '[]');
    const filtered = data.filter(complaint => {
        const matchesSearch = !searchTerm || complaint.complaintNumber.toLowerCase().includes(searchTerm) || complaint.productName.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || complaint.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    const tbody = document.getElementById('complaintTableBody');
    if (filtered.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="text-center">No records found</td></tr>'; return; }
    tbody.innerHTML = filtered.map((complaint, index) => {
        const originalIndex = data.indexOf(complaint);
        return `<tr><td><strong>${complaint.complaintNumber}</strong></td><td>${complaint.productName}</td><td>${complaint.batchNumber}</td><td><span class="badge bg-info">${complaint.complaintType}</span></td><td><span class="badge bg-${getStatusColor(complaint.status)}">${complaint.status}</span></td><td>${Utils.formatDate(complaint.createdDate)}</td><td><button class="btn btn-sm btn-primary" onclick="viewComplaint(${originalIndex})"><i class="bi bi-eye"></i></button></td></tr>`;
    }).join('');
}

function generateComplaintReport() {
    const fromDate = document.getElementById('reportFromDate').value;
    const toDate = document.getElementById('reportToDate').value;
    const type = document.getElementById('reportType').value;
    let data = JSON.parse(localStorage.getItem('market-complaint_data') || '[]');
    if (fromDate) data = data.filter(complaint => new Date(complaint.createdDate) >= new Date(fromDate));
    if (toDate) data = data.filter(complaint => new Date(complaint.createdDate) <= new Date(toDate));
    if (type) data = data.filter(complaint => complaint.complaintType === type);
    const reportContent = `<div class="table-responsive"><table class="table table-bordered"><thead><tr><th>Complaint Number</th><th>Product</th><th>Batch</th><th>Type</th><th>Status</th><th>Created Date</th></tr></thead><tbody>${data.map(complaint => `<tr><td>${complaint.complaintNumber}</td><td>${complaint.productName}</td><td>${complaint.batchNumber}</td><td>${complaint.complaintType}</td><td>${complaint.status}</td><td>${Utils.formatDate(complaint.createdDate)}</td></tr>`).join('')}</tbody></table></div><div class="mt-3"><button class="btn btn-primary" onclick="Utils.exportToCSV(${JSON.stringify(data.map(complaint => ({ 'Complaint Number': complaint.complaintNumber, 'Product': complaint.productName, 'Batch': complaint.batchNumber, 'Type': complaint.complaintType, 'Status': complaint.status, 'Created Date': Utils.formatDate(complaint.createdDate) })))}, 'market-complaint-report.csv')"><i class="bi bi-file-earmark-spreadsheet me-2"></i>Export to CSV</button></div>`;
    document.getElementById('reportContent').innerHTML = reportContent;
}

