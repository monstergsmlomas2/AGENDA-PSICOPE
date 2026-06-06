const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://agenda-psicope.onrender.com' : '');

export default API_URL;
