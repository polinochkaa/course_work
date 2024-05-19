const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'sectionhead', 'admin'], default: 'user' },
    section: {type: String, default: NaN}
});

// Метод для установки пароля пользователя с хешированием
userSchema.methods.setPassword = function(password) {
    this.password = bcrypt.hashSync(password, 10);
};

// Метод для проверки пароля
userSchema.methods.verifyPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

const updateUserRole = async (email, newRole) => {
    try {
        const user = await User.find(email);
        if (!user) {
            return { error: 'User not found' };
        }
        user.role = newRole;
        await user.save();
        return { message: 'User role updated successfully' };
    } catch (error) {
        return { error: error.message };
    }
};

module.exports = { updateUserRole };

const User = mongoose.model('User', userSchema);

module.exports = User;
