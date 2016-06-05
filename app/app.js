var Twitter = require('twit');
var request = require('request');
var config = require('./config');
var fs = require("fs");
var twitter = new Twitter(config);

// Stream of @mentions for weather_account
var stream = twitter.stream('statuses/filter', { track: config.weather_account });

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
    try {
        handleTweet(tweet);
    } catch (err) {
        console.log("Unexpected error handling tweet: ", tweet)
    }
});

function respondToTweetWithWeather(tweet, weather) {
    var status = "@" + tweet.user.screen_name;
    if (weather.cod == 200) {
        status += " the forecast for " + weather.name +
            " today is " + weather.weather[0].main.toLowerCase() +
            " with a high of " + weather.main.temp_max + " and a low of " + weather.main.temp_min;

        getWeatherIcon(weather.weather[0].icon, function(mediaIdStr){
            postStatusUpdateWithMedia(status, mediaIdStr, tweet);
        });

    } else if (weather.cod == 401) { //unauthorized
        status += weather.message;

        postStatusUpdate(status, tweet);

    } else if (weather.cod == 404) {
        status += " sorry, we could not seem to locate that city :( Please try again!"

        postStatusUpdate(status, tweet);

    } else {
        status += " I cannot seem to find where you want the weather for. " +
            "Please include a zip code or geo-tag your tweet!";

        postStatusUpdate(status, tweet);
    }
    
}

function postStatusUpdate(status, tweet) {
    twitter.post('statuses/update', { status: status, in_reply_to_status_id: tweet.id_str }, function (err, data, response) {
    //console.log("status: "+ status)
        if (err) {
            console.log(err);
        } else {
            console.log(data);
        }
    });
}

function postStatusUpdateWithMedia(status, media_id, tweet){
twitter.post('statuses/update', { status: status, in_reply_to_status_id: tweet.id_str, media_ids: [media_id]}, function (err, data, response) {
    //console.log("status: "+ status)
        if (err) {
            console.log(err);
        } else {
            console.log(data);
        }
    });

}

function getWeather(query, callback) {
    request("http://api.openweathermap.org/data/2.5/weather?units=imperial&" + query + "&APPID=" + config.open_weather_appid, function (err, response, body) {
        if (err) {
            console.log("Error getting weather for lat=" + lat + " & lon=" + lon, err);
            return
        }
        var weather = JSON.parse(body);
        //console.log("body: " + body);
        callback(weather);
    });
}

function getWeatherIcon(query, callback){
   
    var b64content = fs.readFileSync('./images/'+query+'.png', { encoding: 'base64' })

    twitter.post('media/upload', {media_data: b64content}, function (err, data, response) {
         // now we can assign alt text to the media, for use by screen readers and
         // other text-based presentations and interpreters
        if(err){
         console.log("media/upload error: " + err);
         return
        }

        var mediaIdStr = data.media_id_string;
        var altText = "Weather status";
        var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }

      twitter.post('media/metadata/create', meta_params, function (err, data, response) {
            if (err) {
              console.log("Error creating tweet image attachment. error: " + err + ", data: " + data);
              return
            }  
            callback(mediaIdStr);
       });
    });
}

function extractCityOrZip(str) {
    var re = /\d{5}/g;
    return  re.exec(str);
}

function resolveZipCode(zip, callback) {
    request("http://zip.getziptastic.com/v2/US/" + zip, function (err, response, body) {
        if (err) {
            return console.log("Error getting resolving zip code " + zip);
        }
        var city = JSON.parse(body).city;
        callback(city);
    });
}

function handleTweet(tweet) {
    var query;
    var zip = extractCityOrZip(tweet.text);
    //console.log("original tweet: " + tweet.text + ", zip: " + zip);
    if (zip) {
        request("http://zip.getziptastic.com/v2/US/" + zip, function (err, response, body) {
            if (err) {
                console.log("Error resolving zip code")
            }
            try {
                var location = JSON.parse(body);
                var city = "q=" + location.city + "," + location.country;
            } catch (ex) {
            }
            getWeather(city, function (weather) {

                respondToTweetWithWeather(tweet, weather)
            });
        });
    } else {
        var geo = tweet.coordinates;
        if (geo && geo.type == 'Point') {
            var lat = geo.coordinates[1];
            var lon = geo.coordinates[0];
            query = "lat=" + lat + "&lon=" + lon;
        }
        getWeather(query, function (weather) {
            respondToTweetWithWeather(tweet, weather)
        });
    }
}
