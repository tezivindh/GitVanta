import mongoose, { Schema } from 'mongoose';
import { RepoInsight as IRepoInsight } from '../types';

const repoInsightSchema = new Schema<IRepoInsight>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    repoId: {
      type: Number,
      required: true,
    },
    repoName: {
      type: String,
      required: true,
    },
    repoFullName: {
      type: String,
      required: true,
    },
    languages: {
      type: Map,
      of: Number,
      default: {},
    },
    hasReadme: {
      type: Boolean,
      default: false,
    },
    readmeQuality: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    hasLicense: {
      type: Boolean,
      default: false,
    },
    hasContributing: {
      type: Boolean,
      default: false,
    },
    hasTests: {
      type: Boolean,
      default: false,
    },
    commitFrequency: {
      type: Number,
      default: 0,
    },
    lastCommitDate: {
      type: Date,
    },
    issueResponseTime: {
      type: Number,
      default: 0,
    },
    codeComplexity: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    documentationScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    analyzedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
repoInsightSchema.index({ userId: 1, repoId: 1 }, { unique: true });
repoInsightSchema.index({ userId: 1, analyzedAt: -1 });
repoInsightSchema.index({ repoFullName: 1 });

const RepoInsight = mongoose.model<IRepoInsight>('RepoInsight', repoInsightSchema);

export default RepoInsight;
