const superagent = require('superagent');
const { sqlClient, Location } = require("../server");
function locationHandler(request, response) {
  let city = request.query.city;
  // console.log('this is my city' + city);
  let sqlQuery = 'SELECT search_query, formatted_query, latitude, longitude FROM cities WHERE search_query like $1;';
  const safeValues = [city];
  sqlClient.query(sqlQuery, safeValues)
    .then(sqlResult => {
      // console.log(sqlResult.rows);
      if (sqlResult.rowCount) {
        // console.log('call superagent');
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
      else {
        console.log('send the sqlResult back to the client');
      }
    })
    .catch(err => console.log(err));
}
exports.locationHandler = locationHandler;
