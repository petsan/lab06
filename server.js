'use strict'

const express = require('express');
const app = express();

require('dotenv').config();

const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT || 3001;

app.get('/location', (request, response) => {
  try {
    console.log(request.query)
    let search_query = request.query.city;
    let geoData  = require('./data/location.json');
    let returnObj = new Location(search_query, geoData[0]);

    console.log(returnObj);

    response.status(200).send(returnObj);
  }
  catch(err) {
    console.log('ERROR', err);
    response.status(500).send('Server Error');
  }
})

function Location(searchQuery, obj) {
  this.search_query = searchQuery;
  this.formatted_querry = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
}

app.get('*', (request, response) => {
  response.status(404).send('This route does not exist')
});

app.listen(PORT, () => {
  console.log(`listening on PORT: ${PORT}`);
});
