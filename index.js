const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const cors = require('cors');
require("./config/dbconnect")
 
app.use(express.json()); 
app.use(cors())
app.use(express.urlencoded({ extended: true }));

app.use('/api', require('./routes/useroute')); 
app.use('/api', require('./routes/businessownerroute'));
app.use('/api', require('./routes/category'));
app.use('/api', require('./routes/subcategory'));
app.use('/api', require('./routes/postroute'));


app.listen(PORT, () => { console.log(`Listening on port ${PORT}`) });   