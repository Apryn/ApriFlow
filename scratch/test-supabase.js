const url = 'https://chpvfwjwghjjrbbhvjqm.supabase.co/auth/v1/signup';
const apikey = 'sb_publishable_Ee91zZeM683ObghOa_n5LQ_AZNhqHK4';

async function rawSignup() {
  console.log("Sending raw fetch to Supabase Auth Signup...");
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': apikey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test_raw_fetch_' + Date.now() + '@apriflow.com',
        password: 'password123'
      })
    });
    
    console.log("HTTP Response Status:", response.status);
    console.log("HTTP Response Headers:", [...response.headers.entries()]);
    
    const text = await response.text();
    console.log("HTTP Response Body:");
    console.log(text);
  } catch (err) {
    console.error("Fetch threw exception:", err);
  }
}

rawSignup();
