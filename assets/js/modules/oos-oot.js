// OOS/OOT Management Module
let oosOOTFiles = [];

document.addEventListener('DOMContentLoaded', function() {
    loadOOSOOTData();
    setupFileUpload();
    setupFilters();
});

function loadOOSOOTData() {
    const data = JSON.parse(localStorage.getItem('oos-oot_data') || '[]');
    const tbody = document.getElementById('oosOOTTableBody');
    
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No records found</td></tr>';
        return;
    }

    tbody.innerHTML = data.map((oosoot, index) => `
        <tr>
            <td><strong>${oosoot.oosOOTNumber}</strong></td>
            <td><span class="badge bg-${oosoot.type === 'OOS' ? 'danger' : 'warning'}">${oosoot.type}</span></td>
            <td>${oosoot.productName}</td>
            <td>${oosoot.batchNumber}</td>
            <td>${oosoot.testName}</td>
            <td>${oosoot.observedResult}</td>
            <td><span class="badge bg-info">${oosoot.currentPhase}</span></td>
            <td><span class="badge bg-${getStatusColor(oosoot.status)}">${oosoot.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewOOSOOT(${index})">
                    <i class="bi bi-eye"></i>
                </button>
                ${canEdit(oosoot) ? `<button class="btn btn-sm btn-warning" onclick="editOOSOOT(${index})"><i class="bi bi-pencil"></i></button>` : ''}
            </td>
        </tr>
    `).join('');
}

function getStatusColor(status) {
    const colors = {
        'Phase-I': 'primary',
        'IB': 'warning',
        'Phase-II': 'info',
        'Closed': 'success'
    };
    return colors[status] || 'secondary';
}

function canEdit(oosoot) {
    const user = authManager.getCurrentUser();
    if (!user) return false;
    
    if (oosoot.status === 'Phase-I' && oosoot.initiatorRole === user.role) return true;
    if (['IB', 'Phase-II'].includes(oosoot.status) && authManager.hasAccess('oos-oot', 'investigate')) return true;
    
    return false;
}

function setupFileUpload() {
    const fileUpload = document.getElementById('oosOOTFileUpload');
    const fileInput = document.getElementById('oosOOTFileInput');
    
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
        oosOOTFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            file: file
        });
    });
    updateFilesList();
}

function updateFilesList() {
    const filesList = document.getElementById('oosOOTFilesList');
    if (!filesList) return;
    
    if (oosOOTFiles.length === 0) {
        filesList.innerHTML = '';
        return;
    }
    
    filesList.innerHTML = oosOOTFiles.map((file, index) => `
        <div class="d-flex justify-content-between align-items-center p-2 bg-light rounded mb-2">
            <span><i class="bi bi-file-earmark me-2"></i>${file.name}</span>
            <button class="btn btn-sm btn-danger" onclick="removeOOSOOTFile(${index})">
                <i class="bi bi-x"></i>
            </button>
        </div>
    `).join('');
}

function removeOOSOOTFile(index) {
    oosOOTFiles.splice(index, 1);
    updateFilesList();
}

function submitOOSOOT() {
    const form = document.getElementById('oosOOTForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const oosOOTData = {
        oosOOTNumber: Utils.generateNumber('OOS'),
        type: document.getElementById('oosOOTType').value,
        productName: document.getElementById('productName').value,
        batchNumber: document.getElementById('batchNumber').value,
        testName: document.getElementById('testName').value,
        specification: document.getElementById('specification').value,
        observedResult: document.getElementById('observedResult').value,
        sampleInfo: document.getElementById('sampleInfo').value,
        analyst: document.getElementById('analyst').value,
        initialObservations: document.getElementById('initialObservations').value,
        attachments: oosOOTFiles.map(f => f.name),
        currentPhase: 'Phase-I',
        status: 'Phase-I',
        investigations: {
            phaseI: {
                status: 'In Progress',
                hypothesis: '',
                findings: '',
                conclusion: '',
                date: new Date().toISOString()
            },
            ib: {
                status: 'Pending',
                hypothesis: '',
                findings: '',
                conclusion: '',
                date: null
            },
            phaseII: {
                status: 'Pending',
                hypothesis: '',
                findings: '',
                retesting: '',
                conclusion: '',
                date: null
            }
        },
        workflow: {
            currentStep: 'QC Initiator',
            steps: [
                { step: 'QC Initiator', status: 'Completed', user: authManager.getCurrentUser().name, date: new Date().toISOString() },
                { step: 'Operating Manager QC', status: 'Pending', user: '', date: null },
                { step: 'Head QC', status: 'Pending', user: '', date: null },
                { step: 'Analytical QA', status: 'Pending', user: '', date: null },
                { step: 'Head QA', status: 'Pending', user: '', date: null }
            ]
        },
        initiator: authManager.getCurrentUser().name,
        initiatorRole: authManager.getCurrentUser().role,
        createdDate: new Date().toISOString(),
        closureComments: '',
        comments: [],
        auditTrail: [{
            action: 'Created',
            user: authManager.getCurrentUser().name,
            role: authManager.getCurrentUser().role,
            date: new Date().toISOString()
        }]
    };

    // Save to localStorage
    const allData = JSON.parse(localStorage.getItem('oos-oot_data') || '[]');
    allData.push(oosOOTData);
    localStorage.setItem('oos-oot_data', JSON.stringify(allData));

    // Reset form
    form.reset();
    oosOOTFiles = [];
    updateFilesList();

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('newOOSOOTModal'));
    modal.hide();

    Utils.showNotification('OOS/OOT record created successfully', 'success');
    loadOOSOOTData();
}

function viewOOSOOT(index) {
    const data = JSON.parse(localStorage.getItem('oos-oot_data') || '[]');
    const oosoot = data[index];
    
    if (!oosoot) return;

    const content = `
        <div class="row">
            <div class="col-md-12 mb-3">
                <h6>OOS/OOT Number: <strong>${oosoot.oosOOTNumber}</strong></h6>
                <p class="mb-0">Status: <span class="badge bg-${getStatusColor(oosoot.status)}">${oosoot.status}</span></p>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label"><strong>Type</strong></label>
                <p><span class="badge bg-${oosoot.type === 'OOS' ? 'danger' : 'warning'}">${oosoot.type}</span></p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label"><strong>Product Name</strong></label>
                <p>${oosoot.productName}</p>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label"><strong>Batch Number</strong></label>
                <p>${oosoot.batchNumber}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label"><strong>Test Name</strong></label>
                <p>${oosoot.testName}</p>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label"><strong>Specification</strong></label>
                <p>${oosoot.specification || 'N/A'}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label"><strong>Observed Result</strong></label>
                <p><strong>${oosoot.observedResult}</strong></p>
            </div>
        </div>
        
        ${oosoot.sampleInfo ? `
            <div class="mb-3">
                <label class="form-label"><strong>Sample Information</strong></label>
                <p>${oosoot.sampleInfo}</p>
            </div>
        ` : ''}
        
        ${oosoot.initialObservations ? `
            <div class="mb-3">
                <label class="form-label"><strong>Initial Observations</strong></label>
                <p>${oosoot.initialObservations}</p>
            </div>
        ` : ''}
        
        <div class="mb-3">
            <label class="form-label"><strong>Current Phase</strong></label>
            <p><span class="badge bg-info fs-6">${oosoot.currentPhase}</span></p>
        </div>
        
        <!-- Phase-I Investigation -->
        <div class="card mb-3">
            <div class="card-header">
                <h6 class="mb-0">Phase-I Investigation</h6>
            </div>
            <div class="card-body">
                <p><strong>Status:</strong> <span class="badge bg-${oosoot.investigations.phaseI.status === 'Completed' ? 'success' : 'warning'}">${oosoot.investigations.phaseI.status}</span></p>
                ${oosoot.investigations.phaseI.hypothesis ? `
                    <p><strong>Hypothesis:</strong> ${oosoot.investigations.phaseI.hypothesis}</p>
                ` : ''}
                ${oosoot.investigations.phaseI.findings ? `
                    <p><strong>Findings:</strong> ${oosoot.investigations.phaseI.findings}</p>
                ` : ''}
                ${oosoot.investigations.phaseI.conclusion ? `
                    <p><strong>Conclusion:</strong> ${oosoot.investigations.phaseI.conclusion}</p>
                ` : ''}
                ${canInvestigate(oosoot, 'phaseI') ? `
                    <button class="btn btn-sm btn-primary" onclick="updatePhaseI(${index})">
                        <i class="bi bi-pencil me-2"></i>Update Phase-I
                    </button>
                ` : ''}
            </div>
        </div>
        
        <!-- IB Investigation -->
        ${oosoot.investigations.ib.status !== 'Pending' ? `
            <div class="card mb-3">
                <div class="card-header">
                    <h6 class="mb-0">IB (Initial Batch) Investigation</h6>
                </div>
                <div class="card-body">
                    <p><strong>Status:</strong> <span class="badge bg-${oosoot.investigations.ib.status === 'Completed' ? 'success' : 'warning'}">${oosoot.investigations.ib.status}</span></p>
                    ${oosoot.investigations.ib.hypothesis ? `
                        <p><strong>Hypothesis:</strong> ${oosoot.investigations.ib.hypothesis}</p>
                    ` : ''}
                    ${oosoot.investigations.ib.findings ? `
                        <p><strong>Findings:</strong> ${oosoot.investigations.ib.findings}</p>
                    ` : ''}
                    ${oosoot.investigations.ib.conclusion ? `
                        <p><strong>Conclusion:</strong> ${oosoot.investigations.ib.conclusion}</p>
                    ` : ''}
                    ${canInvestigate(oosoot, 'ib') ? `
                        <button class="btn btn-sm btn-primary" onclick="updateIB(${index})">
                            <i class="bi bi-pencil me-2"></i>Update IB
                        </button>
                    ` : ''}
                </div>
            </div>
        ` : ''}
        
        <!-- Phase-II Investigation -->
        ${oosoot.investigations.phaseII.status !== 'Pending' ? `
            <div class="card mb-3">
                <div class="card-header">
                    <h6 class="mb-0">Phase-II Investigation</h6>
                </div>
                <div class="card-body">
                    <p><strong>Status:</strong> <span class="badge bg-${oosoot.investigations.phaseII.status === 'Completed' ? 'success' : 'warning'}">${oosoot.investigations.phaseII.status}</span></p>
                    ${oosoot.investigations.phaseII.hypothesis ? `
                        <p><strong>Hypothesis:</strong> ${oosoot.investigations.phaseII.hypothesis}</p>
                    ` : ''}
                    ${oosoot.investigations.phaseII.findings ? `
                        <p><strong>Findings:</strong> ${oosoot.investigations.phaseII.findings}</p>
                    ` : ''}
                    ${oosoot.investigations.phaseII.retesting ? `
                        <p><strong>Retesting:</strong> ${oosoot.investigations.phaseII.retesting}</p>
                    ` : ''}
                    ${oosoot.investigations.phaseII.conclusion ? `
                        <p><strong>Conclusion:</strong> ${oosoot.investigations.phaseII.conclusion}</p>
                    ` : ''}
                    ${canInvestigate(oosoot, 'phaseII') ? `
                        <button class="btn btn-sm btn-primary" onclick="updatePhaseII(${index})">
                            <i class="bi bi-pencil me-2"></i>Update Phase-II
                        </button>
                    ` : ''}
                </div>
            </div>
        ` : ''}
        
        <div class="mb-3">
            <label class="form-label"><strong>Workflow</strong></label>
            <div class="workflow-steps">
                ${oosoot.workflow.steps.map((step, i) => `
                    <div class="workflow-step ${step.status === 'Completed' ? 'completed' : step.status === 'Pending' && i === oosoot.workflow.steps.findIndex(s => s.status === 'Pending') ? 'active' : ''}">
                        <div class="step-circle">
                            ${step.status === 'Completed' ? '<i class="bi bi-check"></i>' : i + 1}
                        </div>
                        <div class="step-label">${step.step}</div>
                        ${step.user ? `<small>${step.user}</small>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        
        ${oosoot.attachments.length > 0 ? `
            <div class="mb-3">
                <label class="form-label"><strong>Attachments</strong></label>
                <ul>
                    ${oosoot.attachments.map(file => `<li>${file}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
        
        ${canApprove(oosoot) ? `
            <div class="mt-3">
                <button class="btn btn-success me-2" onclick="approveOOSOOT(${index})">
                    <i class="bi bi-check-circle me-2"></i>Approve
                </button>
                <button class="btn btn-info me-2" onclick="moveToNextPhase(${index})">
                    <i class="bi bi-arrow-right me-2"></i>Move to Next Phase
                </button>
                ${authManager.hasAccess('oos-oot', 'final_approve') ? `
                    <button class="btn btn-secondary" onclick="closeOOSOOT(${index})">
                        <i class="bi bi-check-all me-2"></i>Close
                    </button>
                ` : ''}
            </div>
        ` : ''}
        
        <div class="mt-4">
            <h6>Comments</h6>
            <div id="oosOOTComments">
                ${oosoot.comments.length > 0 ? oosoot.comments.map(c => `
                    <div class="comment-item mb-2">
                        <strong>${c.user}</strong> (${c.date})<br>
                        ${c.comment}
                    </div>
                `).join('') : '<p>No comments yet</p>'}
            </div>
            <div class="mt-3">
                <textarea class="form-control" id="newOOSOOTComment" rows="2" placeholder="Add a comment..."></textarea>
                <button class="btn btn-primary mt-2" onclick="addOOSOOTComment(${index})">Add Comment</button>
            </div>
        </div>
    `;

    document.getElementById('viewOOSOOTContent').innerHTML = content;
    const modal = new bootstrap.Modal(document.getElementById('viewOOSOOTModal'));
    modal.show();
}

function canInvestigate(oosoot, phase) {
    const user = authManager.getCurrentUser();
    if (!user) return false;
    
    if (phase === 'phaseI' && ['QC Initiator', 'Operating Manager QC'].includes(user.role)) return true;
    if (phase === 'ib' && ['Head QC', 'Operating Manager QC'].includes(user.role)) return true;
    if (phase === 'phaseII' && ['Analytical QA', 'Head QA'].includes(user.role)) return true;
    
    return false;
}

function canApprove(oosoot) {
    const user = authManager.getCurrentUser();
    if (!user) return false;
    
    const currentStep = oosoot.workflow.steps.find(s => s.status === 'Pending');
    if (!currentStep) return false;
    
    const roleMap = {
        'Operating Manager QC': ['Operating Manager QC'],
        'Head QC': ['Head QC'],
        'Analytical QA': ['Analytical QA Incharge'],
        'Head QA': ['Head QA']
    };
    
    return roleMap[currentStep.step]?.includes(user.role);
}

function updatePhaseI(index) {
    const hypothesis = prompt('Enter Phase-I Hypothesis:');
    if (!hypothesis) return;
    
    const findings = prompt('Enter Phase-I Findings:');
    const conclusion = prompt('Enter Phase-I Conclusion:');
    
    const data = JSON.parse(localStorage.getItem('oos-oot_data') || '[]');
    const oosoot = data[index];
    
    oosoot.investigations.phaseI.hypothesis = hypothesis;
    oosoot.investigations.phaseI.findings = findings || '';
    oosoot.investigations.phaseI.conclusion = conclusion || '';
    oosoot.investigations.phaseI.status = 'Completed';
    
    localStorage.setItem('oos-oot_data', JSON.stringify(data));
    Utils.showNotification('Phase-I Investigation updated', 'success');
    viewOOSOOT(index);
}

function updateIB(index) {
    const hypothesis = prompt('Enter IB Hypothesis:');
    if (!hypothesis) return;
    
    const findings = prompt('Enter IB Findings:');
    const conclusion = prompt('Enter IB Conclusion:');
    
    const data = JSON.parse(localStorage.getItem('oos-oot_data') || '[]');
    const oosoot = data[index];
    
    oosoot.investigations.ib.hypothesis = hypothesis;
    oosoot.investigations.ib.findings = findings || '';
    oosoot.investigations.ib.conclusion = conclusion || '';
    oosoot.investigations.ib.status = 'Completed';
    oosoot.investigations.ib.date = new Date().toISOString();
    
    localStorage.setItem('oos-oot_data', JSON.stringify(data));
    Utils.showNotification('IB Investigation updated', 'success');
    viewOOSOOT(index);
}

function updatePhaseII(index) {
    const hypothesis = prompt('Enter Phase-II Hypothesis:');
    if (!hypothesis) return;
    
    const findings = prompt('Enter Phase-II Findings:');
    const retesting = prompt('Enter Retesting Details:');
    const conclusion = prompt('Enter Phase-II Conclusion:');
    
    const data = JSON.parse(localStorage.getItem('oos-oot_data') || '[]');
    const oosoot = data[index];
    
    oosoot.investigations.phaseII.hypothesis = hypothesis;
    oosoot.investigations.phaseII.findings = findings || '';
    oosoot.investigations.phaseII.retesting = retesting || '';
    oosoot.investigations.phaseII.conclusion = conclusion || '';
    oosoot.investigations.phaseII.status = 'Completed';
    oosoot.investigations.phaseII.date = new Date().toISOString();
    
    localStorage.setItem('oos-oot_data', JSON.stringify(data));
    Utils.showNotification('Phase-II Investigation updated', 'success');
    viewOOSOOT(index);
}

function moveToNextPhase(index) {
    const data = JSON.parse(localStorage.getItem('oos-oot_data') || '[]');
    const oosoot = data[index];
    
    if (oosoot.currentPhase === 'Phase-I' && oosoot.investigations.phaseI.status === 'Completed') {
        oosoot.currentPhase = 'IB';
        oosoot.status = 'IB';
        oosoot.investigations.ib.status = 'In Progress';
    } else if (oosoot.currentPhase === 'IB' && oosoot.investigations.ib.status === 'Completed') {
        oosoot.currentPhase = 'Phase-II';
        oosoot.status = 'Phase-II';
        oosoot.investigations.phaseII.status = 'In Progress';
    }
    
    localStorage.setItem('oos-oot_data', JSON.stringify(data));
    Utils.showNotification('Moved to next phase', 'success');
    viewOOSOOT(index);
}

function approveOOSOOT(index) {
    if (!Utils.confirmAction('Are you sure you want to approve this OOS/OOT?')) return;
    
    const data = JSON.parse(localStorage.getItem('oos-oot_data') || '[]');
    const oosoot = data[index];
    
    const currentStepIndex = oosoot.workflow.steps.findIndex(s => s.status === 'Pending');
    if (currentStepIndex !== -1) {
        oosoot.workflow.steps[currentStepIndex].status = 'Completed';
        oosoot.workflow.steps[currentStepIndex].user = authManager.getCurrentUser().name;
        oosoot.workflow.steps[currentStepIndex].date = new Date().toISOString();
        
        if (currentStepIndex < oosoot.workflow.steps.length - 1) {
            oosoot.workflow.steps[currentStepIndex + 1].status = 'Pending';
        }
    }
    
    oosoot.auditTrail.push({
        action: 'Approved',
        user: authManager.getCurrentUser().name,
        role: authManager.getCurrentUser().role,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('oos-oot_data', JSON.stringify(data));
    Utils.showNotification('OOS/OOT approved successfully', 'success');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('viewOOSOOTModal'));
    modal.hide();
    loadOOSOOTData();
}

function closeOOSOOT(index) {
    const closureComments = prompt('Enter closure comments:');
    if (!closureComments) return;
    
    const data = JSON.parse(localStorage.getItem('oos-oot_data') || '[]');
    const oosoot = data[index];
    
    oosoot.status = 'Closed';
    oosoot.closureComments = closureComments;
    oosoot.auditTrail.push({
        action: 'Closed',
        user: authManager.getCurrentUser().name,
        role: authManager.getCurrentUser().role,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('oos-oot_data', JSON.stringify(data));
    Utils.showNotification('OOS/OOT closed successfully', 'success');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('viewOOSOOTModal'));
    modal.hide();
    loadOOSOOTData();
}

function addOOSOOTComment(index) {
    const comment = document.getElementById('newOOSOOTComment').value.trim();
    if (!comment) return;
    
    const data = JSON.parse(localStorage.getItem('oos-oot_data') || '[]');
    const oosoot = data[index];
    
    oosoot.comments.push({
        user: authManager.getCurrentUser().name,
        role: authManager.getCurrentUser().role,
        comment: comment,
        date: Utils.formatDate(new Date())
    });
    
    localStorage.setItem('oos-oot_data', JSON.stringify(data));
    document.getElementById('newOOSOOTComment').value = '';
    viewOOSOOT(index);
}

function setupFilters() {
    const searchInput = document.getElementById('searchOOSOOT');
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterTable);
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', filterTable);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterTable);
    }
}

function filterTable() {
    const searchTerm = document.getElementById('searchOOSOOT').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const data = JSON.parse(localStorage.getItem('oos-oot_data') || '[]');
    
    const filtered = data.filter(oosoot => {
        const matchesSearch = !searchTerm || 
            oosoot.oosOOTNumber.toLowerCase().includes(searchTerm) ||
            oosoot.productName.toLowerCase().includes(searchTerm) ||
            oosoot.batchNumber.toLowerCase().includes(searchTerm);
        const matchesType = !typeFilter || oosoot.type === typeFilter;
        const matchesStatus = !statusFilter || oosoot.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });
    
    const tbody = document.getElementById('oosOOTTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No records found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map((oosoot, index) => {
        const originalIndex = data.indexOf(oosoot);
        return `
            <tr>
                <td><strong>${oosoot.oosOOTNumber}</strong></td>
                <td><span class="badge bg-${oosoot.type === 'OOS' ? 'danger' : 'warning'}">${oosoot.type}</span></td>
                <td>${oosoot.productName}</td>
                <td>${oosoot.batchNumber}</td>
                <td>${oosoot.testName}</td>
                <td>${oosoot.observedResult}</td>
                <td><span class="badge bg-info">${oosoot.currentPhase}</span></td>
                <td><span class="badge bg-${getStatusColor(oosoot.status)}">${oosoot.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewOOSOOT(${originalIndex})">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function generateOOSOOTReport() {
    const fromDate = document.getElementById('reportFromDate').value;
    const toDate = document.getElementById('reportToDate').value;
    const type = document.getElementById('reportType').value;
    
    let data = JSON.parse(localStorage.getItem('oos-oot_data') || '[]');
    
    // Filter data
    if (fromDate) {
        data = data.filter(oosoot => new Date(oosoot.createdDate) >= new Date(fromDate));
    }
    if (toDate) {
        data = data.filter(oosoot => new Date(oosoot.createdDate) <= new Date(toDate));
    }
    if (type) {
        data = data.filter(oosoot => oosoot.type === type);
    }
    
    const reportContent = `
        <div class="table-responsive">
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>OOS/OOT Number</th>
                        <th>Type</th>
                        <th>Product Name</th>
                        <th>Batch Number</th>
                        <th>Test Name</th>
                        <th>Observed Result</th>
                        <th>Current Phase</th>
                        <th>Status</th>
                        <th>Created Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(oosoot => `
                        <tr>
                            <td>${oosoot.oosOOTNumber}</td>
                            <td>${oosoot.type}</td>
                            <td>${oosoot.productName}</td>
                            <td>${oosoot.batchNumber}</td>
                            <td>${oosoot.testName}</td>
                            <td>${oosoot.observedResult}</td>
                            <td>${oosoot.currentPhase}</td>
                            <td>${oosoot.status}</td>
                            <td>${Utils.formatDate(oosoot.createdDate)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="mt-3">
            <button class="btn btn-primary" onclick="Utils.exportToCSV(${JSON.stringify(data.map(oosoot => ({
                'OOS/OOT Number': oosoot.oosOOTNumber,
                'Type': oosoot.type,
                'Product Name': oosoot.productName,
                'Batch Number': oosoot.batchNumber,
                'Test Name': oosoot.testName,
                'Observed Result': oosoot.observedResult,
                'Current Phase': oosoot.currentPhase,
                'Status': oosoot.status,
                'Created Date': Utils.formatDate(oosoot.createdDate)
            })))}, 'oos-oot-report.csv')">
                <i class="bi bi-file-earmark-spreadsheet me-2"></i>Export to CSV
            </button>
        </div>
    `;
    
    document.getElementById('reportContent').innerHTML = reportContent;
}

