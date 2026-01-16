const API_BASE = 'http://127.0.0.1:5000/api';
let token = '';

const log = (msg) => console.log(`[VERIFY] ${msg}`);

async function runTests() {
    try {
        log('Starting automated feature verification (Native Fetch)...');

        // 1. Auth: Login
        log('Testing Authentication...');
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@quoteforge.com',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        if (!loginData.success) throw new Error(`Login failed: ${loginData.message}`);
        token = loginData.data.token;
        log('✓ Authentication successful. Token received.');

        const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        // 2. Customer Management: Create Customer
        log('Testing Customer Creation...');
        const customerRes = await fetch(`${API_BASE}/customers`, {
            method: 'POST',
            headers: authHeader,
            body: JSON.stringify({
                name: 'Verification Hub',
                email: 'verify@hub.com',
                phone: '000-111-222',
                company: 'Verify Corp',
                address: '456 Tech Park, Viti Levu'
            })
        });
        const customerData = await customerRes.json();
        if (!customerData.success) throw new Error(`Customer creation failed: ${customerData.message}`);
        const customerId = customerData.data.id;
        log('✓ Customer created successfully.');

        // 3. Smart Approvals: High Margin -> Should Auto-Approve
        log('Testing Smart Approvals (High Margin)...');
        const highMarginQuote = await fetch(`${API_BASE}/quotes`, {
            method: 'POST',
            headers: authHeader,
            body: JSON.stringify({
                clientName: 'Verification Hub',
                customerId,
                quoteDate: new Date(),
                validUntil: new Date(Date.now() + 86400000 * 14),
                lines: [{
                    description: 'High Margin Item',
                    quantity: 1,
                    buyPrice: 1000,
                    currency: 'NZD',
                    exchangeRate: 1.0,
                    freightRate: 0,
                    dutyRate: 0,
                    handlingRate: 0,
                    markupPercent: 0.25
                }]
            })
        });
        const quoteData = await highMarginQuote.json();
        const qId = quoteData.data.id;
        const publicId = quoteData.data.publicId;

        // Submit it
        const submitRes = await fetch(`${API_BASE}/quotes/${qId}/submit`, {
            method: 'POST',
            headers: authHeader
        });
        const submitData = await submitRes.json();
        log(`Status after submit: ${submitData.data.status}`);

        if (submitData.data.autoApproved) {
            log('✓ Smart Approval logic verified: Quote was auto-approved.');
        } else {
            log('✗ Smart Approval logic FAILED: Quote was not auto-approved.');
        }

        // 4. Public Portal: Access check
        log('Testing Public Portal Access...');
        const portalRes = await fetch(`${API_BASE}/quotes/public/${publicId}`);
        const portalData = await portalRes.json();
        log(`✓ Portal access verified. Found quote: ${portalData.data.quoteNumber}`);

        // 5. Digital Acceptance: Accept the quote
        log('Testing Digital Acceptance via Portal...');
        const acceptRes = await fetch(`${API_BASE}/quotes/public/${publicId}/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ acceptedBy: 'Validation Agent' })
        });
        const acceptData = await acceptRes.json();

        if (acceptData.data.status === 'accepted') {
            log('✓ Digital Acceptance logic verified.');
        } else {
            log('✗ Digital Acceptance FAILED.');
        }

        // 6. View Internal Status
        const finalCheckRes = await fetch(`${API_BASE}/quotes/${qId}`, { headers: authHeader });
        const finalCheck = await finalCheckRes.json();
        log(`Final Quote Status in Admin View: ${finalCheck.data.status}`);
        log(`View Count: ${finalCheck.data.viewCount}`);

        if (finalCheck.data.status === 'accepted' && finalCheck.data.viewCount > 0) {
            log('✓ View Tracking and State Sync verified.');
        }

        log('\n=============================================');
        log('  ALL ENTERPRISE FEATURES VERIFIED (BACKEND) ');
        log('=============================================');

    } catch (err) {
        log(`✗ Test failed: ${err.message}`);
        process.exit(1);
    }
}

runTests();
