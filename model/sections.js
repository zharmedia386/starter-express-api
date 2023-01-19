const { MongoClient } = require("mongodb")

const connectionString = process.env.MONGO_URI

const sectionsDB = async () => {
    const client = await MongoClient.connect(connectionString, {
        useNewUrlParser: true
    })

    return client.db('cms_docs').collection('sections')
}

module.exports = sectionsDB