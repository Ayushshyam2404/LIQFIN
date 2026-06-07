"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const WebAuthnCredentialSchema = new mongoose_1.Schema({
    credentialID: { type: String, required: true },
    publicKey: { type: String, required: true },
    counter: { type: Number, required: true, default: 0 },
    transports: [String],
    createdAt: { type: Date, default: Date.now }
});
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    age: { type: Number, default: null },
    occupation: { type: String, default: '' },
    phone: { type: String, default: '' },
    webAuthnCredentials: [WebAuthnCredentialSchema],
    emailSyncSettings: {
        enabled: { type: Boolean, default: false },
        host: { type: String, default: 'imap.gmail.com' },
        port: { type: Number, default: 993 },
        secure: { type: Boolean, default: true },
        email: { type: String, default: '' },
        password: { type: String, default: '' },
        lastSync: { type: Date }
    },
    createdAt: { type: Date, default: Date.now }
});
// Hash password before saving
UserSchema.pre('save', function (next) {
    if (!this.password || !this.isModified('password'))
        return next();
    try {
        const salt = bcryptjs_1.default.genSaltSync(10);
        this.password = bcryptjs_1.default.hashSync(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Compare password method
UserSchema.methods.comparePassword = async function (password) {
    return bcryptjs_1.default.compare(password, this.password || '');
};
exports.User = (0, mongoose_1.model)('User', UserSchema);
