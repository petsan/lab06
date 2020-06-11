import { get } from 'superagent';
import { Weather } from '../server';
export function weatherHandler(request, response) {
  let city = request.query.search_query;
  let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${process.env.WEATHER_API_KEY}&days=8`;
  get(url)
    .then(resultsFromSuperAgent => {
      const weatherArray = resultsFromSuperAgent.body.data.map(day => {
        return new Weather(day);
      });
      response.status(200).send(weatherArray);
    }).catch(err => console.log(err));
}
