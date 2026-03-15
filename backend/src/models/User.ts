import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types';

const userSchema = new Schema<IUser>(
  {
    githubId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    profileUrl: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    company: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    blog: {
      type: String,
      default: '',
    },
    publicRepos: {
      type: Number,
      default: 0,
    },
    followers: {
      type: Number,
      default: 0,
    },
    following: {
      type: Number,
      default: 0,
    },
    accessToken: {
      type: String,
      required: true,
      select: false, //don't include in queries by default
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.accessToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

//Indexes for better query performance
userSchema.index({ createdAt: -1 });
userSchema.index({ username: 'text', displayName: 'text' });

const User = mongoose.model<IUser>('User', userSchema);

export default User;
