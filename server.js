'use strict'

const express = require('express');
const app = express();

require('dotenv').config();

const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT || 3001;

let error404 = 'The page does not exist.';
let error500 = 'Sorry, something went wrong.';


app.get('/location', (request, response) => {
  try {
    let search_query = request.query.city;
    let geoData  = require('./data/location.json.js');
    let returnObj = new Location(search_query, geoData[0]);

    response.status(200).send(returnObj);
  }
  catch(err) {
    response.status(500).send(error500);
  }
})

app.get('/weather', (request, response ) => {
  try {
    let weather = require('./data/weather.json');
    let weatherArray = weather.data.map(element => {
      return new Weather(element);
    })
    response.status(200).send(weatherArray);
  } catch (err) {
    response.status(500).send(error500);
  }
})

function Weather(obj) {
  // this.search_query = searchQuery;
  this.forecast = obj.weather.description;
  this.time = obj.valid_date;
}

function Location(obj) {
  // this.search_query = searchQuery;
  this.formatted_querry = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
}

app.get('*', (request, response) => {
  response.status(404).send(error404);
});

app.listen(PORT, () => {
  console.log(`listening on PORT: ${PORT}`);
});
