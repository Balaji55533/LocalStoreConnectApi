require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const cors = require('cors');
require("./config/dbconnect")
const router = express.Router();
 
app.use(express.json()); 
app.use(cors())
app.use(express.urlencoded({ extended: true }));

app.use('/api', require('./routes/useroute')); 
app.use('/api', require('./routes/businessownerroute'));
app.use('/.netlify/function/api',router );

app.listen(PORT, () => { console.log(`Listening on port ${PORT}`) });   