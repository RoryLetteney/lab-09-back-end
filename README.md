# Project Name

**Author**: Rory Letteney
**Version**: 4.1.0

## Overview
This application takes in user input in the form of a city name, and returns the weather for said location.

## Getting Started
To use this app:
> `npm install`\
> `npm start`\
> Open `localhost:3000` in your browser\
> Enter a route, `localhost:3000/[route]`

To use the location route:\
`/location?data=[location]`

Examples:\
`/location?data=chicago`\
`/location?data=415 12th Ave, Cedar Rapids, IA`

To use the weather route:\
`/weather?data[latitude]=[location's latitude]&data[location's longitude]=longitude&data[id]=[location's database id]`

Example:\
`/weather?data[latitude]=41.8781136&data[longitude]=-87.6297982&data[id]=1`

To use the movies route:\
`/movies?data[query]=[location]&data[id]=[location's database id]`

Example:\
`/movies?data[query]=chicago&data[id]=1`

To use the yelp route:\
`/yelp?data[query]=[location]&data[id]=[location's database id]`

Example:\
`/yelp?data[query]=chicago&data[id]=1`

## Architecture
We are using JavaScript, NodeJS, Express, PostgreSQL, and CORS. Using NodeJS we first check PostgreSQL for existing data, and if none is found we make a request to the various APIs and store the data in the database. The requested information is then served to the user.

APIs used include:
> Google Maps\
> Dark Sky\
> The Movie Database\
> Yelp

## Change Log
04-23-2019 1:59pm - Application now has a fully-functional express server, with GET routes for the location resource and weather resource. Also handles status 500 errors.

04-24-2019 1:59pm - Application now has fully-functional calls to the Google Maps and Dark Sky APIs. Returns valid data dependant upon user input.

04-26-2019 1:59pm - Application now has a fully-functional call to the TMDb API. Returns valid data dependant upon user input.

04-27-2019 11:02am - Application now has a fully-functional call to the Yelp API. Returns valid data dependant upon user input.

## Credits and Collaborations
**Michele Saba** - https://github.com/MicheleSaba\

**Floyd Orr** - https://github.com/virtualmason\

**Skylar Monahan** - https://github.com/kmons2000\

**David Becker** - https://github.com/Meepedy

## Feature Time Estimates

### Feature #1
**Number and name of feature:** *Feature #1: Location Route*\
**Estimate of time needed to complete:** *1 hour*\
**Start time:** *9:36am*\
**Finish time:** *10:15am*\
**Actual time needed to complete:** *39 minutes*

### Feature #2
**Number and name of feature:** *Feature #2: Weather Route*\
**Estimate of time needed to complete:** *1 hour*\
**Start time:** *10:15am*\
**Finish time:** *10:48am*\
**Actual time needed to complete:** *33 minutes*

### Feature #3
**Number and name of feature:** *Feature #3: Status 500 Error Handling*\
**Estimate of time needed to complete:** *10 minutes*\
**Start time:** *11:05am*\
**Finish time:** *11:15am*\
**Actual time needed to complete:** *10 minutes*

### Feature #4
**Number and name of feature:** *Feature #4: Convert Location route to use API call*\
**Estimate of time needed to complete:** *????*\
**Start time:** *9:00am*\
**Finish time:** *12:30pm*\
**Actual time needed to complete:** *3 hours, 30 minutes*

### Feature #5
**Number and name of feature:** *Feature #5: Convert Weather route to use API call*\
**Estimate of time needed to complete:** *1 hour*\
**Start time:** *12:30pm*\
**Finish time:** *1:15pm*\
**Actual time needed to complete:** *45 minutes*

### Feature #6
**Number and name of feature:** *Feature #6: Database Setup*\
**Estimate of time needed to complete:** *1 hour*\
**Start time:** *9:00am*\
**Finish time:** *10:00am*\
**Actual time needed to complete:** *1 hour*

### Feature #7
**Number and name of feature:** *Feature #7: Check for SQL data first before API calls*\
**Estimate of time needed to complete:** *3 hours*\
**Start time:** *10:00am*\
**Finish time:** *1:15pm*\
**Actual time needed to complete:** *3 hours, 15 minutes*

### Feature #8
**Number and name of feature:** *Feature #8: Movies route, SQL table setup, and TMDb API call*\
**Estimate of time needed to complete:** *2 hours*\
**Start time:** *8:45am*\
**End time: 10**:*30am*\
**Actual time needed to complete:** *1 hour, 45 minutes*

### Feature #9
**Number and name of feature:** *Feature #9: Timeout*\
**Estimate of time needed to complete:** *30 minutes*\
**Start time:** *12:30pm*\
**End time: 1:**5*5pm*\
**Actual time needed to complete:** *1 hour, 25 minutes*

### Feature #10
**Number and name of feature:** *Feature #10: Yelp route, SQL table setup, and Yelp API call*\
**Estimate of time needed to complete:** *2 hours*\
**Start time:** *8:57am*\
**End time: 10**:*12am*\
**Actual time needed to complete:** *1 hour, 15 minutes*

### Feature #11
**Number and name of feature:** *Feature #11: Refactor timeout to be dynamic*\
**Estimate of time needed to complete:** *30 minutes*\
**Start time:** *10:18am*\
**End time: 10**:*24am*\
**Actual time needed to complete:** *6 minutes*