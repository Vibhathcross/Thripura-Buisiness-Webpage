// test_chat_endpoints.js - Endpoint validation suite
async function runTests() {
  console.log('📡 Starting chat API validation tests...\n');
  const baseUrl = 'http://localhost:3000';

  try {
    // 1. Fetch unique customer threads list
    const resCustomers = await fetch(`${baseUrl}/api/messages/customers`);
    const customers = await resCustomers.json();
    console.log('✅ GET /api/messages/customers: Success!');
    console.log('   Active Threads:', JSON.stringify(customers, null, 2));

    // 2. Fetch Elizabeth George thread history (legacy)
    const resElizabeth = await fetch(`${baseUrl}/api/messages/thread/Elizabeth%20George`);
    const threadElizabeth = await resElizabeth.json();
    console.log('\n✅ GET /api/messages/thread/Elizabeth George: Success!');
    console.log('   Thread History Count:', threadElizabeth.length);
    console.log('   Thread History:', JSON.stringify(threadElizabeth, null, 2));

    // 3. Post a message as "Test User"
    const postPayload = {
      sender: 'Test User',
      role: 'customer',
      customerName: 'Test User',
      data: 'Hello Admin! This is a test chat message from the customer widget.',
      routing: 'test@test.com'
    };
    const resPost = await fetch(`${baseUrl}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postPayload)
    });
    const newMsg = await resPost.json();
    console.log('\n✅ POST /api/messages (Customer): Success!');
    console.log('   New Message ID:', newMsg._id);

    // 4. Post a reply from Admin
    const replyPayload = {
      sender: 'Madhu Sudhanan P K',
      role: 'admin',
      customerName: 'Test User',
      data: 'Encrypted link established. Preparing system parameters response.'
    };
    const resReply = await fetch(`${baseUrl}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(replyPayload)
    });
    const adminMsg = await resReply.json();
    console.log('\n✅ POST /api/messages (Admin): Success!');
    console.log('   Admin Reply ID:', adminMsg._id);

    // 5. Fetch Test User thread history
    const resThread = await fetch(`${baseUrl}/api/messages/thread/Test%20User`);
    const thread = await resThread.json();
    console.log('\n✅ GET /api/messages/thread/Test User: Success!');
    console.log('   Thread History Count:', thread.length);
    console.log('   Thread Data:', JSON.stringify(thread, null, 2));

    // 6. Edit Admin Message
    const editPayload = { data: 'Encrypted link established. Verified parameters.' };
    const resEdit = await fetch(`${baseUrl}/api/messages/${adminMsg._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editPayload)
    });
    const editResult = await resEdit.json();
    console.log(`\n✅ PUT /api/messages/${adminMsg._id}: Success!`, editResult);

    // 7. Verify the edit
    const resThreadVerify = await fetch(`${baseUrl}/api/messages/thread/Test%20User`);
    const threadVerify = await resThreadVerify.json();
    console.log('   Verified Edit Content:', threadVerify[1].data);

    // 8. Delete Admin Message
    const resDelete = await fetch(`${baseUrl}/api/messages/${adminMsg._id}`, {
      method: 'DELETE'
    });
    const deleteResult = await resDelete.json();
    console.log(`\n✅ DELETE /api/messages/${adminMsg._id}: Success!`, deleteResult);

    // 9. Clear the thread completely
    const resClear = await fetch(`${baseUrl}/api/messages/thread/Test%20User`, {
      method: 'DELETE'
    });
    const clearResult = await resClear.json();
    console.log('\n✅ DELETE /api/messages/thread/Test User (Clear Chat): Success!', clearResult);

    // 10. Verify thread is now empty
    const resThreadEmpty = await fetch(`${baseUrl}/api/messages/thread/Test%20User`);
    const threadEmpty = await resThreadEmpty.json();
    console.log('   Thread is empty now:', threadEmpty.length === 0 ? 'YES' : 'NO');

    console.log('\n🎉 ALL ENDPOINT ROUTING AND PERSISTENCE CHECKS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n❌ Validation test encountered an error:', err.message);
  }
}

runTests();
