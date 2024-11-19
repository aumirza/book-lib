const Libgen = require('../utils/libgen')

const router = require('express').Router()

router.get('/', (req, res) => {
    res.json({ message: 'Success' })
})

router.get('/search/:query', async (req, res) => {

    const libgen = new Libgen()

    const books = await libgen.search({ query: query, count: 10 })

    res.json({ books })
})
module.exports = router