const documentationDB = require('../model/documentations')
const userCollection = require('../model/users');
const mongo = require('mongodb')
const bcrypt = require('bcrypt')

const getAllDocumentationContent = async (req, res) => {
    const Documentations = await documentationDB()

    res.status(200).send(await Documentations.find({})
    .project({
        "content": 1
    }).toArray())
}

// Get all documentation info
const getDocumentations = async (req, res) => {
    if (!req?.params?.version) {
        return res.status(400).json({ 'message': 'Version is required' });
    }

    const Documentations = await documentationDB()
    let documentationVersion = req.params.version
    
    if (!Documentations) return res.status(204).json({ 'message': 'No documentation found.' });

    res.status(200).send(await Documentations.find(
        {
        content: { 
            $elemMatch: { 
            "version": documentationVersion
            } 
        }
        }
    ).project(
        {
            "title": 1,
            "logo": 1,
            "githubLink": 1,
            "footer": 1,
            "content.$": 1
        }
    ).toArray())
}

// Get all versions
const getAllVersions = async (req, res) => {
    const Documentations = await documentationDB()
    
    if (!Documentations) return res.status(204).json({ 'message': 'No documentation found.' });

    res.status(200).send(await Documentations.find({}).project({"content.version": 1}).toArray())
}

// Get all Metadatas
const getMetadata = async (req, res) => {
    const Documentations = await documentationDB()
    const User = await userCollection()
    
    if (!Documentations || !User) return res.status(204).json({ 'message': 'Metadata not found.' });
    
    try {
        let webMetadata = await Documentations.find({}).project({
            "title": 1,
            "logo": 1,
            "githubLink": 1,
            "footer": 1
        }).toArray()
        let userMetadata = await User.find({}).project({
            "username" : 1
        }).toArray()
        res.status(200).send({
            "title" : webMetadata[0].title,
            "logo": webMetadata[0].logo,
            "githubLink": webMetadata[0].githubLink,
            "footer": webMetadata[0].footer,
            "username" : userMetadata[0].username
        })
    } catch (error) {
        res.status(400).send(error.message)
    }
}

const updateMetadata = async (req,res) => {
    const Documentations = await documentationDB()
    const User = await userCollection()
    
    if (!Documentations || !User) return res.status(204).json({ 'message': 'Metadata not found.'});

    if (!req?.body?.title || !req?.body?.logo || !req?.body?.githubLink || !req?.body?.footer || !req?.body?.username) {
        return res.status(400).json({'message': 'Please fill all required field'});
    }

    try {
        let data = {
            "title" : req.body.title,
            "logo" : req.body.logo,
            "githubLink" : req.body.githubLink,
            "footer" : req.body.footer
        }
        const updateDoc = await Documentations.updateOne({}, {
            $set : data
        })
        let user = {
            "username" : req.body.username
        }
        if(req.body.password.length >= 4){
            user.password = await bcrypt.hash(req.body.password, 10)
        }
        const updateUser = await User.updateOne({}, {
            $set : user
        })
        let update = {
            updateDoc,
            updateUser,
            "message" : "Metadata updated!"
        }
        res.status(200).send(update)
    } catch (error) {
        res.status(400).send(error.message)
    }

}

// Create documentation info
const createNewDocumentation = async (req, res) => {
    if (!req?.body?.title || !req?.body?.description || !req?.body?.logo || !req?.body?.logoLink || !req?.body?.footer || !req?.body?.content) {
        return res.status(400).json({ 'message': 'Title, Description, Logo, LogoLink, Footer, Content are required' });
    }

    const Documentations = await documentationDB()

    try {
        // insert documentation
        const insertedDocumentation = await Documentations.insertOne({
            title : req.body.title,
            logo : req.body.logo,
            description : req.body.description,
            githubLink : req.body.githubLink,
            footer : req.body.footer,
            content : req.body.content,
            createdAt : new Date(),
            updatedAt : new Date()
        })

        await Documentations.insertOne(insertedDocumentation)

        res.status(201).send({
            message : "Documentation Data Created!" 
        })
    } catch(err) {
        res.status(400).send({ message: err.message })
    }
}

// Edit documentation info
const updateDocumentation = async (req, res) => {
    if (!req?.body?.title || !req?.body?.description || !req?.body?.logo || !req?.body?.logoLink || !req?.body?.footer) {
        return res.status(400).json({ 'message': 'Title, Description, Logo, LogoLink, Footer are required' });
    }

    const Documentations = await documentationDB()

    const documentation = {
        title : req.body.title,
        logo : req.body.logo,
        description : req.body.description,
        githubLink : req.body.githubLink,
        footer : req.body.footer,
        updatedAt : new Date()
    }

    try {
        await Documentations.updateOne(
            {}, 
            {
                $set : documentation
            }
        )
        res.status(200).send({
            message : "Documentation Data Updated!"
        })
    } catch (error) {
        res.status(400).send({ message: error.message })
    }
    
}

// Delete documentation info
const deleteDocumentation = async (req, res) => {
    if (!req?.body?.id) return res.status(400).json({ 'message': 'Documentations ID required.' });

    const Documentations = await documentationDB()
    let objectId = new mongo.ObjectId(req.body.id)

    try {
        await Documentations.deleteOne({
            _id: objectId
        })
    } catch (error) {
        res.status(400).send({ message: error.message })
    }
    
    res.status(201).send({
        message : "Documentation Data Deleted!"
    })
}

module.exports = {
    getAllDocumentationContent,
    getDocumentations,
    getAllVersions,
    createNewDocumentation,
    updateDocumentation,
    deleteDocumentation,
    getMetadata,
    updateMetadata,
}