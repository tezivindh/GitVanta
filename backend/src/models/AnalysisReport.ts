import mongoose, { Schema } from 'mongoose';
import { AnalysisReport as IAnalysisReport } from '../types';

const breakdownItemSchema = new Schema(
  {
    metric: { type: String, required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    description: { type: String, required: true },
    suggestion: { type: String },
  },
  { _id: false }
);

const categoryScoresSchema = new Schema(
  {
    codeQuality: { type: Number, required: true, min: 0, max: 100 },
    documentation: { type: Number, required: true, min: 0, max: 100 },
    activity: { type: Number, required: true, min: 0, max: 100 },
    diversity: { type: Number, required: true, min: 0, max: 100 },
    community: { type: Number, required: true, min: 0, max: 100 },
    professionalism: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const detailedBreakdownSchema = new Schema(
  {
    codeQuality: [breakdownItemSchema],
    documentation: [breakdownItemSchema],
    activity: [breakdownItemSchema],
    diversity: [breakdownItemSchema],
    community: [breakdownItemSchema],
    professionalism: [breakdownItemSchema],
  },
  { _id: false }
);

const extractedSkillSchema = new Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['language', 'framework', 'tool', 'database', 'cloud', 'other'],
      required: true,
    },
    proficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      required: true,
    },
    projectCount: { type: Number, required: true },
    totalLines: { type: Number },
  },
  { _id: false }
);

const weaknessSchema = new Schema(
  {
    category: { type: String, required: true },
    issue: { type: String, required: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    recommendation: { type: String, required: true },
  },
  { _id: false }
);

const improvementSchema = new Schema(
  {
    priority: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    estimatedImpact: { type: String, required: true },
    actionItems: [{ type: String }],
  },
  { _id: false }
);

const badgeSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    earnedAt: { type: Date, required: true },
    category: { type: String, required: true },
  },
  { _id: false }
);

const analyzedRepositorySchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    description: { type: String, default: null },
    language: { type: String, default: null },
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    topics: [{ type: String }],
  },
  { _id: false }
);

const analysisReportSchema = new Schema<IAnalysisReport>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    categoryScores: {
      type: categoryScoresSchema,
      required: true,
    },
    detailedBreakdown: {
      type: detailedBreakdownSchema,
      required: true,
    },
    skills: [extractedSkillSchema],
    weaknesses: [weaknessSchema],
    improvements: [improvementSchema],
    badges: [badgeSchema],
    repositories: [analyzedRepositorySchema],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
analysisReportSchema.index({ userId: 1, generatedAt: -1 });
analysisReportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AnalysisReport = mongoose.model<IAnalysisReport>('AnalysisReport', analysisReportSchema);

export default AnalysisReport;
