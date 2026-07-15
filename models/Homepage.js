import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

/**
 * Homepage collection — Sprint 15. A singleton (always exactly one
 * document) holding every CMS-editable homepage section defined in the CRS
 * (§4-8): Hero, Why It Matters, Our Vision, What We Do, Membership CTA.
 * Card-style sub-sections (whyItMatters.points, vision.pillars,
 * whatWeDo.cards) are fully dynamic lists — admin adds/removes/reorders
 * freely, the public page renders however many `active` items exist, no
 * fixed count is enforced (the illustrations these feed simply wrap/repeat
 * their grid to fit whatever count is active).
 */
const ImageSchema = new Schema(
  {
    url: { type: String, default: '' },
    alt: { type: String, trim: true, maxlength: 150, default: '' },
  },
  { _id: false }
);

const CardSchema = new Schema({
  icon: { type: String, trim: true, default: '' },
  title: { type: String, trim: true, maxlength: 150, default: '' },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  displayOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
});

const WhatWeDoCardSchema = new Schema({
  image: { type: ImageSchema, default: () => ({}) },
  title: { type: String, trim: true, maxlength: 150, default: '' },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  ctaLabel: { type: String, trim: true, maxlength: 60, default: '' },
  ctaUrl: { type: String, trim: true, default: '' },
  displayOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
});

const HomepageSchema = new Schema(
  {
    hero: {
      heading: { type: String, trim: true, maxlength: 200, default: '' },
      subHeading: { type: String, trim: true, maxlength: 300, default: '' },
      description: { type: String, trim: true, maxlength: 300, default: '' },
      primaryButtonText: { type: String, trim: true, maxlength: 60, default: '' },
      primaryButtonUrl: { type: String, trim: true, default: '' },
      secondaryButtonText: { type: String, trim: true, maxlength: 60, default: '' },
      secondaryButtonUrl: { type: String, trim: true, default: '' },
      illustrationImage: { type: ImageSchema, default: () => ({}) },
      backgroundImage: { type: ImageSchema, default: () => ({}) },
    },
    whyItMatters: {
      eyebrow: { type: String, trim: true, maxlength: 60, default: '' },
      title: { type: String, trim: true, maxlength: 200, default: '' },
      description: { type: String, trim: true, maxlength: 300, default: '' },
      points: { type: [CardSchema], default: [] },
    },
    vision: {
      eyebrow: { type: String, trim: true, maxlength: 60, default: '' },
      title: { type: String, trim: true, maxlength: 200, default: '' },
      description: { type: String, trim: true, maxlength: 300, default: '' },
      pillars: { type: [CardSchema], default: [] },
    },
    whatWeDo: {
      eyebrow: { type: String, trim: true, maxlength: 60, default: '' },
      title: { type: String, trim: true, maxlength: 200, default: '' },
      description: { type: String, trim: true, maxlength: 300, default: '' },
      cards: { type: [WhatWeDoCardSchema], default: [] },
    },
    membershipCta: {
      heading: { type: String, trim: true, maxlength: 200, default: '' },
      description: { type: String, trim: true, maxlength: 300, default: '' },
      buttonText: { type: String, trim: true, maxlength: 60, default: '' },
      buttonUrl: { type: String, trim: true, default: '' },
      backgroundImage: { type: ImageSchema, default: () => ({}) },
      active: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

HomepageSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    hero: this.hero,
    whyItMatters: this.whyItMatters,
    vision: this.vision,
    whatWeDo: this.whatWeDo,
    membershipCta: this.membershipCta,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Homepage = models.Homepage || model('Homepage', HomepageSchema);

/**
 * Seed content — mirrors the hardcoded arrays this sprint replaces in the
 * pre-Sprint-15 app/page.js, so the first deploy is a visual no-op.
 */
const DEFAULT_HOMEPAGE = {
  hero: {
    heading: 'Helping Adults 50+ Stay Strong, Independent, and Confident.',
    subHeading: 'Exercise. Education. Community.',
    description: 'Small Steps. Stronger Years.',
    primaryButtonText: 'Take Your First Step',
    primaryButtonUrl: '/join',
    secondaryButtonText: 'Explore Knowledge Center',
    secondaryButtonUrl: '/knowledge-center',
    illustrationImage: { url: '', alt: '' },
    backgroundImage: { url: '', alt: '' },
  },
  whyItMatters: {
    eyebrow: 'Why it matters',
    title: 'The years after 50 bring real, but manageable, challenges',
    description:
      'These are the five things we hear most — every one of them is a warning sign you can act on early.',
    points: [
      { icon: 'MoveUp', title: 'Climbing Stairs', description: "Struggling with stairs is one of the earliest signs of declining leg strength and mobility — and it's often the first thing that limits your independence at home.", displayOrder: 0, active: true },
      { icon: 'MapPin', title: 'Walking Long Distances', description: 'When walking to the market or a family function becomes an effort, it quietly shrinks your world. We help you rebuild the endurance to go wherever life takes you.', displayOrder: 1, active: true },
      { icon: 'PersonStanding', title: 'Joint Pains', description: "Joint discomfort is common after 50, but it doesn't have to be permanent. The right movement — done the right way — can reduce pain and improve daily function.", displayOrder: 2, active: true },
      { icon: 'BatteryLow', title: 'Low Energy', description: 'Fatigue after 50 is often a signal of muscle loss, poor nutrition, or inactivity — all of which can be addressed. More energy means more life.', displayOrder: 3, active: true },
      { icon: 'ShieldAlert', title: 'Balance', description: 'Falls are the leading cause of injury in older adults. Balance training is one of the most powerful things you can do to stay safe, confident, and independent.', displayOrder: 4, active: true },
    ],
  },
  vision: {
    eyebrow: 'Our vision',
    title: 'What Stronger Steps Actually Look Like',
    description: 'These are the four outcomes we build every programme, tool, and community event around.',
    pillars: [
      { icon: 'Dumbbell', title: 'Strength', description: 'Build real, functional strength that lets you lift, carry, climb, and live without limitations.', displayOrder: 0, active: true },
      { icon: 'Star', title: 'Confidence', description: "Move through the world with the quiet assurance that your body won't let you down.", displayOrder: 1, active: true },
      { icon: 'Users', title: 'Social Life', description: 'Stay active in family gatherings, community events, and the moments that matter most.', displayOrder: 2, active: true },
      { icon: 'HeartHandshake', title: 'Independence', description: 'Live life on your own terms — at home, in your neighbourhood, and beyond.', displayOrder: 3, active: true },
    ],
  },
  whatWeDo: {
    eyebrow: 'What we do',
    title: 'Four Ways We Support Your Stronger Steps',
    description: '',
    cards: [
      { image: { url: 'https://picsum.photos/seed/stronger-steps-csr/600/450', alt: '' }, title: 'External CSR Programs', description: 'We partner with corporates and organisations on wellness initiatives for adults 50+ and employees supporting aging parents.', ctaLabel: '', ctaUrl: '', displayOrder: 0, active: true },
      { image: { url: 'https://picsum.photos/seed/stronger-steps-personal-care/600/450', alt: '' }, title: 'Personal Care', description: 'Safe, structured movement and health guidance for ages 50+ — from gentle mobility routines to progressive strength training designed to rebuild function.', ctaLabel: '', ctaUrl: '', displayOrder: 1, active: true },
      { image: { url: 'https://picsum.photos/seed/stronger-steps-social/600/450', alt: '' }, title: 'Social Activities', description: 'Group events, community walks, and peer gatherings that keep you connected, motivated, and surrounded by people who understand the journey.', ctaLabel: '', ctaUrl: '', displayOrder: 2, active: true },
      { image: { url: 'https://picsum.photos/seed/stronger-steps-loved-ones/600/450', alt: '' }, title: 'Following Our Loved Ones', description: 'Supporting families in staying close to aging parents and relatives — with guidance, check-ins, and tools that bring peace of mind to everyone involved.', ctaLabel: '', ctaUrl: '', displayOrder: 3, active: true },
    ],
  },
  membershipCta: {
    heading: 'Ready to take stronger steps?',
    description: 'Join our community for weekly tips and updates, or explore a membership plan built around your goals.',
    buttonText: 'Take Your First Step',
    buttonUrl: '/join',
    backgroundImage: { url: '', alt: '' },
    active: true,
  },
};

/**
 * Fetches the singleton Homepage doc, creating it from DEFAULT_HOMEPAGE on
 * first call. Callers must already have connectDB() resolved.
 */
export async function getOrCreateHomepage() {
  let doc = await Homepage.findOne({});
  if (!doc) {
    doc = await Homepage.create(DEFAULT_HOMEPAGE);
  }
  return doc;
}

export default Homepage;
