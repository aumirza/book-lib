const mirrors = [
    {
        baseUrl: "http://gen.lib.rus.ec",
        canDownloadDirect: false
    },
    {
        baseUrl: "http://libgen.is",
        // if true, '/get.php?md5=' works
        canDownloadDirect: true
    }
]

// TODO: this is pretty brittle; if libgen changes how they format results it
// will break
const LATEST_ID_REGEX = /<td>[0-9]+<\/td>/g

// Regex for {x} files found
const RESULT_REGEX = /([0-9]\w+) (?:[A-z]{5}) (?:[A-z]{5})/gi


class libgen {

    _mirror: string;

    constructor() {
        const mirror = mirrors[0].baseUrl
        this._mirror = mirror
    }

    async latest(): Promise<BookDetails | Error> {

        try {
            const latestId = await this.getLatestIDs()
            const latest = await this.fetchByIds([latestId as Number])

            return latest
        } catch (error) {
            return error
        }
    }

    async search(options: SearchOption): Promise<Array<BookDetails>> {
        try {
            const queryUrl = this.makeQueryUrl(options)
            const ids = await this.fetchIds(queryUrl)
            const searchIds = this.processIds(ids, options)
            const data = await this.fetchByIds(searchIds)

            return data
        } catch (err) {
            return err
        }
    }

    async getLatestIDs(count = 1): Promise<Number | Error> {
        const url = `${this._mirror}/search.php?mode=last`

        try {
            const response = await fetch(url)
            const raw = await response.text()
            const idsResults = raw.match(LATEST_ID_REGEX)

            // TODO: Splice array according to count
            const latestId = idsResults[0].replace(/[^0-9]/g, "")

            return parseInt(latestId)

        } catch (err) {
            return err
        }
    }

    async random(count: Number) {

        //TODO: this is mess

        try {
            const ids = await this.getLatestIDs()
            count = count ?? 1

            let texts = []

            while (texts.length < count) {
                let picks = []
                let n = count
                let fields;
                const data = this.fetchByIds(picks)

                return data
            }

        } catch (err) {
            return err
        }
    }

    async canDownload(text) {
        const md5 = text.md5 ? text.md5.toLowerCase() : text.toLowerCase()

        const urls = mirrors.filter(mirror => mirror.canDownloadDirect)
            .map(mirror => `${mirror.baseUrl}/get.php?md5=${md5}`)

        try {
            const fastestUrl = await this.fastest(urls)
            return fastestUrl
        } catch (err) {
            return err
        }
    }

    private async connectionTime(url: string) {

        const start = Date.now()
        try {
            const response = await fetch(url, { mode: 'no-cors' })
            const results = { url: url, time: Date.now() - start }
            return results

        } catch (err) {
            // async.map will fail if any of the timeConnections returns an error, but
            // we only care that at least one succeeds; so fail silently
            console.error(err)
        }
    }

    private async fastest(urls: Array<string>) {

        const speedTests = urls.map(async (url) => await this.connectionTime(url))
        const results = await Promise.all(speedTests)

        const noResponses = results.every(value => !value)
        if (noResponses)
            return new Error("Bad response from all mirrors")

        // sort by time
        const sorted = results.sort((a, b) => a.time - b.time)
        // return the fastest
        return sorted[0].url
    }

    // Returns the fastest mirror available
    async getMirror() {

        const urls = mirrors.map(mirror => `${mirror.baseUrl}/json.php?ids=1&fields=*`)
        try {
            const fastestUrl = await this.fastest(urls)
            return fastestUrl
        } catch (err) {
            return err
        }
    }


    makeQueryUrl(options: SearchOption) {

        // offset for results. Defaults to 0 to get all results.
        // Set to ensure that future results are agnostic of offset presence
        options.offset = options.offset || 0

        if (!options.query)
            return new Error("No search query given")

        options.count = options.count || 10

        // Offsetting options. Ensure that the type of offset is number,
        // or string and add it to count value
        const localoffset = parseInt(options.offset) ?? 0

        // sort_by options: "def", "title", "publisher", "year", "pages",
        // "language", "filesize", "extension" (must be lowercase)
        const sort = options.sort_by || "def"

        // search_in options: "def", "title", "author", "series",
        // "periodical", "publisher", "year", "identifier", "md5",
        // "extension"
        const column = options.search_in || "def"

        // boolean
        const sortmode = (options.reverse ? "DESC" : "ASC")

        // Closest page : Use to modify starting page to value that may not be = 1.
        // 0-24  : page 1
        // 25-49 : page 2
        // 50-74 : page 3 ....
        const closestpage = (localoffset ? (Math.floor((localoffset) / 25) + 1) : 1)

        const queryUrl = options.mirror +
            "/search.php?&req=" +
            encodeURIComponent(options.query) +
            // important that view=detailed so we can get the real IDs
            "&view=detailed" +
            "&column=" + column +
            "&sort=" + sort +
            "&sortmode=" + sortmode +
            "&page=" + closestpage

        return queryUrl

    }

    async fetchIds(queryUrl) {

        try {
            const response = await fetch(queryUrl)
            const raw = await response.text()
            const parser = new DOMParser()
            const body = await parser.parseFromString(raw, "text/html")

            if (body === null)
                return new Error("Bad response: could not parse search results")

            const table = body.getElementsByTagName('table')[1]
            const textContent = table.getElementsByTagName('font')[0].textContent

            // parse no of result found from text using regex and cast to Integer
            const results = parseInt((RESULT_REGEX).exec(textContent)[1])

            if (!results)
                return new Error("Could not determine # of search results")

            if (results === 0)
                return new Error(`No results found`)

            const searchIds = this.extractIds(body)

            if (!searchIds)
                return new Error("Failed to parse search results for IDs")

            return searchIds

        } catch (err) {
            return err
        }
    }

    extractIds(Document: Document) {

        let ids = []

        const results = Document.getElementsByTagName('table')

        // reverse the order of the results because we walk through them
        for (let i = results.length - 1; i >= 0; i--) {

            let id;

            try {
                const fontCollection = results[i].getElementsByTagName('font')
                for (let i = 0; i <= fontCollection.length; i++) {

                    if (fontCollection[i].textContent.includes("ID:")) {
                        const parentEl = fontCollection[i].parentElement
                        id = parentEl.nextElementSibling.textContent.trim()
                    }
                }
            } catch (error) {
                return error
            }

            if (!parseInt(id)) continue
            else ids.push(id)
        }
        return ids
    }

    processIds(ids, options) {
        // slice options to trim data.
        // Initial check ensures that the slicing is required
        if (ids.length > options.count) {
            // slicing differs between offset variants. If offset !== 0,
            if (options.offset) {
                // find the closest page to start at
                const closestPage = (Math.floor((options.offset) / 25) + 1)
                // and then calculate the offset from there.
                // So, for offset 30, we skip to page 2 and then offset 5 ids from top. We then select $count items
                const start = (options.offset - (closestPage - 1) * 25)
                ids = ids.slice(start, start + options.count)
            } else {
                // basic slicing only to trim off items from the end.
                ids = ids.slice(0, options.count)
            }
        }
        return ids
    }

    async fetchByIds(ids: Array<Number>) {

        const url = `/json.php?ids=${ids.join(",")}&fields=*`

        try {
            const response = await fetch(url)
            const raw = await response.text()
            const data = JSON.parse(raw) // parse the json

            return data

        } catch (err) {
            // 
        }
    }

}

module.export = libgen