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
  YELP_API_KEY = process.env.YELP_API_KEY,
  DATABASE_URL = process.env.DATABASE_URL;

app.use(cors());

const client = new pg.Client(DATABASE_URL);
client.connect();
client.on('err', err => console.log(err));

// CREATE LOCATION ROUTE
app.get('/location', (req, res) => {
  getQuery(req, res, Location.fetchLocation, 'locations', 'search_query');
});

// CREATE WEATHER ROUTE
app.get('/weather', (req, res) => {
  getQuery(req, res, Weather.fetchWeather, 'weather', 'location_id');
});

// CREATE MOVIES ROUTE
app.get('/movies', (req, res) => {
  getQuery(req, res, Movie.fetchMovies, 'movies', 'location_id');
});

// CREATE YELP ROUTE
app.get('/yelp', (req, res) => {
  getQuery(req, res, Restaurant.fetchRestaurants, 'restaurants', 'location_id');
});

// HANDLERS
const timeouts = {
  weather: 15 * 1000,
  movies: 15 * 1000
};

const getQuery = (req, res, callback, table, tableQuery) => {
  const queryHandler = {
    query: req.query.data,
    cacheHit: results => {
      if (table === 'weather') {
        let ageOfResults = (Date.now() - results.rows[0].created_at);
        if (ageOfResults > timeouts.weather) {
          results.rows.forEach(row => {
            deleteById('weather', row.id);
          });
          queryHandler.cacheMiss();
        } else {
          console.log('Got data from sql');
          res.send(results.rows);
        }
      } else {
        console.log('Got data from sql');
        res.send(results.rows);
      }
    },
    cacheMiss: () => {
      console.log('No data from sql');
      callback(queryHandler.query)
        .then(data => res.send(data));
    }
  };

  lookupData(queryHandler, table, tableQuery);
};

const lookupData = (handler, table, tableQuery) => {
  const SQL = `SELECT * FROM ${table} WHERE ${tableQuery}=$1;`;
  const values = [table !== 'locations' ? handler.query.id : handler.query];

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
  this.longitude = res.geometry.location.lng,
  this.created_at = Date.now();
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
  const SQL = `INSERT INTO locations (search_query, formatted_query, latitude, longitude, created_at) VALUES($1,$2,$3,$4,$5) RETURNING id`;
  let values = Object.values(this);
  return client.query(SQL, values);
};

// WEATHER ROUTE COMPONENTS
function Weather(day) {
  this.forecast = day.summary,
  this.time = new Date(day.time * 1000).toString().slice(0, 15),
  this.created_at = Date.now();
}

Weather.fetchWeather = query => {
  const URL = `https://api.darksky.net/forecast/${WEATHER_API_KEY}/${query.latitude},${query.longitude}`;
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
    }).catch(error => {
      console.log(error);
    });
};

Weather.prototype.save = function(locationID) {
  const SQL = `INSERT INTO weather (forecast, time, created_at, location_id) VALUES($1,$2,$3,$4) RETURNING id`;
  let values = Object.values(this);
  values.push(locationID);
  return client.query(SQL, values);
};

// MOVIES ROUTE COMPONENTS
function Movie(location, res) {
  this.location = location,
  this.title = res.title,
  this.overview = res.overview,
  this.average_votes = res.vote_average,
  this.total_votes = res.vote_count,
  this.image_url = res.homepage + res.poster_path,
  this.popularity = res.popularity,
  this.released_on = res.release_date,
  this.created_at = Date.now();
}

Movie.fetchMovies = query => {
  const URL = `https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_API_KEY}&language=en-US&query=${query.query}`;

  return superagent.get(URL)
    .then(res => {
      console.log('Got something from TMDb!');
      if (!res.body.results.length) {
        throw 'No data from TMDb';
      } else {
        return res.body.results.map(movie => {
          const newMovie = new Movie(query.query, movie);
          newMovie.save(query.id);
          return newMovie;
        });
      }
    }).catch(error => {
      console.log(error);
    });
};

Movie.prototype.save = function(locationID) {
  const SQL = `INSERT INTO movies (location, title, overview, average_votes, total_votes, image_url, popularity, released_on, created_at, location_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`;
  let values = Object.values(this);
  values.push(locationID);
  return client.query(SQL, values);
};

// YELP ROUTE COMPONENTS
function Restaurant(res) {
  this.name = res.name,
  this.image_url = res.image_url,
  this.price = res.price,
  this.rating = res.rating,
  this.url = res.url,
  this.created_at = Date.now();
}

Restaurant.fetchRestaurants = query => {
  const URL = `https://api.yelp.com/v3/businesses/search?location=${query.query}&limit=20`;

  return superagent.get(URL)
    .set('Authorization', `Bearer ${YELP_API_KEY}`)
    .then(res => {
      return res.body.businesses.map(business => {
        const restaurant = new Restaurant(business);
        restaurant.save(query.id);
        return restaurant;
      });
    });
};

Restaurant.prototype.save = function(locationID) {
  const SQL = `INSERT INTO restaurants (name, image_url, price, rating, url, created_at, location_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`;
  const values = Object.values(this);
  values.push(locationID);
  return client.query(SQL, values);
};

app.listen(PORT, () => console.log(`App is up and running on ${PORT}`));
