'use strict';

const superagent = require('superagent');
require('dotenv').config();
const pg = require('pg');
const cors = require('cors');
const express = require('express'),
  app = express(),
  PORT = process.env.PORT || 3000,
  WEATHER_API_KEY = process.env.WEATHER_API_KEY,
  GEOCODE_API_KEY = process.env.GEOCODE_API_KEY,
  DATABASE_URL = process.env.DATABASE_URL;

app.use(cors());

const client = new pg.Client(DATABASE_URL);
client.connect();
client.on('err', err => console.log(err));

// CREATE LOCATION ROUTE
app.get('/location', (req, res) => {
  // searchToLatLong(req.query.data, res);
  getQuery(req, res, Location.fetchLocation, 'locations', 'search_query');
});

// CREATE WEATHER ROUTE
app.get('/weather', (req, res) => {
  getQuery(req, res, Weather.fetchWeather, 'weather', 'location_id');
});

const getQuery = (req, res, callback, table, tableQuery) => {
  const queryHandler = {
    query: req.query.data,
    cacheHit: results => {
      console.log('Got data from sql');
      res.send(results.rows[0]);
    },
    cacheMiss: () => {
      console.log('No data from sql');
      callback(req.query.data)
        .then(data => res.send(data));
    }
  };

  lookupData(queryHandler, table, tableQuery);
};

// CREATE A NEW LOCATION OBJECT FOR THE USER'S QUERY
// const searchToLatLong = (request, response) => {
//   let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request}&key=${GEOCODE_API_KEY}`;
//   return superagent.get(url)
//     .then(res => {
//       response.send(new Location(request, res));
//     }).catch(error => {
//       response.status(500).send('Please enter a valid location!');
//     });
// };

function Location(query, res) {
  this.query = query,
  this.formatted_query = res.formatted_address,
  this.latitude = res.geometry.location.lat,
  this.longitude = res.geometry.location.lng;
}

const lookupData = (handler, table, tableQuery) => {
  const SQL = `SELECT * FROM ${table} WHERE ${tableQuery}=$1;`;
  const values = [table === 'locations' ? handler.query : handler.query.id];

  return client.query(SQL, values)
    .then(results => {
      if(results.rowCount > 0) {
        handler.cacheHit(results);
      } else {
        handler.cacheMiss();
      }
    }).catch(error => {
      console.log(error);
    });
};

Location.fetchLocation = query => {
  const URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GEOCODE_API_KEY}`;

  return superagent.get(URL)
    .then(res => {
      console.log('I got something from Google');
      if(!res.body.results.length) {
        throw 'No data from Google';
      } else {
        let location = new Location(query, res.body.results[0]);
        return location.save()
          .then(result => {
            location.id = result.rows[0].id;
            return location;
          });
      }
    }).catch(error => {
      console.log(error);
    });
};

Location.prototype.save = function() {
  const SQL = `INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES($1,$2,$3,$4) RETURNING id`;
  let values = Object.values(this);
  return client.query(SQL, values);
};

// RETURN ALL WEATHER RECORDS FOR THE USER'S LOCATION QUERY
// const getWeather = (request, response) => {
//   const url = `https://api.darksky.net/forecast/${WEATHER_API_KEY}/${request.query.lat},${request.query.lng}`;
//   return superagent.get(url)
//     .then(res => {
//       const weatherArray = res.body.daily.data.map(day => new Weather(day));
//       response.send(weatherArray);
//     }).catch(error => {
//       response.status(500).send('Please enter a valid location!');
//     });
// };

function Weather(day) {
  this.forecast = day.summary,
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

Weather.fetchWeather = query => {
  const URL = `https://api.darksky.net/forecast/${WEATHER_API_KEY}/${query.lat},${query.lng}`;

  return superagent.get(URL)
    .then(res => {
      console.log('Got something from Dark Sky!');
      if (!res.body.daily.data.length) {
        throw 'No data from Dark Sky';
      } else {
        return res.body.daily.data.map(day => {
          let forecast = new Weather(day);
          forecast.save(query.id);
          return forecast;
        });
      }
    });
};

Weather.prototype.save = function(locationID) {
  const SQL = `INSERT INTO weather (forecast, time, location_id) VALUES($1,$2,$3) RETURNING id`;
  let values = Object.values(this);
  values.push(locationID);
  return client.query(SQL, values);
};

app.listen(PORT, () => console.log(`App is up and running on ${PORT}`));

const errorHandler = (res, status, message) => res.send({ status, message });
