const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const docladSchema = new Schema({
    email: {type: String, required: true},
    username: { type: String, required: true },
    section: { type: String, required: true },
    docladname: {type: String, required: true},
    filename: {type: String, required: true },
    content: {type: String, required: true},
    status: {
        type: String,
        enum: ['under_consideration', 'rejected', 'revision'],
        default: 'under_consideration'
    }
});

const updateDocladStatus = async (docladname, newStatus) => {
    try {
        const doclad = await Doclad.find(docladname);
        if (!doclad) {
            return { error: 'Doclad not found' };
        }
        doclad.status = newStatus;
        await doclad.save();
        return { message: 'Doclad status updated successfully' };
    } catch (error) {
        return { error: error.message };
    }
};
module.exports = { updateDocladStatus };

const changeDocladSection = async (docladname, newSection) => {
    try {
        const doclad = await Doclad.find(docladname);
        if (!doclad) {
            return { error: 'Doclad not found' };
        }
        doclad.status = newSection;
        await doclad.save();
        return { message: 'Doclad section updated successfully' };
    } catch (error) {
        return { error: error.message };
    }
};
module.exports = { changeDocladSection };

const Doclad = mongoose.model('Doclad', docladSchema);

module.exports = Doclad;
