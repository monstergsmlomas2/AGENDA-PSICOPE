const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://agenda-psicope.fly.dev' : '');

export default API_URL;
