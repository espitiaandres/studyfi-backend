const express = require('express');
const router = express.Router();

router.get('*', (req, res) => {
    res.send('server is up and running here, added a proxy to overpass CORS error.');
})

module.exports = router;
