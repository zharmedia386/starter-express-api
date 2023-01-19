const chapterDB = require('../model/chapters')
const sectionsDB = require('../model/sections')
const documentationDB = require('../model/documentations')
const mongo = require('mongodb')

// Get all chapters info
const getAllChapters = async (req, res) => {
    const Chapters = await chapterDB()
    if (!Chapters) return res.status(204).json({ 'message': 'No chapter found.' });

    res.status(200).send(await Chapters.find({}).toArray())
}

// Get specified chapters info
const getChaptersById = async (req, res) => {
    if (!req?.params?.id) return res.status(400).json({ 'message': 'Chapters ID required.' });

    const Chapters = await chapterDB()
    let objectId = new mongo.ObjectId(req.params.id)

    if (!Chapters) {
        return res.status(204).json({ "message": `No chapters matches ID ${req.params.id}.` });
    }
    
    res.status(200).send(await Chapters.find({_id : objectId}).toArray())
}

// Create chapters info
const createNewChapter = async (req, res) => {
    // check all field required
    if (!req?.body?.title || !req?.body?.version) {
        return res.status(400).json({ 'message': 'Title, and version is required' });
    }

    const Chapters = await chapterDB();
    const Documentation = await documentationDB();

    try {
        // insert new chapters
        const insertedChapter = await Chapters.insertOne({
            title: req.body.title,
            version: req.body.version,
            createdAt: new Date(),
            updatedAt: new Date() 
        })

        // insert new chapters into documentations contents
        const result = await Documentation.updateOne(
            { content: { $elemMatch: { "version": `${req.body.version[0]}` } } },
            { $push: { "content.$.chapter": { "_id": insertedChapter.insertedId, "title": `${req.body.title}` } } }
        )

        // Check if chapters failed inserted into documentations content
        if ( result.modifiedCount == 0 ) {
            // Cancel inserting new sections
            await Chapters.deleteOne({ _id: insertedChapter.insertedId });
            throw new Error ("Error when try to insert chapter into documentations")
        }

        res.status(201).send({ message : "Chapters Data Created!" })
    } catch (err) {
        res.status(400).send({ message: err.message })
    }
}

const updateChapter = async (req, res) => {
    if (!req?.body?.id) return res.status(400).json({ 'message': 'Chapters ID required.' });

    if (!req?.body?.title) {
        return res.status(400).json({ 'message': 'Title is required' });
    }

    let chapterId = new mongo.ObjectId(req.body.id)

    const Chapters = await chapterDB();
    const Documentation = await documentationDB();

    const chapter = {
        title: req.body.title,
        updatedAt: new Date() 
    }

    try {
        // update chapter in chapter collections
        await Chapters.updateOne(
            { _id: chapterId },
            { $set: chapter }
        )
        
        // updating chapter title in documentation content
        await Documentation.updateOne(
            {},
            { $set: { "content.$[].chapter.$[ch].title": `${chapter.title}` } },
            { arrayFilters: [ { "ch._id": chapterId } ] }
        )
    } catch (error) {
        res.status(400).send({ message: error.message })
    }

    res.status(201).send({ message : "Chapters Data Updated!" })
}

// const deleteChapter = async (req, res) => {
//     if (!req?.body?.id || !req?.body?.version) return res.status(400).json({ 'message': 'Chapters ID and version required.' });

//     let chapterId = new mongo.ObjectId(req.body.id)

//     const Chapters = await chapterDB()
//     const Documentation = await documentationDB();

//     try {
//         // update chapter in section collections
//         await Chapters.deleteOne(
//             { _id: chapterId }
//         )
        
//         // updating chapter title in documentation content
//         await Documentation.updateOne(
//             {},
//             { $pull: { "content.$[ct].chapter": { "_id": chapterId } } },
//             { arrayFilters: [ { "ct.version":  req.body.version[0]} ] }
//         )
//     } catch (error) {
//         res.status(400).send({ message: error.message })
//     }

//     res.status(201).send({ message : "Chapters Data Deleted!" })
// }

const deleteChapter = async (req, res) => {
    let content = req.body.content;
    let chapterId = req.body.chapterId;

    const section = []

    for (const ct of content) {
        // Check if in version exist atleast one chapter
        if(!ct?.chapter) { break }

        const chapter = ct.chapter.find((c) => c._id == chapterId)

        if(!chapter?.section) { continue }

        const sectionId = chapter.section.map((sc) => new mongo.ObjectId(sc._id))

        section.push({version: ct.version, section: sectionId})
    }

    chapterId = new mongo.ObjectId(chapterId);

    const Sections = await sectionsDB();
    const Chapter = await chapterDB();
    const Documentation = await documentationDB();

    try {
        // Delete chapter in chapter collections
        let result = await Chapter.deleteOne(
            { _id: chapterId }
        )

        // Delete chapter in documentation structure
        result = await Documentation.updateOne(
            {},
            { $pull: { "content.$[].chapter": { _id: chapterId } } }
        )

        // Delete version from chapter in section
        for (const sc of section) {
            result = await Sections.updateMany(
                { _id: { $in: sc.section } },
                { $pull: { version: sc.version } }
            )
        }
    } catch (error) {
        res.status(400).send({ message: error.message })
    }

    res.status(201).send({ message : "Berhasil menghapus chapter" })
}

module.exports = {
    getAllChapters,
    getChaptersById,
    createNewChapter,
    updateChapter,
    deleteChapter
}