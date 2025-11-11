// Vendor Qualification Module
document.addEventListener('DOMContentLoaded', function() {
    loadVQData();
    setupFilters();
});

function loadVQData() {
    const data = JSON.parse(localStorage.getItem('vendor-qualification_data') || '[]');
    const tbody = document.getElementById('vqTableBody');
    if (!tbody) return;
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No records found</td></tr>';
        return;
    }
    tbody.innerHTML = data.map((vq, index) => `
        <tr>
            <td><strong>${vq.vqNumber}</strong></td>
            <td>${vq.vendorName}</td>
            <td><span class="badge bg-info">${vq.vendorType}</span></td>
            <td><span class="badge bg-${getStatusColor(vq.status)}">${vq.status}</span></td>
            <td>${vq.rating || 'N/A'}</td>
            <td>${Utils.formatDate(vq.createdDate)}</td>
            <td><button class="btn btn-sm btn-primary" onclick="viewVQ(${index})"><i class="bi bi-eye"></i></button></td>
        </tr>
    `).join('');
}

function getStatusColor(status) {
    const colors = { 'Under Evaluation': 'warning', 'Qualified': 'success', 'Rejected': 'danger' };
    return colors[status] || 'secondary';
}

function submitVQ() {
    const form = document.getElementById('vqForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    
    const vqData = {
        vqNumber: Utils.generateNumber('VQ'),
        vendorName: document.getElementById('vendorName').value,
        vendorType: document.getElementById('vendorType').value,
        address: document.getElementById('vendorAddress').value,
        contactPerson: document.getElementById('contactPerson').value,
        email: document.getElementById('vendorEmail').value,
        status: 'Under Evaluation',
        questionnaire: false,
        samples: false,
        documents: [],
        evaluation: '',
        rating: null,
        workflow: {
            currentStep: 'QA Manager',
            steps: [
                { step: 'QA Manager', status: 'Completed', user: authManager.getCurrentUser().name, date: new Date().toISOString() },
                { step: 'Purchase HOD', status: 'Pending', user: '', date: null },
                { step: 'Head QA', status: 'Pending', user: '', date: null }
            ]
        },
        createdBy: authManager.getCurrentUser().name,
        createdDate: new Date().toISOString(),
        auditTrail: [{ action: 'Created', user: authManager.getCurrentUser().name, role: authManager.getCurrentUser().role, date: new Date().toISOString() }]
    };
    
    const allData = JSON.parse(localStorage.getItem('vendor-qualification_data') || '[]');
    allData.push(vqData);
    localStorage.setItem('vendor-qualification_data', JSON.stringify(allData));
    
    form.reset();
    const modal = bootstrap.Modal.getInstance(document.getElementById('newVQModal'));
    modal.hide();
    Utils.showNotification('Vendor Qualification created successfully', 'success');
    loadVQData();
}

function viewVQ(index) {
    const data = JSON.parse(localStorage.getItem('vendor-qualification_data') || '[]');
    const vq = data[index];
    if (!vq) return;
    
    const content = `
        <div class="row mb-3"><div class="col-md-12"><h6>VQ Number: <strong>${vq.vqNumber}</strong></h6><p class="mb-0">Status: <span class="badge bg-${getStatusColor(vq.status)}">${vq.status}</span></p></div></div>
        <div class="row"><div class="col-md-6 mb-3"><label class="form-label"><strong>Vendor Name</strong></label><p>${vq.vendorName}</p></div><div class="col-md-6 mb-3"><label class="form-label"><strong>Vendor Type</strong></label><p><span class="badge bg-info">${vq.vendorType}</span></p></div></div>
        <div class="mb-3"><label class="form-label"><strong>Address</strong></label><p>${vq.address}</p></div>
        <div class="row"><div class="col-md-6 mb-3"><label class="form-label"><strong>Contact Person</strong></label><p>${vq.contactPerson || 'N/A'}</p></div><div class="col-md-6 mb-3"><label class="form-label"><strong>Email</strong></label><p>${vq.email || 'N/A'}</p></div></div>
        ${vq.rating ? `<div class="mb-3"><label class="form-label"><strong>Rating</strong></label><p>${vq.rating} / 5</p></div>` : ''}
        <div class="mb-3"><label class="form-label"><strong>Workflow</strong></label><div class="workflow-steps">${vq.workflow.steps.map((step, i) => `<div class="workflow-step ${step.status === 'Completed' ? 'completed' : step.status === 'Pending' && i === vq.workflow.steps.findIndex(s => s.status === 'Pending') ? 'active' : ''}"><div class="step-circle">${step.status === 'Completed' ? '<i class="bi bi-check"></i>' : i + 1}</div><div class="step-label">${step.step}</div>${step.user ? `<small>${step.user}</small>` : ''}</div>`).join('')}</div></div>
        ${canApproveVQ(vq) ? `<div class="mt-3"><button class="btn btn-success me-2" onclick="approveVQ(${index})"><i class="bi bi-check-circle me-2"></i>Approve</button><button class="btn btn-danger me-2" onclick="rejectVQ(${index})"><i class="bi bi-x-circle me-2"></i>Reject</button><button class="btn btn-info me-2" onclick="setRating(${index})"><i class="bi bi-star me-2"></i>Set Rating</button></div>` : ''}
    `;
    
    document.getElementById('viewVQContent').innerHTML = content;
    new bootstrap.Modal(document.getElementById('viewVQModal')).show();
}

function canApproveVQ(vq) {
    const user = authManager.getCurrentUser();
    if (!user) return false;
    const currentStep = vq.workflow.steps.find(s => s.status === 'Pending');
    if (!currentStep) return false;
    const roleMap = { 'Purchase HOD': ['Purchase HOD'], 'Head QA': ['Head QA'] };
    return roleMap[currentStep.step]?.includes(user.role);
}

function approveVQ(index) {
    if (!Utils.confirmAction('Are you sure you want to approve this vendor?')) return;
    const data = JSON.parse(localStorage.getItem('vendor-qualification_data') || '[]');
    const vq = data[index];
    const currentStepIndex = vq.workflow.steps.findIndex(s => s.status === 'Pending');
    if (currentStepIndex !== -1) {
        vq.workflow.steps[currentStepIndex].status = 'Completed';
        vq.workflow.steps[currentStepIndex].user = authManager.getCurrentUser().name;
        vq.workflow.steps[currentStepIndex].date = new Date().toISOString();
        if (currentStepIndex < vq.workflow.steps.length - 1) {
            vq.workflow.steps[currentStepIndex + 1].status = 'Pending';
        } else { vq.status = 'Qualified'; }
    }
    vq.auditTrail.push({ action: 'Approved', user: authManager.getCurrentUser().name, role: authManager.getCurrentUser().role, date: new Date().toISOString() });
    localStorage.setItem('vendor-qualification_data', JSON.stringify(data));
    Utils.showNotification('Vendor approved successfully', 'success');
    bootstrap.Modal.getInstance(document.getElementById('viewVQModal')).hide();
    loadVQData();
}

function rejectVQ(index) {
    if (!Utils.confirmAction('Are you sure you want to reject this vendor?')) return;
    const data = JSON.parse(localStorage.getItem('vendor-qualification_data') || '[]');
    const vq = data[index];
    vq.status = 'Rejected';
    vq.auditTrail.push({ action: 'Rejected', user: authManager.getCurrentUser().name, role: authManager.getCurrentUser().role, date: new Date().toISOString() });
    localStorage.setItem('vendor-qualification_data', JSON.stringify(data));
    Utils.showNotification('Vendor rejected', 'info');
    bootstrap.Modal.getInstance(document.getElementById('viewVQModal')).hide();
    loadVQData();
}

function setRating(index) {
    const rating = prompt('Enter rating (1-5):');
    if (!rating || rating < 1 || rating > 5) { Utils.showNotification('Invalid rating. Please enter a number between 1 and 5.', 'warning'); return; }
    const data = JSON.parse(localStorage.getItem('vendor-qualification_data') || '[]');
    const vq = data[index];
    vq.rating = rating;
    localStorage.setItem('vendor-qualification_data', JSON.stringify(data));
    Utils.showNotification('Rating set successfully', 'success');
    viewVQ(index);
}

function setupFilters() {
    const searchInput = document.getElementById('searchVQ');
    const statusFilter = document.getElementById('statusFilter');
    if (searchInput) searchInput.addEventListener('input', filterVQTable);
    if (statusFilter) statusFilter.addEventListener('change', filterVQTable);
}

function filterVQTable() {
    const searchTerm = document.getElementById('searchVQ').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const data = JSON.parse(localStorage.getItem('vendor-qualification_data') || '[]');
    const filtered = data.filter(vq => {
        const matchesSearch = !searchTerm || vq.vqNumber.toLowerCase().includes(searchTerm) || vq.vendorName.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || vq.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    const tbody = document.getElementById('vqTableBody');
    if (filtered.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="text-center">No records found</td></tr>'; return; }
    tbody.innerHTML = filtered.map((vq, index) => {
        const originalIndex = data.indexOf(vq);
        return `<tr><td><strong>${vq.vqNumber}</strong></td><td>${vq.vendorName}</td><td><span class="badge bg-info">${vq.vendorType}</span></td><td><span class="badge bg-${getStatusColor(vq.status)}">${vq.status}</span></td><td>${vq.rating || 'N/A'}</td><td>${Utils.formatDate(vq.createdDate)}</td><td><button class="btn btn-sm btn-primary" onclick="viewVQ(${originalIndex})"><i class="bi bi-eye"></i></button></td></tr>`;
    }).join('');
}

function generateVQReport() {
    const fromDate = document.getElementById('reportFromDate').value;
    const toDate = document.getElementById('reportToDate').value;
    const status = document.getElementById('reportStatus').value;
    let data = JSON.parse(localStorage.getItem('vendor-qualification_data') || '[]');
    if (fromDate) data = data.filter(vq => new Date(vq.createdDate) >= new Date(fromDate));
    if (toDate) data = data.filter(vq => new Date(vq.createdDate) <= new Date(toDate));
    if (status) data = data.filter(vq => vq.status === status);
    const reportContent = `<div class="table-responsive"><table class="table table-bordered"><thead><tr><th>VQ Number</th><th>Vendor Name</th><th>Type</th><th>Status</th><th>Rating</th><th>Created Date</th></tr></thead><tbody>${data.map(vq => `<tr><td>${vq.vqNumber}</td><td>${vq.vendorName}</td><td>${vq.vendorType}</td><td>${vq.status}</td><td>${vq.rating || 'N/A'}</td><td>${Utils.formatDate(vq.createdDate)}</td></tr>`).join('')}</tbody></table></div><div class="mt-3"><button class="btn btn-primary" onclick="Utils.exportToCSV(${JSON.stringify(data.map(vq => ({ 'VQ Number': vq.vqNumber, 'Vendor Name': vq.vendorName, 'Type': vq.vendorType, 'Status': vq.status, 'Rating': vq.rating || 'N/A', 'Created Date': Utils.formatDate(vq.createdDate) })))}, 'vendor-qualification-report.csv')"><i class="bi bi-file-earmark-spreadsheet me-2"></i>Export to CSV</button></div>`;
    document.getElementById('reportContent').innerHTML = reportContent;
}

