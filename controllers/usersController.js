const User = require('../model/users');
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");

const getAllUsers = async (req, res) => {
    const users = await User.find();
    if (!users) return res.status(204).json({ 'message': 'No users found' });
    res.json(users);
}

const deleteUser = async (req, res) => {
    if (!req?.body?.id) return res.status(400).json({ "message": 'User ID required' });
    const user = await User.findOne({ _id: req.body.id }).exec();
    if (!user) {
        return res.status(204).json({ 'message': `User ID ${req.body.id} not found` });
    }
    const result = await user.deleteOne({ _id: req.body.id });
    res.json(result);
}

const getUser = async (req, res) => {
    if (!req?.params?.id) return res.status(400).json({ "message": 'User ID required' });
    const user = await User.findOne({ _id: req.params.id }).exec();
    if (!user) {
        return res.status(204).json({ 'message': `User ID ${req.params.id} not found` });
    }
    res.json(user);
}

const resetPassword = async (req, res) => {
    if(!req?.body?.email) return res.status(400).json({"message" : "Email is required"})

    const Users = await User()

    if (!Users) return res.status(204).json({ 'message': 'No user found.' });

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let newPassword = ""
    for(let i = 0; i < 10; i++){
        newPassword += characters.charAt(Math.floor(Math.random() * characters.length))
    }

    try {
        let [user] = await Users.find().toArray()
        const update = await Users.updateOne({}, {
            $set : {
                "password" : await bcrypt.hash(newPassword, 10)
            }
        })
        if(update.modifiedCount == 1){
            const transport = nodemailer.createTransport({
                host: "smtp.mailtrap.io",
                port: 2525,
                auth: {
                  user: "0330f88642c22f",
                  pass: "7abf325262f679"
                }
            });

            const send = transport.sendMail({
                from: '"CMS Team" <cmsteam@example.com>',
                to : req.body.email,
                subject: "Reset Password",
                text: "New Password : " + newPassword,
                html: "<h1>New Password : " + newPassword + "</h1>"
            })
            console.log(newPassword)
            res.status(200).send({
                "message" : "Reset password success!"
            })
        }
        else{
            throw "Reset password failed!"
        }
        
    } catch (error) {
        res.status(400).send({"message" : error.message})
    }

    
    
}

module.exports = {
    getAllUsers,
    deleteUser,
    getUser,
    resetPassword
}