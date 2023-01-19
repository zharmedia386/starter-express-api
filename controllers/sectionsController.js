const sectionsDB = require('../model/sections')
const documentationDB = require('../model/documentations')
const mongo = require('mongodb')

// Get all sections info
const getAllSections = async (req, res) => {
    const Sections = await sectionsDB()
    if (!Sections) return res.status(204).json({ 'message': 'No section found.' });

    res.status(200).send(await Sections.find({}).toArray())
}

// Get specified sections info
const getSectionsById = async (req, res) => {
    if (!req?.params?.id) return res.status(400).json({ 'message': 'Sections ID required.' });

    const Sections = await sectionsDB()
    let objectId = new mongo.ObjectId(req.params.id)

    if (!Sections) {
        return res.status(204).json({ "message": `No sections matches ID ${req.params.id}.` });
    }
    
    res.status(200).send(await Sections.find({_id : objectId}).toArray())
}

// Create documentation info
const createNewSection = async (req, res) => {
    // check all field required
    if (!req?.body?.title || !req?.body?.content) {
        return res.status(400).json({ 'message': 'Title and content is required' });
    }

    const Sections = await sectionsDB()

    try {
        // insert new sections
        let section = {
            title: req.body.title,
            content: req.body.content,
            createdAt: new Date(),
            updatedAt: new Date() 
        }
        if(req.body.alias && req.body.alias.length != 0) section.alias = req.body.alias;
        const insertedSection = await Sections.insertOne(section)
        console.log(insertedSection)

        res.status(200).send({ message : "Sections Data Created!" })
    } catch (err) {
        res.status(400).send({ message: err.message })
    }
}

const updateSection = async (req, res) => {
    if (!req?.body?.id) return res.status(400).json({ 'message': 'Sections ID required.' });

    if (!req?.body?.title || !req?.body?.content) {
        return res.status(400).json({ 'message': 'Title and content is required' });
    }

    let sectionId = new mongo.ObjectId(req.body.id)

    const Sections = await sectionsDB()

    let section = {
        title: req.body.title,
        content: req.body.content
    }

    if(req.body.alias && req.body.alias.length != 0) section.alias = req.body.alias;

    try {
        // update section in section collections
        await Sections.updateOne(
            { _id: sectionId },
            { $set: section }
        )
    } catch (error) {
        res.status(400).send({ message: error.message })
    }



    res.status(201).send({ message : "Sections Data Updated!" })
}

const deleteSection = async (req, res) => {
    console.log(req.body)
    if (!req?.body?.id) return res.status(400).json({ 'message': 'Sections ID required.' });
    
    let sectionId = new mongo.ObjectId(req.body.id)

    const Sections = await sectionsDB()
    const Documentation = await documentationDB();

    try {
        // update section in section collections
        await Sections.deleteOne(
            { _id: sectionId }
        )
        
        // updating section title in documentation content
        await Documentation.updateOne(
            {},
            { $pull: { "content.$[].chapter.$[].section": { "_id": sectionId } } }
        )
    } catch (error) {
        res.status(400).send({ message: error.message })
    }

    res.status(201).send({ message : "Sections Data Deleted!" })
}

module.exports = {
    getAllSections,
    getSectionsById,
    createNewSection,
    updateSection,
    deleteSection
}