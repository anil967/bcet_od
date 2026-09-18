const form = document.getElementById('login-form');
const error = document.getElementById('login-error');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  error.textContent = '';
  const button = form.querySelector('button');
  button.disabled = true;
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        username: form.username.value,
        password: form.password.value,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to sign in');
    window.location.replace('/admin/dashboard');
  } catch (err) {
    error.textContent = err.message;
  } finally {
    button.disabled = false;
  }
});
