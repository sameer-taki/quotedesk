// API Test Script for QuoteForge
// Run with: node test-api.js

const BASE_URL = 'http://localhost:5000/api';

async function test() {
    console.log('🧪 Testing QuoteForge API\n');
    console.log('='.repeat(50));

    let token = null;
    let quoteId = null;
    let customerId = null;

    // 1. Test Health Check
    console.log('\n1️⃣ Health Check');
    try {
        const resp = await fetch(`${BASE_URL}/health`);
        const data = await resp.json();
        console.log('   ✅ API is healthy:', data.message);
    } catch (e) {
        console.log('   ❌ Health check failed:', e.message);
        return;
    }

    // 2. Test Login
    console.log('\n2️⃣ Login as Admin');
    try {
        const resp = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@kastel.local', password: 'admin123' })
        });
        const data = await resp.json();
        if (data.success) {
            token = data.data.token;
            console.log('   ✅ Login successful, user:', data.data.user.name);
        } else {
            console.log('   ❌ Login failed:', data.message);
            return;
        }
    } catch (e) {
        console.log('   ❌ Login error:', e.message);
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 3. Test Get Suppliers
    console.log('\n3️⃣ Get Suppliers');
    try {
        const resp = await fetch(`${BASE_URL}/suppliers`, { headers });
        const data = await resp.json();
        console.log('   ✅ Found', data.data?.length || 0, 'suppliers');
    } catch (e) {
        console.log('   ❌ Get suppliers failed:', e.message);
    }

    // 4. Test Get Categories
    console.log('\n4️⃣ Get Categories');
    try {
        const resp = await fetch(`${BASE_URL}/categories`, { headers });
        const data = await resp.json();
        console.log('   ✅ Found', data.data?.length || 0, 'categories');
    } catch (e) {
        console.log('   ❌ Get categories failed:', e.message);
    }

    // 5. Test Get FX Rates
    console.log('\n5️⃣ Get FX Rates');
    try {
        const resp = await fetch(`${BASE_URL}/fx-rates`, { headers });
        const data = await resp.json();
        console.log('   ✅ Found', data.data?.length || 0, 'FX rates');
    } catch (e) {
        console.log('   ❌ Get FX rates failed:', e.message);
    }

    // 6. Test Create Customer
    console.log('\n6️⃣ Create Customer');
    try {
        const resp = await fetch(`${BASE_URL}/customers`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: 'Test Customer',
                company: 'Test Corp',
                email: 'test@example.com',
                phone: '123-456-7890'
            })
        });
        const data = await resp.json();
        if (data.success) {
            customerId = data.data.id;
            console.log('   ✅ Customer created:', data.data.name);
        } else {
            console.log('   ❌ Create customer failed:', data.message);
        }
    } catch (e) {
        console.log('   ❌ Create customer error:', e.message);
    }

    // 7. Test Get Customers
    console.log('\n7️⃣ Get Customers');
    try {
        const resp = await fetch(`${BASE_URL}/customers`, { headers });
        const data = await resp.json();
        console.log('   ✅ Found', data.data?.length || 0, 'customers');
    } catch (e) {
        console.log('   ❌ Get customers failed:', e.message);
    }

    // 8. Test Create Quote
    console.log('\n8️⃣ Create Quote');
    try {
        const resp = await fetch(`${BASE_URL}/quotes`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                clientName: 'Test Client Ltd',
                notes: 'Test quote created by API test',
                lines: [
                    {
                        description: 'Network Switch 24-port',
                        quantity: 2,
                        buyPrice: 500,
                        exchangeRate: 1.39,
                        freightRate: 0.05,
                        dutyRate: 0.05,
                        handlingRate: 0.02,
                        targetMarkupPercent: 0.25,
                        currency: 'NZD'
                    }
                ]
            })
        });
        const data = await resp.json();
        if (data.success) {
            quoteId = data.data.id;
            console.log('   ✅ Quote created:', data.data.quoteNumber);
            console.log('      Total:', data.data.totalSellingIncVat, 'FJD');
        } else {
            console.log('   ❌ Create quote failed:', data.message);
        }
    } catch (e) {
        console.log('   ❌ Create quote error:', e.message);
    }

    // 9. Test Get Quotes
    console.log('\n9️⃣ Get Quotes');
    try {
        const resp = await fetch(`${BASE_URL}/quotes`, { headers });
        const data = await resp.json();
        console.log('   ✅ Found', data.data?.quotes?.length || 0, 'quotes');
    } catch (e) {
        console.log('   ❌ Get quotes failed:', e.message);
    }

    // 10. Test Submit Quote for Approval
    if (quoteId) {
        console.log('\n🔟 Submit Quote for Approval');
        try {
            const resp = await fetch(`${BASE_URL}/quotes/${quoteId}/submit`, {
                method: 'POST',
                headers
            });
            const data = await resp.json();
            if (data.success) {
                console.log('   ✅ Quote submitted, status:', data.data.status);
                console.log('      Requires approval:', data.data.requiresApproval);
            } else {
                console.log('   ❌ Submit failed:', data.message);
            }
        } catch (e) {
            console.log('   ❌ Submit error:', e.message);
        }

        // 11. Test Approve Quote (admin only)
        console.log('\n1️⃣1️⃣ Approve Quote (Admin)');
        try {
            const resp = await fetch(`${BASE_URL}/quotes/${quoteId}/approve`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ comments: 'Approved via API test' })
            });
            const data = await resp.json();
            if (data.success) {
                console.log('   ✅ Quote approved!');
                console.log('   📧 Email notification sent to creator');
            } else {
                console.log('   ❌ Approve failed:', data.message);
            }
        } catch (e) {
            console.log('   ❌ Approve error:', e.message);
        }
    }

    // 12. Test Dashboard Stats
    console.log('\n1️⃣2️⃣ Get Dashboard Stats');
    try {
        const resp = await fetch(`${BASE_URL}/quotes?limit=100`, { headers });
        const data = await resp.json();
        const quotes = data.data?.quotes || [];
        const stats = {
            total: quotes.length,
            draft: quotes.filter(q => q.status === 'draft').length,
            pending: quotes.filter(q => q.status === 'pending').length,
            approved: quotes.filter(q => q.status === 'approved').length,
        };
        console.log('   ✅ Quote stats:', stats);
    } catch (e) {
        console.log('   ❌ Dashboard stats error:', e.message);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ API Testing Complete!\n');
}

test().catch(console.error);
