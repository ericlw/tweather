var Twitter = require('twit');
var request = require('request');
var config = require('./config');

var T = new Twitter(config);

// Stream of @mentions for @tweather_app
var stream = T.stream('statuses/filter', { track: '@tweather_app' })

// Attempting connection to streaming API
stream.on('connect', function (response) {
    console.log("Opening Twitter streaming connection.")
});

// Connection opened
stream.on("connected", function (response) {
    console.log("Streaming...")
});

// The @mentions
stream.on('tweet', function (tweet) {
    var geo = tweet.coordinates;

    if (geo && geo.type == 'Point') {
        var lat = geo.coordinates[1];
        var lon = geo.coordinates[0];

        request("http://api.openweathermap.org/data/2.5/forecast/daily?lat=" + lat + "&lon=" + lon + "&cnt=1&mode=json&units=imperial",
            function (err, response, body) {
                if (err) {
                    return console.log("Error getting weather for lat=" + lat + " & lon=" + lon, err);
                }

                var weather = JSON.parse(body);

                var status = "The forecast for " + weather.city.name + " today is " + weather.list[0].weather[0].main +
                    " with high of " + weather.list[0].temp.max + " and a low of " + weather.list[0].temp.min;

                T.post('statuses/update', { status: status }, function (err, data, response) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(data);
                    }
                });
            });
    } else {
        // Not doing anything for these right now. Should parse tweet looking for a city name/zip code/ etc later
        console.log("Received a non geo-located @ mention...")
    }
});
