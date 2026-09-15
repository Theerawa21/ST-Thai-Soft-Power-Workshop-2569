const id = localStorage.getItem('gbm_registration_id');
const token = localStorage.getItem('gbm_public_token');
const saved = document.querySelector('#savedRegistration');
const empty = document.querySelector('#noSaved');

if (id && token) {
  saved.hidden = false;
  empty.hidden = true;
  document.querySelector('#savedId').textContent = id;
  const url = new URL('student.html', window.location.href);
  url.searchParams.set('id', id);
  url.searchParams.set('token', token);
  document.querySelector('#openStudent').href = url.toString();
}

document.querySelector('#clearSaved')?.addEventListener('click', () => {
  localStorage.removeItem('gbm_registration_id');
  localStorage.removeItem('gbm_public_token');
  window.location.reload();
});
