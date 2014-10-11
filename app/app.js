var Twitter = require('twit');
var request = require('request');
var config = require('./config');

var twitter = new Twitter(config);

// Stream of @mentions for @tweather_app
var stream = twitter.stream('statuses/filter', { track: '@tweather_app' });

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
    handleTweet(tweet);
});

function handleTweet(tweet) {
    var weather, status;
    var zip = extractCityOrZip(tweet.text);
    if (zip) {
        getWeather(zip, function (data) {
            if (data) {
                weather = data;
            }
        });
    } else {
        var geo = tweet.coordinates;
        if (geo && geo.type == 'Point') {
            var lat = geo.coordinates[1];
            var lon = geo.coordinates[0];
            var query = "lat=" + lat + "&lon=" + lon;
            getWeather(query, function (data) {
                if (data) {
                    weather = data;
                }
            });
        }
    }
    if (weather) {
        status = "@" + tweet.user.screen_name + " the forecast for " + weather.name +
            " today is " + weather.weather[0].main.toLowerCase() +
            " with a high of " + weather.main.temp_max + " and a low of " + weather.main.temp_min;
    } else {
        status = "@" + tweet.user.screen_name + " I cannot seem to find where you want the weather for. " +
        "Please include a zip code or geo-tag your tweet!";
    }
    twitter.post('statuses/update', { status: status, in_reply_to_status_id: tweet.id_str }, function (err, data, response) {
        if (err) {
            console.log(err);
        } else {
            console.log(data);
        }
    });
}

function getWeather(query, callback) {
    request("http://api.openweathermap.org/data/2.5/weather?units=imperial&q=" + query, function (err, response, body) {
        if (err) {
            return console.log("Error getting weather for lat=" + lat + " & lon=" + lon, err);
        }
        var weather = JSON.parse(body);
        callback(weather);
    });
}

function extractCityOrZip(str) {
    var re = /\d{5}/g;

    return  re.exec(str);
}
