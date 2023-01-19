const { MongoClient } = require("mongodb")

const connectionString = process.env.MONGO_URI

const usersDB = async () => {
    const client = await MongoClient.connect(connectionString, {
        useNewUrlParser: true
    })

    return client.db('cms_docs').collection('users')
}

module.exports = usersDB