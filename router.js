const express = require('express');
const router = express.Router();

router.get('*', (req, res) => {
    res.send('server is up and running here...proxy blink182?????');
})

module.exports = router;
