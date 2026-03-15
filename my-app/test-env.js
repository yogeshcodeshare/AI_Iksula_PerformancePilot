const http = require('http');
http.get('http://localhost:3000', (res) => {
  console.log("Got response");
});
