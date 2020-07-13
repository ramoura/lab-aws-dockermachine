const express = require('express')

const app = express();

app.get('/health', (req, res) => res.send("ok"));
app.get('/', (req, res) => res.send("Now: "+ new Date()));

app.listen(3000);
