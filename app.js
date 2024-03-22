const express = require('express');
const app = express();
const mongoose = require('mongoose');
const axios = require('axios');
const FB = require('fb');
const passport = require('passport');
const FacebookTokenStrategy = require('passport-facebook-token');
const execSync = require('child_process').execSync;

const urI = 'mongodb+srv://devrious:Uzumaki%4045@templates.knku2v7.mongodb.net/scraper?retryWrites=true&w=majority';

let access_token = '';

function extractHashtags(text) {
    if (!text) {
        return [];
    }

    // Regular expression to match hashtags
    const regex = /#[^\s#]*/g;

    // Extract hashtags from text
    const hashtags = text.match(regex);

    // Return the extracted hashtags
    return hashtags || [];
}

passport.use(new FacebookTokenStrategy({
    clientID: '896736762233559',
    clientSecret: '2536cd7e3600a7159a4863b2c9dc3962'
}, function (accessToken, refreshToken, profile, done) {
    done(null, profile);
}));

const pauseTime = (time) => {
    return new Promise(resolve => setTimeout(resolve, time));
};

function sleep(seconds) {
    console.log("Wait a day!");
    execSync(`sleep ${seconds}`);
}

const uploadVideo = (accessToken, videoData, description) => {
    FB.setAccessToken('EAAMvk8wrgtcBO9lTaDt4lEbF79k3NebM0kY9m7bP7Rdj8GJkjv3qFl753IaUjwblt07yyy9j7r4fLgvxN2uSB9ggjmKunYPLrcHLftCFPtBciBeD6rVNbxUIbmbsSfeMxBWIklSoonBJEzW4jdPkKUYJLoHhPuMPi3hkUG4HdOuwTE4ucHuj84xEmeQZD');

    const formData = {
        file_url: videoData,
        description: description
    };

    FB.api(
        '/me/videos',
        'POST',
        formData,
        function (res) {
            if (!res || res.error) {
                console.log(!res ? 'error occurred' : res.error);
                return;
            }
        }
    );
    console.log('done');
};

mongoose.connect(urI);

const linkSchema = new mongoose.Schema({
    link: {
        type: String,
        required: true
    },
    caption: [{
        type: String
    }]
});

const Link = mongoose.model('link', linkSchema);

app.set('view engine', 'ejs');
app.set('views', 'views');

app.get('/add', async function (req, res) {
    res.end();

    var reqCount = 1;

    const users = ['devanjeesuhanya', 'thiyasha_p', 'osandi_24'];
    users.forEach(async (user) => {
        await pauseTime(1000);
        const options = {
            method: 'GET',
            url: 'https://tiktok-scraper7.p.rapidapi.com/user/posts',
            params: {
                unique_id: user,
                count: '1000'
            },
            headers: {
                'X-RapidAPI-Key': 'f34902baffmsh4d26ee5486241d5p188ddfjsnf62ba6a713ab',
                'X-RapidAPI-Host': 'tiktok-scraper7.p.rapidapi.com'
            }
        };

        try {
            const response = await axios.request(options);
            response.data.data.videos.forEach(async video => {
                console.log(reqCount);
                if (reqCount > 199) {
                    reqCount = 1;
                    sleep(86400000);
                    Link.findOne({ link: video.video_id }).then(async result => {
                        await pauseTime(1000);
                        if (result) {
                            return;
                        } else {
                            const url = 'https://www.tiktok.com/@' + user + '/video/' + video.video_id;
                            const options1 = {
                                method: 'GET',
                                url: 'https://tiktok-full-info-without-watermark.p.rapidapi.com/vid/index',
                                params: {
                                    url: url
                                },
                                headers: {
                                    'X-RapidAPI-Key': 'f34902baffmsh4d26ee5486241d5p188ddfjsnf62ba6a713ab',
                                    'X-RapidAPI-Host': 'tiktok-full-info-without-watermark.p.rapidapi.com'
                                }
                            };

                            try {
                                const response = await axios.request(options1);
                                const hashtagsList = await extractHashtags(video.title);
                                const livkID = new Link({
                                    link: video.video_id,
                                    caption: hashtagsList
                                });
                                await livkID.save();
                                const hashtags = hashtagsList.join(' ');
                                uploadVideo(access_token, response.data.video[0], hashtags);
                            } catch (error) {
                                console.error(error);
                            }
                        }
                    });
                    reqCount++;
                } else {
                    Link.findOne({ link: video.video_id }).then(async result => {
                        sleep(1000);
                        if (result) {
                            return;
                        } else {
                            const url = 'https://www.tiktok.com/@' + user + '/video/' + video.video_id;
                            const options1 = {
                                method: 'GET',
                                url: 'https://tiktok-full-info-without-watermark.p.rapidapi.com/vid/index',
                                params: {
                                    url: url
                                },
                                headers: {
                                    'X-RapidAPI-Key': 'f34902baffmsh4d26ee5486241d5p188ddfjsnf62ba6a713ab',
                                    'X-RapidAPI-Host': 'tiktok-full-info-without-watermark.p.rapidapi.com'
                                }
                            };

                            try {
                                const response = await axios.request(options1);
                                const hashtagsList = await extractHashtags(video.title);
                                const livkID = new Link({
                                    link: video.video_id,
                                    caption: hashtagsList
                                });
                                await livkID.save();
                                const hashtags = hashtagsList.join(' ');
                                uploadVideo(access_token, response.data.video[0], hashtags);
                            } catch (error) {
                                console.error(error);
                            }
                        }
                    });
                    reqCount++;
                }
            });
        } catch (error) {
            console.error(error);
        }
    });
});

app.get('/', function (req, res) {
    const url = `https://graph.facebook.com/oauth/access_token?client_id=896736762233559&client_secret=2536cd7e3600a7159a4863b2c9dc3962&grant_type=client_credentials`;
    fetch(url)
        .then(res => res.json())
        .then((json) => {
            access_token = json.access_token;
            res.redirect('/add');
        })
        .catch(err => console.error('Error fetching access token:', err));
});

app.listen(process.env.PORT || 5000);