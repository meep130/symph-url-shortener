// server/src/index.js
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

app.use(cors()); // 👈 Enable all origins by default
app.use(express.json());
app.use('/', routes);

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
  res.send('Hello World!');
  console.log('yay')
});