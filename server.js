'use strict'

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

const pg = require('pg');

require('dotenv').config();
const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;
const ERROR404 = 'The page does not exist.';

const sqlClient = new pg.Client(process.env.DATABASE_URL);
sqlClient.on('error', err => console.log(err));

app.get('/location', (request, response) => {
  let city = request.query.city;
  //MAKE the first client.query SECTION
  //determine the sql variable  variable = SELECT
  // let sqlQuery = `SELECT search_query, formatted_query, latitude, longitude FROM
  //   cities WHERE search_query = '$1';`;
  let sqlQuery = `SELECT search_query, formatted_query, latitude, longitude FROM
    cities WHERE search_query = 'kent';`;
  //determine the safe value variable
  let safeValue = [city];
  //make a client.query
  sqlClient.query(sqlQuery)
  //sqlClient.query(sqlQuery, safeValue)
  //make a '.then' and inside this '.then' check if SELECT statement return a result (does it exist in the database)
    .then(sqlResult => {
      console.log(sqlResult.rows);

      if (!sqlResult.search_query) {
        console.log('call superagent');
        let url = `https://us1.locationiq.com/v1/search.php?key=${process.env.GEO_DATA_API_KEY}&q=${city}&format=json`;
        superagent.get(url)
          .then(resultsFromSuperAgent => {
            let returnObj = new Location(city, resultsFromSuperAgent.body[0])
            // query to insert the city into the database before the response
            // let sqlQuery2 = `INSERT INTO cities (search_query, formatted_query, latitude,
            //   longitude VALUES ($1, $2, $3, $4);`;
            let sqlQuery2 = `insert into cities (search_query,
              formatted_query, latitude, longitude) values
              ('olympia', 'Olympia, WA', 45.546, 179.000);`;
            sqlClient.query(sqlQuery2)
              .then(sqlResult => {
                console.log(sqlResult.rows)
              }).catch(err => console.log(err));
            response.status(200).send(returnObj);
            console.log(returnObj);
          }).catch(err => console.log(err));
      } else {
        console.log('send the sqlResult back to the client');
      }
    })
    .catch(err => console.log(err));

  // if it does not exist
  //in the else {all superagent}
  //  // change this to check if request.search_query exists

  ///////
  //


  // sqlClient.query(sqlQuery2, safeValue)
  // .then()
  // .catch();
  //   //if so return it to the client



})

app.get('/weather', (request, response) => {
  let city = request.query.search_query;
  let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${process.env.WEATHER_API_KEY}&days=8`;
  superagent.get(url)
    .then(resultsFromSuperAgent => {
      const weatherArray = resultsFromSuperAgent.body.data.map(day => {
        return new Weather(day);
      })
      response.status(200).send(weatherArray);
    }).catch(err => console.log(err))
})

app.get('/trails', (request, response) => {
  let {latitude, longitude} = request.query;
  let url = `https://www.hikingproject.com/data/get-trails?lat=${latitude}&lon=${longitude}&key=${process.env.HIKING_PROJECT_API_KEY}`;

  superagent.get(url)
    .then(resultsFromSuperAgent => {
      const trailArr = resultsFromSuperAgent.body.trails.map(trail => {
        return new Trail(trail);
      })
      response.status(200).send(trailArr);
    }).catch(err => console.log(err));
})

function Location(searchQuery, obj) {
  this.search_query = searchQuery;
  this.formatted_query = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
}

function Weather(obj) {
  this.forecast = obj.weather.description;
  this.time = obj.valid_date;
}

function Trail(obj) {
  this.name = obj.name;
  this.location = obj.location;
  this.length = obj.length;
  this.stars = obj.stars;
  this.star_votes = obj.starVotes;
  this.trail_url = obj.url;
  this.conditions = `${obj.conditionStatus} ${obj.conditionDetails}`;
  this.condition_date = obj.conditionDate.slice(0, 10);
  this.condition_date = obj.conditionDate.slice(12, 19);
}

app.get('*', (request, response) => {
  response.status(404).send(ERROR404);
});

sqlClient.connect().then( () => {
  app.listen(PORT, () => {
    console.log(`listening on PORT: ${PORT}`);
  })
})
