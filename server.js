'use strict'

const express = require('express');
const app = express();

require('dotenv').config();

const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT || 3001;

app.get('*', (request, response) => {
  response.status(404).send('This route does not exist')
});

app.listen(PORT, () => {
  console.log(`listening on PORT: ${PORT}`);
});