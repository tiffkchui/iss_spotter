const request = require('request');

/* makes a single API request to retrieve the user's IP address.Input:
 * a callback (to pass back an error or the IP string)
 * returns (via Callback):
 * an error, if any (nullable)
 * the IP address as a string (null if error). Example: "162.245.144.188"
 * use request to fetch IP address from JSON API */
const fetchMyIP = function(callback) {

  const ipifyUrl = 'https://api.ipify.org?format=json';
  request(ipifyUrl, (error, response, body) => {

    /* inside the request callback ...
    /* error can be set if there is an invalid domain, user is offline, etc. */
    if (error) {
      callback(error, null);
      return;
    }

    /* if a non-200 status code is sent back from the server, assume there is a server error
     * force the error to be sent to the callback as the first incoming paramater */
    if (response.statusCode !== 200) {
      const msg = `${response.statusCode} wasencountered when fetching IP. Response: ${body}`;
      callback(Error(msg), null);
      return;
    }

    /* if we get here, all's well and we got the data
     * call our callback function from line 4 of our index.js and pass it out any errors or the body from our http request
     * parse the IP as JSON to be interpereted later
     * force the formatted ipAddress to be sent to the callback as the first incoming paramater */
    const ipAddress = JSON.parse(body).ip;
    callback(null, ipAddress);
  });
};


/* function that makes a single API request to retrieve the user's geo location based on their IP address.
 * in the function, make the request to the API, and have it pass back the relevant (lat/lng) data as an object via callback.
 * https://freegeoip.app/json/216.180.65.66?callback=test */
const fetchCoordsByIP = function(ip, callback) {

  const geoLocationUrl = `https://freegeoip.app/json/${ip}`;

  request(geoLocationUrl, (error, response, body) => {

    /* inside the request callback ...
     * error can be set if there is an invalid domain, user is offline, etc.
     * remember these callbacks go back into the nextISSTimesForMyLocation() function we passed here as an incoming param! */
    if (error) {
      callback(error, null);
      return;
    }

    /* if a non-200 status code is sent back from the server, assume there is a server error
     * force the error to be sent to the callback as the first incoming paramater */
    if (response.statusCode !== 200) {
      const msg = `${response.statusCode} wasencountered when fetching IP. Response: ${body}`;
      callback(Error(msg), null);
      return;
    }

    // parse the .latitute and .long in the JSOn object returned from the.replace(/(?:\[rn])+/g, '')
    const parsedBody = JSON.parse(body);
    const latLong = {lat: parsedBody.latitude, long: parsedBody.longitude};
    callback(null, latLong);
  });
};

/**
 * Makes a single API request to retrieve upcoming ISS fly over times the for the given lat/lng coordinates.
 * Input:
 *   - An object with keys `latitude` and `longitude`
 *   - A callback (to pass back an error or the array of resulting data)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly over times as an array of objects (null if error). Example:
 *     [ { risetime: 134564234, duration: 600 }, ... ]
 */
const fetchISSFlyOverTimes = function(coords, callback) {
  
  const flyoverUrl = `http://api.open-notify.org/iss-pass.json?lat=${coords.lat}&lon=${coords.long}`;
  
  request(flyoverUrl, (error, response, body) => {

    /* inside the request callback ...
     * error can be set if there is an invalid domain, user is offline, etc. */
    if (error) {
      callback(error, null);
      return;
    }

    /* if a non-200 status code is sent back from the server, assume there is a server error
     * force the error to be sent to the callback as the first incoming paramater */
    if (response.statusCode !== 200) {
      const msg = `${response.statusCode} wasencountered when fetching IP. Response: ${body}`;
      callback(Error(msg), null);
      return;
    }

    callback(null, JSON.parse(body));
  });
};

// master function to deal deal with the "waterfall" of API calls inside of fetchMyIP(), fetchCoordsByIP(), fetchISSFlyOverTimes() nested inside
const nextISSTimesForMyLocation = function(callback) {

 /* call fetchMyIP() passin in the below "waterfall" callback function as its one and only paramater
  * remember "error" and "ip" are the arguments returned from the callback inside of fetchMyIP as the two incoming paramaters of the 
  * anon function here on line 112 */
  fetchMyIP((error, ip) => {

    // remember these callbacks go out to the callback function that we sent as an incoming paramater on line 113, back into our index.js!
    if (error) {
      callback(error, null)
      return;
    }

    // call and use fetchCoordsByIP function and feed it the IP address we got back from that server that "fell through" from above
    fetchCoordsByIP(ip, (error, latLong) => {
      
      // remember these callbacks go out to the callback function that we sent as an incoming paramater on line 106 back indo our index.js!
      if (error) {
        callback(error, null)
        return;
      }

      // call and use fetchISSFlyOverTimes function and feed it the latlongf etchCoordsByIP() returned
      fetchISSFlyOverTimes(latLong, (error, flyoverTimes) => {
        
        // remember these callbacks go out to the callback function that we sent as an incoming paramater on line 106 back indo our index.js!
        if (error) {
          callback(error, null)
          return;
        }
        
        /* bottom layer of callbacks! if all above error checks passed, return the final flyoverTimes JSON to the callback function passed in to nextISSTimesForMyLocation
         * to be printed later */
        callback(null, flyoverTimes);
      });
    });  
  });    
};

// export the function fetchMyIP to be called and used at the index
module.exports = { nextISSTimesForMyLocation : nextISSTimesForMyLocation };