const User = require('../model/users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const handleLogin = async (req, res) => {
    const Users = await User()
    const { user, pwd } = req.body;
    if (!user || !pwd) return res.status(400).json({ 'message': 'Username and password are required.' });
    
    let foundUser = await Users.find({ username: user }).toArray();
    if (!foundUser) return res.sendStatus(401); //Unauthorized 
    
    // evaluate password 
    // console.log(pwd)
    // console.log(foundUser[0].password)
    const match = await bcrypt.compare(pwd, foundUser[0].password);
    if (match) {
        // create JWTs
        const accessToken = jwt.sign(
            { "username": foundUser[0].username },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '30m' }
        );
        const refreshToken = jwt.sign(
            { "username": foundUser[0].username },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        );

        // Saving refreshToken with current user
        // foundUser[0].refreshToken = refreshToken;
        const result = await Users.updateOne({}, {$set: {
            refreshToken: refreshToken
        }});
        console.log(result);

        // Users.refreshToken = refreshToken;
        // const result = await Users.updateOne();
        // console.log(result);
        
        // Creates Secure Cookie with refresh token
        res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 });
        
        // Send authorization roles and access token to user
        res.json({ accessToken });
    } else {
        res.sendStatus(401);
    }
}

const checkToken = async (req,res) => {
    const Users = await User()
    const token = req.params.token
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        let foundUser = await Users.find({ username: decoded.username }).toArray();
        if (!foundUser) return res.status(401).send("Username not found");
        const accessToken = jwt.sign(
            { "username": decoded.username },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '30m' }
        )
        res.status(200).send(accessToken)
    } catch (err) {
        res.status(401).send(err.message)
    }
}

module.exports = { handleLogin, checkToken };