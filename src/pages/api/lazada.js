const axios = require('axios');

async function getOriginalUrl(shortUrl) {
  try {
    const response = await axios.get(shortUrl, {
      maxRedirects: 0, // Tidak mengikuti redirect
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Menerima status 3xx
      }
    });

    if (response.status >= 300 && response.status < 400) {
      return response.headers.location;
    } else {
      throw new Error('Tidak ada redirect ditemukan');
    }
  } catch (error) {
    if (error.response && error.response.status >= 300 && error.response.status < 400) {
      return error.response.headers.location;
    }
    throw error;
  }
}

// Contoh penggunaan
getOriginalUrl('https://s.lazada.co.id/s.ZcLy2G')
  .then(originalUrl => {
    console.log('URL Asli:', originalUrl);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });