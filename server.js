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
  MOVIE_API_KEY = process.env.MOVIE_API_KEY,
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

// CREATE MOVIES ROUTE
app.get('/movies', (req, res) => {
  // getQuery(req, res, Movie.fetchMovies, 'movies', 'location_id');
  Movie.fetchMovies();
});

// HANDLERS
const timeouts = {
  weather: 15 * 1000
};

const getQuery = (req, res, callback, table, tableQuery) => {
  const queryHandler = {
    query: req.query.data,
    cacheHit: results => {
      if (table === 'weather') {
        let ageOfResults = (Date.now() - results[0].time);
        if (ageOfResults > timeouts.weather) {
          deleteById('weather', results.row[0].id);
          queryHandler.cacheMiss();
        } else {
          console.log('Got data from sql');
          res.send(results.rows[0]);
        }
      } else {
        console.log('Got data from sql');
        res.send(results.rows[0]);
      }
    },
    cacheMiss: () => {
      console.log('No data from sql');
      callback(req.query.data)
        .then(data => res.send(data));
    }
  };

  lookupData(queryHandler, table, tableQuery);
};

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

const deleteById = (table, id) => {
  const SQL = `DELETE FROM ${table} WHERE id=${id}`;
  return client.query(SQL);
};

// LOCATION ROUTE COMPONENTS
function Location(query, res) {
  this.query = query,
  this.formatted_query = res.formatted_address,
  this.latitude = res.geometry.location.lat,
  this.longitude = res.geometry.location.lng;
}

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

// WEATHER ROUTE COMPONENTS
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

// MOVIES ROUTE COMPONENTS
function Movie(location, res) {
  this.title = res.title,
  this.overview = res.overview,
  this.average_votes = res.vote_average,
  this.total_votes = res.vote_count,
  this.image_url = res.homepage + res.poster_path,
  this.popularity = res.popularity,
  this.released_on = res.release_date;
}

Movie.fetchMovies = query => {
  const URL = `https://api.themoviedb.org/3/movie/76341?api_key=${MOVIE_API_KEY}`;

  return superagent.get(URL)
    .then(res => {
      console.log('Got something from TMDb!');
      return console.log(res.body);
    });
};

app.listen(PORT, () => console.log(`App is up and running on ${PORT}`));
