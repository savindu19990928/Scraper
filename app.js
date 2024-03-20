const express = require('express');
const app = express();
const mongoose = require('mongoose');
const multer = require('multer');
const { Buffer } = require('buffer');
const axios = require('axios');

const urI = 'mongodb+srv://devrious:Uzumaki%4045@templates.knku2v7.mongodb.net/scraper?retryWrites=true&w=majority';

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
    const users = ['devanjeesuhanya'];

    users.forEach(async (user) => {
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
                Link.findOne({ link: video.video_id }).then(result => {
                    if (result) {
                        return;
                    } else {
                        const livkID = new Link({
                            link: video.video_id,
                            caption: extractHashtags(video.title)
                        });
                        livkID.save();
                    }
                });
            });
        } catch (error) {
            console.error(error);
        }
    });

    // const options1 = {
    //     method: 'GET',
    //     url: 'https://tiktok-api20.p.rapidapi.com/tiktok/',
    //     params: {
    //         url: url
    //     },
    //     headers: {
    //         'X-RapidAPI-Key': 'f34902baffmsh4d26ee5486241d5p188ddfjsnf62ba6a713ab',
    //         'X-RapidAPI-Host': 'tiktok-api20.p.rapidapi.com'
    //     }
    // };

    // try {
    //     const response = await axios.request(options1);
    //     console.log(response.data.result.url);
    // } catch (error) {
    //     console.error(error);
    // }

    return res.end();
});

app.listen(process.env.PORT || 5000);