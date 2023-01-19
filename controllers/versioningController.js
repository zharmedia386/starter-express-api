const mongo = require('mongodb')
const sectionsDB = require('../model/sections')
const chapterDB = require('../model/chapters')
const documentationDB = require('../model/documentations')

const createVersion = async (req, res) => {
    const versionName = req.body.versionName

    const Documentation = await documentationDB();

    try {
        // Add new version into documentation
        await Documentation.updateOne(
            {},
            { $push: { "content": { version: versionName } } }
        )
    } catch (error) {
        res.status(400).send({ message: error.message })
    }

    res.status(201).send({ message: "Successfully created a version" })
}

const editVersion = async (req, res) => {
    const editedVersion = req.body.editedVersion;
    const newVersionName = req.body.newVersionName;

    const Documentation = await documentationDB();

    try {
        // Replace current version name with new version name
        await Documentation.updateOne(
            {},
            { $set: { "content.$[ct].version": newVersionName } },
            { arrayFilters: [ { "ct.version": editedVersion } ] }
        )
    } catch (error) {
        res.status(400).send({ message: error.message })
    }

    res.status(201).send({ message: "Successfully edited a version" })
}

const deleteVersion = async (req, res) => {
    let rawContent = req.body.content
    let deletedContent = []

    // Extract content id
    for(const content of rawContent ?? []) {
        // Extracted content
        let ct = {
            version:content?.version,
            chapterId: [],
            sectionId: []
        }

        // Extract content chapter id
        for(const chapter of content?.chapter ?? []) {
            ct.chapterId.push(new mongo.ObjectId(chapter?._id))

            // Extract content section id
            for(const section of chapter?.section ?? []) {
                ct.sectionId.push(new mongo.ObjectId(section?._id))
            }
        }

        // Push extracted content within version
        deletedContent.push(ct)
    }

    const Sections = await sectionsDB();
    const Chapter = await chapterDB();
    const Documentation = await documentationDB();

    for(const content of deletedContent ?? []) {
        // Delete section if exist
        if(content.sectionId.length) {
            await Sections.updateMany(
                { _id: { $in: content.sectionId} },
                { $pull: { version: content.version } }
            )
        }

        // Delete chapter if exist
        if(content.chapterId.length) {
            await Chapter.updateMany(
                { _id: { $in: content.chapterId } },
                { $pull: { version: content.version } }
            )
        }

        // Delete version in documentation content
        await Documentation.updateOne(
            {},
            { $pull: { content: { version: content.version } } }
        )
    }

    res.status(201).send({ message: "Successfully deleted version" })
}

const reorderDocumentationsContent = async (req, res) => {
    if (!req?.body?.content) return res.status(400).json({ 'message': 'Documentations content required.' });

    let content = req.body.content
    
    // convert _id string to object id
    for (ct of content) {
        if(!ct?.chapter) { break }

        for (ch of ct.chapter) {
            if(!ch?.section) { break }

            ch._id = new mongo.ObjectId(ch._id)
            for (sc of ch.section) {
                sc._id = new mongo.ObjectId(sc._id)
            }
        }
    }

    const Documentation = await documentationDB();

    try {
        // Replace old content with new content
        await Documentation.updateOne(
            {},
            { $set: { "content": content } }
        )
    } catch (error) {
        res.status(400).send({ message: error.message })
    }
    
    res.status(201).send({ message: "Successfully changed content structure" })
}

const addSection = async (req, res) => {
    const sections = req.body.sections
        .map(section => (!section?.alias) ? 
            ({_id: new mongo.ObjectId(section._id), title: section.title}) : 
            ({_id: new mongo.ObjectId(section._id), title: section.title, alias: section.alias})
        );
    const sectionsId = sections.map(section => section._id)
    const chapterId = new mongo.ObjectId(req.body.chapter)
    let version = req.body.version;

    const Sections = await sectionsDB();
    const Documentation = await documentationDB();

    try {
        // Add version into section in section collection
        let result = await Sections.updateMany(
            { _id: { $in: sectionsId } },
            { $push: { version: version } }
        )
        
        // Add version into section in documentation content
        result = await Documentation.updateOne(
            {},
            { $push: { "content.$[ct].chapter.$[ch].section": { $each: sections } } },
            { arrayFilters: [ { "ct.version": version }, { "ch._id": chapterId } ] }
        )

    } catch (error) {
        res.status(400).send({ message: error.message })
    }

    res.status(201).send({ message : "Successfully added section" })
}

const deleteSection = async (req, res) => {
    const version = req.body.version;
    const sectionId = new mongo.ObjectId(req.body.sectionId)

    const Sections = await sectionsDB();
    const Documentation = await documentationDB();

    try {
        // Remove version from section in section collection
        let result = await Sections.updateOne(
            { _id: sectionId },
            { $pull: { version: version } }
        )
        
        // Delete section from documentation content
        result = await Documentation.updateOne(
            {},
            { $pull: { "content.$[ct].chapter.$[].section": { _id: sectionId } } },
            { arrayFilters: [ { "ct.version": version } ] }
        )
    } catch (error) {
        res.status(400).send({ message: error.message })
    }

    res.status(201).send({ message : "Successfully deleted section" })
}

const addChapter = async (req, res) => {
    const chapters = req.body.chapters.map(ch => ({_id: new mongo.ObjectId(ch._id), title: ch.title}));
    const chaptersId = chapters.map(ch => ch._id)
    const version = req.body.version;

    const Chapter = await chapterDB();
    const Documentation = await documentationDB();

    try {
        // Add version into chapter in chapter collection
        let result = await Chapter.updateMany(
            { _id: { $in: chaptersId } },
            { $push: { version: version } }
        )
        
        // Add chapter into documentation content
        result = await Documentation.updateOne(
            {},
            { $push: { "content.$[ct].chapter": { $each: chapters } } },
            { arrayFilters: [ { "ct.version": version } ] }
        )
    } catch (error) {
        res.status(400).send({ message: error.message })
    }

    res.status(201).send({ message : "Successfully added chapter" })
}

const deleteChapter = async (req, res) => {
    const version = req.body.version;
    const chapterId = new mongo.ObjectId(req.body.chapterId)
    const sectionsId = req.body.sectionsId.map(id => new mongo.ObjectId(id));

    const Sections = await sectionsDB();
    const Chapter = await chapterDB();
    const Documentation = await documentationDB();

    try {
        // Delete version from chapter in chapter collection
        let result = await Chapter.updateOne(
            { _id: chapterId },
            { $pull: { version: version } }
        )

        // Delete version from documentation content
        result = await Documentation.updateOne(
            {},
            { $pull: { "content.$[ct].chapter": { _id: chapterId } } },
            { arrayFilters: [ { "ct.version": version } ] }
        )

        // Delete version in section that child of the deleted chapter
        if(sectionsId.length){
            result = await Sections.updateMany(
                { _id: { $in: sectionsId } },
                { $pull: { version: version } }
            )
        }
    } catch (error) {
        res.status(400).send({ message: error.message })
    }

    res.status(201).send({ message : "Successfully deleted chapter" })
}

module.exports = {
    createVersion,
    editVersion,
    deleteVersion,
    reorderDocumentationsContent,
    addSection,
    deleteSection,
    addChapter,
    deleteChapter
}