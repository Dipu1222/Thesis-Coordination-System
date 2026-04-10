module.exports = function(req, res, next) {
    // auth middleware should have set req.user
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.role && req.user.role === 'student') {
        return next();
    }

    return res.status(403).json({ message: 'Access denied. Students only.' });
};
