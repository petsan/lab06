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


app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailsHandler);
app.get('/movies', moviesHandler);

function locationHandler(request, response) {
  let city = request.query.city;
  console.log('this is my city' + city);
  let sqlQuery = 'SELECT search_query, formatted_query, latitude, longitude FROM cities WHERE search_query like $1;';
  const safeValues = [city];

  sqlClient.query(sqlQuery, safeValues)
    .then(sqlResults => {
      console.log(sqlResults.rows);

      if (sqlResults.rowCount) {
        console.log('sqlResuls.row: ' + sqlResults.rows);
        response.status(200).send(sqlResults.rows[0]);
      } else {
        let url = `https://us1.locationiq.com/v1/search.php?key=${process.env.GEO_DATA_API_KEY}&q=${city}&format=json`;
        superagent.get(url)
          .then(resultsFromSuperAgent => {
            let returnObj = new Location(city, resultsFromSuperAgent.body[0]);
            let sqlQuery1 = 'INSERT INTO cities (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);';

            const safeValue = [city,
              returnObj.formatted_query,
              returnObj.latitude,
              returnObj.longitude];

            sqlClient.query(sqlQuery1, safeValue)
              .then(sqlResult => {
                console.log(sqlResult.rows);
              }).catch(err => console.log(err));

            response.status(200).send(returnObj);
            console.log(returnObj);
          }).catch(err => console.log(err));
      }
    })
    .catch(err => console.log(err));
}

function weatherHandler(request, response) {
  let city = request.query.search_query;
  let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${process.env.WEATHER_API_KEY}&days=8`;
  superagent.get(url)
    .then(resultsFromSuperAgent => {
      const weatherArray = resultsFromSuperAgent.body.data.map(day => {
        return new Weather(day);
      })
      response.status(200).send(weatherArray);
    }).catch(err => console.log(err))
}

function trailsHandler(request, response) {
  let {latitude, longitude} = request.query;
  let url = `https://www.hikingproject.com/data/get-trails?lat=${latitude}&lon=${longitude}&key=${process.env.HIKING_PROJECT_API_KEY}`;

  superagent.get(url)
    .then(resultsFromSuperAgent => {
      const trailArr = resultsFromSuperAgent.body.trails.map(trail => {
        return new Trail(trail);
      })
      response.status(200).send(trailArr);
    }).catch(err => console.log(err));
}

function moviesHandler(request, response) {
  const city = request.query.search_query;
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&language=en-US&query=${city}`;

  superagent.get(url)
    .then(resultsFromSuperAgent => {
      const movieArray = resultsFromSuperAgent.body.results.map(movie => {
        return new Movie(movie);
      })
      response.status(200).send(movieArray);
    }).catch(err => console.log(err))
}

// app.get('/yelp', (request, response) => {
//   const city = request.query.city;
//   const url = `https://api.yelp.com/v3/businesses/search?restaurant&location=${city}`;
//   const url2 = 'https://'
//   const page = request.query.page;
//   const numPerPage = 5;
//   const start = (page - 1) * 5;

//   const queryParams = {
//     // lat: request.query.latitude;
//     // lng: request.query.longitude;
//     // start: start;
//     // count: numPerPage;
//   }
//   // superagent.get(url)
//   //   .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
//   //   .then(resultsFromSuperAgent => {
//   //     console.log('results from superagent 101: ' + resultsFromSuperAgent)
//   //     let results = JSON.parse(resultsFromSuperAgent.text);
//   //     const yelpArray = results.businesses.map(yelp => {
//   //       return new Yelp(yelp);
//   //     })
//   //     response.status(200).send(yelpArray)
//   //   }).catch(err => console.log(err))
//   superagent.get(url)
//     .set('user-kkey', 'process.env.YELP_API_KEY}')
//     .query(queryParams)
//     .then(data => {
//       console.log('data from superagent', data.body);
//       let restaurantArray = data.body.restaurants;
//       console.log('this is my restaurant Array' + restaurantArray[0])
//       const finalRestaurants = restaurantArray.map(eatery => {
//         return new Restaaurant(eatery)
//       }
//     )
// })

// app.get('/restaurants', (request, response) => {
//   const city = request.query.city;
//   const url = 'https://'
//   const page = request.query.page;
//   const numPerPage = 5;
//   const start = (page - 1) * 5;

//   const queryParams = {
//     // lat: request.query.latitude;
//     // lng: request.query.longitude;
//     // start: start;
//     // count: numPerPage;
//   }
//   // superagent.get(url)
//   //   .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
//   //   .then(resultsFromSuperAgent => {
//   //     console.log('results from superagent 101: ' + resultsFromSuperAgent)
//   //     let results = JSON.parse(resultsFromSuperAgent.text);
//   //     const yelpArray = results.businesses.map(yelp => {
//   //       return new Yelp(yelp);
//   //     })
//   //     response.status(200).send(yelpArray)
//   //   }).catch(err => console.log(err))
//   superagent.get(url)
//     .set('user-kkey', 'process.env.YELP_API_KEY}')
//     .query(queryParams)
//     .then(data => {
//       console.log('data from superagent', data.body);
//       let restaurantArray = data.body.restaurants;
//       console.log('this is my restaurant Array' + restaurantArray[0])
//       const finalRestaurants = restaurantArray.map(eatery => {
//         return new Restaaurant(eatery)
//       }
//     )
// })


function Restaurant(obj){

}

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

function Movie(obj) {
  this.title = obj.title;
  this.overview = obj.overview;
  this.average_votes = obj.average_votes;
  this.total_votes = obj.total_votes;
  this.image_url = obj.image_url;
  this.popularity = obj.popularity;
  this.released_on = obj.released_on;
}

function Yelp(obj) {
  this.name = obj.name ;
  this.image_url = obj.image_url ;
  this.price = obj.price ;
  this.rating = obj.rating ;
  this.url = obj.url ;
}

app.use('*', (request, response) => {
  response.status(404).send(ERROR404);
});

sqlClient.connect().then( () => {
  app.listen(PORT, () => {
    console.log(`listening on PORT: ${PORT}`);
  })
})
