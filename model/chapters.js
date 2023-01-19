const { MongoClient } = require("mongodb")

const connectionString = process.env.MONGO_URI

const chaptersDB = async () => {
    const client = await MongoClient.connect(connectionString, {
        useNewUrlParser: true
    })

    return client.db('cms_docs').collection('chapters')
}

module.exports = chaptersDB