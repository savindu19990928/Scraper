const express = require('express');
const app = express();
const mongoose = require('mongoose');
const multer = require('multer');
const TikTokScraper = require('tiktok-scraper');
const { Buffer } = require('buffer');

const urI = 'mongodb+srv://devrious:Uzumaki%4045@templates.knku2v7.mongodb.net/scraper?retryWrites=true&w=majority';

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


app.listen(process.env.PORT || 5000);